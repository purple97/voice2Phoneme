/**
 * 简化音素数据，只保留必要的字段
 * @param {Object} phoneme - 原始音素数据
 * @returns {Object} 简化后的音素数据
 */
function simplifyPhoneme(phoneme) {
    return {
        viseme: phoneme.viseme,
        start: Number(phoneme.start.toFixed(3)),
        end: Number(phoneme.end.toFixed(3))
    };
}

/**
 * 生成详细的音素数据
 * @param {Object} options - 配置选项
 * @param {string} options.audioFile - 音频文件名
 * @param {number} options.sampleRate - 采样率
 * @param {number} options.frameSize - 帧大小
 * @param {Array} options.phonemes - 音素数据数组
 * @param {Object} options.phonemeMap - 音素映射表
 * @returns {Object} 格式化后的详细数据
 */
export function formatDetailedOutput({
    audioFile,
    sampleRate,
    frameSize,
    phonemes,
    phonemeMap
}) {
    return {
        audioFile,
        sampleRate,
        frameSize,
        phonemes: phonemes.map(p => ({
            ...p,
            start: Number(p.start.toFixed(3)),
            end: Number(p.end.toFixed(3)),
            chinese: phonemeMap[p.phoneme]
        }))
    };
}

/**
 * 生成简化版的口型数据（用于数字人）
 * @param {Object} options - 配置选项
 * @param {string} options.audioFile - 音频文件名
 * @param {Array} options.phonemes - 音素数据数组
 * @param {number} options.frameSize - 帧大小
 * @param {number} options.sampleRate - 采样率
 * @returns {Object} 格式化后的简化数据
 */
export function formatVisemeOutput({
    audioFile,
    phonemes,
    frameSize,
    sampleRate
}) {
    return {
        audioFile,
        duration: phonemes.length > 0 ?
            Number(phonemes[phonemes.length - 1].end.toFixed(3)) : 0,
        frameRate: Number((1 / (frameSize / sampleRate)).toFixed(3)),
        visemes: phonemes.map(p => ({
            viseme: p.viseme,
            start: Number(p.start.toFixed(3)),
            end: Number(p.end.toFixed(3))
        }))
    };
}

/**
 * 生成 API 响应数据
 * @param {Object} options - 配置选项
 * @param {string} options.audioFile - 音频文件名
 * @param {string} options.fileUrl - 音频文件 URL
 * @param {Array} options.phonemes - 音素数据数组
 * @returns {Object} API 响应数据
 */
export function formatApiOutput({
    audioFile,
    fileUrl,
    phonemes
}) {
    return {
        audioFile,
        fileUrl,
        phonemes: phonemes.map(simplifyPhoneme)
    };
} 