import { EventEmitter } from 'events';
import Meyda from 'meyda';

/**
 * 音频流处理器类
 * 专门用于处理实时音频流数据
 */
class StreamProcessor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sampleRate: 16000,
            frameSize: 1024,
            hopSize: 512,
            ...options
        };

        // 初始化缓冲区
        this.buffer = new Float32Array(this.options.frameSize);
        this.bufferIndex = 0;

        // 用于计算时间戳
        this.frameCount = 0;
        this.startTime = 0;
    }

    /**
     * 处理音频流数据
     * @param {Float32Array} audioData - 音频数据流
     */
    processChunk(audioData) {
        if (this.startTime === 0) {
            this.startTime = Date.now();
        }

        // 将新的音频数据添加到缓冲区
        for (let i = 0; i < audioData.length; i++) {
            this.buffer[this.bufferIndex] = audioData[i];
            this.bufferIndex++;

            // 当缓冲区满时，处理这一帧数据
            if (this.bufferIndex >= this.options.frameSize) {
                const features = this._extractFeatures(this.buffer);

                // 计算时间戳
                const frameTime = this.frameCount * (this.options.frameSize / this.options.sampleRate);

                // 发送特征和时间信息
                this.emit('features', {
                    ...features,
                    frameIndex: this.frameCount,
                    timestamp: frameTime,
                    realtime: (Date.now() - this.startTime) / 1000
                });

                // 为下一帧准备缓冲区
                // 保留 hopSize 后的数据
                const remainingSamples = this.options.frameSize - this.options.hopSize;
                if (remainingSamples > 0) {
                    this.buffer.copyWithin(0, this.options.hopSize);
                    this.bufferIndex = remainingSamples;
                } else {
                    this.buffer = new Float32Array(this.options.frameSize);
                    this.bufferIndex = 0;
                }

                this.frameCount++;
            }
        }
    }

    /**
     * 重置流处理器状态
     */
    reset() {
        this.buffer = new Float32Array(this.options.frameSize);
        this.bufferIndex = 0;
        this.frameCount = 0;
        this.startTime = 0;
    }

    /**
     * 提取音频特征
     * @private
     * @param {Float32Array} buffer - 音频数据缓冲区
     * @returns {Object} 提取的特征
     */
    _extractFeatures(buffer) {
        return Meyda.extract([
            'mfcc',    // 梅尔频率倒谱系数
            'rms',     // 均方根能量
            'zcr',     // 过零率
            'energy'   // 能量
        ], buffer);
    }
}

export default StreamProcessor; 