const PHONEME_RULES = {
    // 基于 MFCC 和其他特征的简单规则
    isVowel: (features) => {
        return features.zcr < 0.1 && features.rms > 0.5;
    },
    isConsonant: (features) => {
        return features.zcr > 0.3;
    }
};

/**
 * 口型分类
 * A: 大开口，如"啊"
 * E: 扁平开口，如"诶"
 * O: 圆形开口，如"哦"
 * I: 微笑开口，如"一"
 * U: 嘟嘴开口，如"乌"
 * B: 双唇闭合，如"波"、"么"
 * D: 舌齿音，如"的"、"了"
 * G: 软腭音，如"个"、"克"
 */
const VISEME_MAP = {
    'aa': 'A',  // 啊
    'ae': 'E',  // 诶
    'ah': 'A',  // 额
    'b': 'B',   // b
    'd': 'D',   // d
    'g': 'G',   // g
};

/**
 * 音素识别器类
 * 负责将音频特征转换为音素序列
 */
class PhonemeRecognizer {
    constructor(options = {}) {
        this.options = {
            frameSize: 1024,  // 默认帧大小
            sampleRate: 16000,  // 默认采样率
            ...options
        };
        this.phonemeMap = this._loadPhonemeMap();
    }

    /**
     * 获取音素对应的口型
     * @param {string} phoneme - 音素
     * @returns {string} 口型分类
     */
    getViseme(phoneme) {
        return VISEME_MAP[phoneme] || 'A';  // 默认返回 A 口型
    }

    /**
     * 识别音素序列
     * @param {Object} features - 音频特征
     * @param {number} frameIndex - 帧索引
     * @returns {Array<Object>} 带时间信息的音素序列
     */
    recognize(features, frameIndex = 0) {
        const phonemes = [];
        const frameDuration = this.options.frameSize / this.options.sampleRate; // 每帧的持续时间（秒）
        const startTime = frameIndex * frameDuration;
        const endTime = (frameIndex + 1) * frameDuration;

        if (PHONEME_RULES.isVowel(features)) {
            // 根据 MFCC 特征判断具体是哪个元音
            if (features.mfcc[0] > 0) {
                phonemes.push({
                    phoneme: 'aa',
                    viseme: 'A',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            } else if (features.mfcc[1] > 0) {
                phonemes.push({
                    phoneme: 'ae',
                    viseme: 'E',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            } else {
                phonemes.push({
                    phoneme: 'ah',
                    viseme: 'A',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            }
        } else if (PHONEME_RULES.isConsonant(features)) {
            // 根据 MFCC 特征判断具体是哪个辅音
            if (features.mfcc[2] > 0) {
                phonemes.push({
                    phoneme: 'b',
                    viseme: 'B',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            } else if (features.mfcc[3] > 0) {
                phonemes.push({
                    phoneme: 'd',
                    viseme: 'D',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            } else {
                phonemes.push({
                    phoneme: 'g',
                    viseme: 'G',
                    start: startTime,
                    end: endTime,
                    features: { ...features }
                });
            }
        }

        return phonemes;
    }

    /**
     * 加载音素映射表
     * @private
     */
    _loadPhonemeMap() {
        // 这里可以扩展为从配置文件加载
        return {
            'aa': '啊',  // 如"father"中的'a'
            'ae': '诶',  // 如"cat"中的'a'
            'ah': '额',  // 如"but"中的'u'
            'b': 'b',   // 如"boy"中的'b'
            'd': 'd',   // 如"day"中的'd'
            'g': 'g'    // 如"go"中的'g'
        };
    }
}

export default PhonemeRecognizer; 