import { AudioContext } from 'web-audio-api';
import Meyda from 'meyda';
import { Lame } from 'node-lame';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import audioDecode from 'audio-decode';
import { EventEmitter } from 'events';
import Microphone from 'node-microphone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 音频处理器类
 * 负责处理音频输入并提取特征
 */
class AudioProcessor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sampleRate: 16000,
            frameSize: 1024,  // 2^10
            hopSize: 512,     // 2^9
            tempDir: path.join(path.dirname(__dirname), 'temp'),
            ...options
        };

        // 确保 frameSize 是 2 的幂
        if (this.options.frameSize & (this.options.frameSize - 1)) {
            throw new Error('frameSize 必须是 2 的幂，例如：512, 1024, 2048 等');
        }

        this.audioContext = new AudioContext({
            sampleRate: this.options.sampleRate
        });

        // 确保临时目录存在
        if (!fs.existsSync(this.options.tempDir)) {
            fs.mkdirSync(this.options.tempDir, { recursive: true });
        }
    }

    /**
     * 处理音频文件
     * @param {string} filePath - 音频文件路径
     * @returns {Promise<Float32Array>} 处理后的音频数据
     */
    async processFile(filePath) {
        const fileExt = path.extname(filePath).toLowerCase();
        let processedFilePath = filePath;

        // 如果是 MP3 文件，先转换为 WAV
        if (fileExt === '.mp3') {
            processedFilePath = await this._convertMp3ToWav(filePath);
        }

        const buffer = await this._loadAudioFile(processedFilePath);
        const features = this._extractFeatures(buffer);

        // 清理临时文件
        if (processedFilePath !== filePath) {
            fs.unlinkSync(processedFilePath);
        }

        return features;
    }

    /**
     * 将 MP3 转换为 WAV 格式
     * @private
     * @param {string} mp3Path - MP3 文件路径
     * @returns {Promise<string>} WAV 文件路径
     */
    async _convertMp3ToWav(mp3Path) {
        const wavPath = path.join(
            this.options.tempDir,
            `${path.basename(mp3Path, '.mp3')}_${Date.now()}.wav`
        );

        return new Promise((resolve, reject) => {
            ffmpeg(mp3Path)
                .toFormat('wav')
                .outputOptions([
                    `-ar ${this.options.sampleRate}`,
                    '-ac 1', // 转换为单声道
                    '-bits_per_raw_sample 16' // 16位采样
                ])
                .save(wavPath)
                .on('end', () => resolve(wavPath))
                .on('error', (err) => reject(err));
        });
    }

    /**
     * 加载音频文件
     * @private
     */
    async _loadAudioFile(filePath) {
        const fileData = await fs.promises.readFile(filePath);
        const audioBuffer = await audioDecode(fileData);

        // 确保采样率匹配
        if (audioBuffer.sampleRate !== this.options.sampleRate) {
            // 这里可以添加重采样逻辑
            console.warn('警告：音频采样率与设定不匹配，可能影响识别效果');
        }

        return audioBuffer;
    }

    /**
     * 开始音频流处理
     * @returns {Promise<EventEmitter>} 音频流事件发射器
     */
    async startStream() {
        const mic = new Microphone({
            rate: this.options.sampleRate,
            channels: 1,
            debug: false
        });

        const micStream = mic.startRecording();

        // 创建缓冲区来存储音频数据
        let buffer = new Float32Array(this.options.frameSize);
        let bufferOffset = 0;

        micStream.on('data', (data) => {
            // 将音频数据添加到缓冲区
            for (let i = 0; i < data.length; i++) {
                if (bufferOffset >= this.options.frameSize) {
                    // 缓冲区已满，提取特征
                    const features = this._extractFeatures({
                        getChannelData: () => buffer,
                        sampleRate: this.options.sampleRate
                    });
                    this.emit('features', features);

                    // 重置缓冲区
                    buffer = new Float32Array(this.options.frameSize);
                    bufferOffset = 0;
                }

                // 将 16 位整数转换为浮点数
                buffer[bufferOffset++] = data[i] / 32768.0;
            }
        });

        this.microphone = mic;
        return micStream;
    }

    /**
     * 停止音频流处理
     */
    stopStream() {
        if (this.microphone) {
            this.microphone.stopRecording();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    /**
     * 提取音频特征
     * @private
     */
    _extractFeatures(audioBuffer) {
        // 获取音频数据
        const buffer = audioBuffer.getChannelData(0); // 获取第一个声道的数据

        // 确保输入数据长度是 frameSize 的整数倍
        const frameSize = this.options.frameSize;
        const numFrames = Math.floor(buffer.length / frameSize);
        const features = [];

        for (let i = 0; i < numFrames; i++) {
            const frame = buffer.subarray(i * frameSize, (i + 1) * frameSize);
            const frameFeatures = Meyda.extract([
                'mfcc',
                'rms',
                'zcr'
            ], frame);
            features.push({
                frameIndex: i,
                ...frameFeatures
            });
        }

        return features;
    }

    /**
     * 设置音频处理管道
     * @private
     */
    _setupAudioPipeline(source) {
        const analyzer = Meyda.createMeydaAnalyzer({
            audioContext: this.audioContext,
            source: source,
            bufferSize: this.options.frameSize,
            hopSize: this.options.hopSize,
            callback: (features) => {
                this.emit('features', features);
            },
            features: ['mfcc', 'rms', 'zcr']
        });

        analyzer.start();
    }
}

export default AudioProcessor; 