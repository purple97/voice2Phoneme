import AudioProcessor from './audio/processor.js';
import StreamProcessor from './audio/stream-processor.js';
import PhonemeRecognizer from './phonemes/recognizer.js';
import { EventEmitter } from 'events';

/**
 * Voice2Phoneme 主类
 * 用于将语音转换为音素序列
 */
class Voice2Phoneme extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.audioProcessor = new AudioProcessor(options);
        this.streamProcessor = new StreamProcessor(options);
        this.phonemeRecognizer = new PhonemeRecognizer(options);

        // 设置流处理器的特征事件处理
        this.streamProcessor.on('features', (features) => {
            const phonemes = this.phonemeRecognizer.recognize(features, features.frameIndex);
            if (phonemes.length > 0) {
                this.emit('phonemes', {
                    phonemes,
                    timestamp: features.timestamp,
                    realtime: features.realtime
                });
            }
        });
    }

    /**
     * 从音频文件转换音素
     * @param {string} filePath - 音频文件路径
     * @returns {Promise<Array>} 音素序列
     */
    async convertFile(filePath) {
        const features = await this.audioProcessor.processFile(filePath);
        const allPhonemes = [];

        // 处理每一帧的特征
        for (const frameFeatures of features) {
            const phonemes = this.phonemeRecognizer.recognize(frameFeatures, frameFeatures.frameIndex);
            allPhonemes.push(...phonemes);
        }

        return allPhonemes;
    }

    /**
     * 处理实时音频流数据
     * @param {Float32Array} audioData - 音频数据
     */
    processStream(audioData) {
        this.streamProcessor.processChunk(audioData);
    }

    /**
     * 重置流处理器状态
     */
    resetStream() {
        this.streamProcessor.reset();
    }

    /**
     * 开始实时转换（从麦克风输入）
     * @returns {Promise<EventEmitter>} 事件发射器，用于监听音素识别结果
     */
    async startLiveConversion() {
        const stream = await this.audioProcessor.startStream();
        stream.on('data', (audioData) => {
            this.processStream(new Float32Array(audioData));
        });
        return this;
    }

    /**
     * 停止实时转换
     */
    stopLiveConversion() {
        this.audioProcessor.stopStream();
        this.resetStream();
    }
}

export default Voice2Phoneme; 