const PHONEME_RULES = {
    // 基于 MFCC 和其他特征的规则
    isVowel: (features) => {
        // 元音通常具有较高的能量
        return features.rms > 0.15;  // 进一步降低能量阈值
    },
    isConsonant: (features) => {
        // 辅音通常具有较高的过零率
        return features.zcr > 0.2;  // 进一步降低过零率阈值
    },
    // 细分元音类型
    getVowelType: (features) => {
        const { mfcc } = features;
        const ratio = mfcc[0] / (mfcc[1] || 0.0001);

        // 使用更宽松的阈值
        if (ratio > 1) return 'aa';      // 啊
        if (ratio > 0.3) return 'ae';    // 诶
        if (ratio < -0.3) return 'o';    // 哦
        if (ratio > -0.1) return 'i';    // 一
        return 'u';                      // 乌
    },
    // 细分辅音类型
    getConsonantType: (features) => {
        const { zcr } = features;

        // 使用更简单的阈值
        if (zcr > 0.35) return 'b';      // 爆破音
        if (zcr > 0.25) return 'd';      // 齿龈音
        return 'g';                      // 软腭音
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
    'o': 'O',   // 哦
    'i': 'I',   // 一
    'u': 'U',   // 乌
    'b': 'B',   // b
    'd': 'D',   // d
    'g': 'G',   // g
};

/**
 * 音素识别器类
 */
class PhonemeRecognizer {
    constructor(options = {}) {
        this.options = {
            frameSize: 1024,
            sampleRate: 16000,
            ...options
        };
        this.lastPhoneme = null;  // 记录上一个音素
        this.phonemeCount = 0;  // 记录连续相同音素的数量
        this.maxSamePhoneme = 5;  // 最大允许连续相同音素的数量
    }

    /**
     * 获取音素对应的口型
     * @param {string} phoneme - 音素
     * @returns {string} 口型分类
     */
    getViseme(phoneme) {
        return VISEME_MAP[phoneme] || 'A';
    }

    /**
     * 识别音素序列
     * @param {Object} features - 音频特征
     * @param {number} frameIndex - 帧索引
     * @returns {Array<Object>} 带时间信息的音素序列
     */
    recognize(features, frameIndex = 0) {
        const phonemes = [];
        const frameDuration = this.options.frameSize / this.options.sampleRate;
        const startTime = frameIndex * frameDuration;
        const endTime = (frameIndex + 1) * frameDuration;

        // 添加调试信息
        console.log(`Frame ${frameIndex}:`, {
            zcr: features.zcr.toFixed(3),
            rms: features.rms.toFixed(3),
            mfcc: features.mfcc.slice(0, 2).map(v => v.toFixed(3)),
            ratio: (features.mfcc[0] / (features.mfcc[1] || 0.0001)).toFixed(3)
        });

        let phoneme;
        // 优先检查是否为元音
        if (PHONEME_RULES.isVowel(features)) {
            phoneme = PHONEME_RULES.getVowelType(features);
            console.log('Detected vowel:', phoneme);
        } else if (PHONEME_RULES.isConsonant(features)) {
            phoneme = PHONEME_RULES.getConsonantType(features);
            console.log('Detected consonant:', phoneme);
        } else {
            // 如果既不是元音也不是辅音，使用上一个音素或默认为 'aa'
            phoneme = this.lastPhoneme || 'aa';
            console.log('Using previous or default:', phoneme);
        }

        // 检查是否需要强制切换音素
        if (phoneme === this.lastPhoneme) {
            this.phonemeCount++;
            if (this.phonemeCount >= this.maxSamePhoneme) {
                // 强制切换到不同的音素
                const currentType = VISEME_MAP[phoneme];
                if (['B', 'D', 'G'].includes(currentType)) {
                    // 如果当前是辅音，切换到元音
                    phoneme = 'aa';
                } else {
                    // 如果当前是元音，切换到辅音
                    phoneme = 'b';
                }
                this.phonemeCount = 0;
                console.log('Forced phoneme change to:', phoneme);
            }
        } else {
            this.phonemeCount = 1;
        }

        // 更新上一个音素
        this.lastPhoneme = phoneme;

        phonemes.push({
            phoneme,
            viseme: VISEME_MAP[phoneme] || 'A',
            start: startTime,
            end: endTime,
            features: { ...features }
        });

        return phonemes;
    }
}

export default PhonemeRecognizer; 