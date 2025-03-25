/**
 * 中文字符到口型的映射规则
 */
const CHINESE_TO_VISEME = {
    // 声母映射
    'b': 'B', 'p': 'B', 'm': 'B', 'f': 'B',           // 双唇音和唇齿音
    'd': 'D', 't': 'D', 'n': 'D', 'l': 'D',           // 舌尖中音
    'z': 'D', 'c': 'D', 's': 'D',                     // 舌尖前音
    'zh': 'D', 'ch': 'D', 'sh': 'D', 'r': 'D',        // 舌尖后音
    'j': 'G', 'q': 'G', 'x': 'G',                     // 舌面前音
    'g': 'G', 'k': 'G', 'h': 'G',                     // 舌根音

    // 韵母映射
    'a': 'A', 'ia': 'A', 'ua': 'A',                   // 开口度大
    'o': 'O', 'uo': 'O', 'ao': 'O',                   // 圆唇音
    'e': 'E', 'ie': 'E',                              // 齿音
    'i': 'I', 'ai': 'I', 'ei': 'I',                   // 齿音偏开
    'u': 'U', 'ou': 'U',                              // 圆唇音
    'ü': 'U', 'yu': 'U',                              // 圆唇音
};

/**
 * 声母表
 */
const INITIALS = [
    'zh', 'ch', 'sh',  // 注意：要把多字符声母放在前面
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'z', 'c', 's', 'r',
    'j', 'q', 'x',
    'g', 'k', 'h'
];

/**
 * 韵母表
 */
const FINALS = [
    'iong', 'iang', 'uang',  // 三字符韵母
    'ia', 'ie', 'ua', 'uo', 'üe', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'er',  // 双字符韵母
    'a', 'o', 'e', 'i', 'u', 'ü', 'n', 'g'  // 单字符韵母
];

class TextToViseme {
    constructor() {
        this.defaultDuration = {
            initial: 0.1,  // 声母默认时长
            final: 0.2,    // 韵母默认时长
            pause: 0.1     // 停顿默认时长
        };
    }

    /**
     * 将拼音转换为口型序列
     * @param {string} pinyin - 拼音字符串（不带声调）
     * @returns {Array} 口型序列
     */
    pinyinToVisemes(pinyin) {
        const { initial, final } = this.splitPinyin(pinyin.toLowerCase());
        const visemes = [];

        // 添加声母对应的口型
        if (initial) {
            visemes.push({
                viseme: CHINESE_TO_VISEME[initial] || 'A',
                duration: this.defaultDuration.initial,
                type: 'initial',
                text: initial
            });
        }

        // 添加韵母对应的口型
        if (final) {
            visemes.push({
                viseme: this.getFinalViseme(final),
                duration: this.defaultDuration.final,
                type: 'final',
                text: final
            });
        }

        return visemes;
    }

    /**
     * 分解拼音为声母和韵母
     * @param {string} pinyin - 拼音字符串
     * @returns {Object} 声母和韵母
     */
    splitPinyin(pinyin) {
        // 去除声调和空格
        pinyin = pinyin.replace(/[1-4]/g, '').trim();

        let initial = '';
        let final = pinyin;

        // 查找声母
        for (const i of INITIALS) {
            if (pinyin.startsWith(i)) {
                initial = i;
                final = pinyin.slice(i.length);
                break;
            }
        }

        return { initial, final };
    }

    /**
     * 获取韵母对应的口型
     * @param {string} final - 韵母
     * @returns {string} 口型
     */
    getFinalViseme(final) {
        // 处理复韵母
        for (const f of FINALS) {
            if (final.includes(f) && CHINESE_TO_VISEME[f]) {
                return CHINESE_TO_VISEME[f];
            }
        }

        // 处理单韵母
        for (const char of final) {
            if (CHINESE_TO_VISEME[char]) {
                return CHINESE_TO_VISEME[char];
            }
        }

        return 'A';  // 默认口型
    }

    /**
     * 设置默认时长
     * @param {Object} duration - 时长配置
     */
    setDefaultDuration(duration) {
        this.defaultDuration = {
            ...this.defaultDuration,
            ...duration
        };
    }
}

export default TextToViseme; 