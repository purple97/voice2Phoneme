import AudioProcessor from './audio/processor.js';
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
        this.phonemeRecognizer = new PhonemeRecognizer(options);
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
     * 开始实时转换
     * @returns {Promise<EventEmitter>} 事件发射器，用于监听音素识别结果
     */
    async startLiveConversion() {
        const stream = await this.audioProcessor.startStream();
        stream.on('data', async (audioData) => {
            const phonemes = this.phonemeRecognizer.recognize(audioData);
            this.emit('phoneme', phonemes);
        });
        return this;
    }

    /**
     * 停止实时转换
     */
    stopLiveConversion() {
        this.audioProcessor.stopStream();
    }
}

export default Voice2Phoneme; 