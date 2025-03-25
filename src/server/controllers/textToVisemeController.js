import TextToViseme from '../../phonemes/textToViseme.js';
import * as pinyinModule from 'pinyin';

const textToViseme = new TextToViseme();
const { pinyin } = pinyinModule.default;  // 获取默认导出

/**
 * 将中文文本转换为口型序列
 * @param {Object} ctx - Koa 上下文
 */
export async function convertTextToViseme(ctx) {
    try {
        const { text } = ctx.request.body;

        if (!text) {
            ctx.status = 400;
            ctx.body = { error: '请提供中文文本' };
            return;
        }

        // 将中文文本转换为拼音数组
        const pinyinArray = pinyin(text, {
            style: pinyin.STYLE_NORMAL,  // 不带声调
            segment: true  // 启用分词
        });

        // 将每个字的拼音转换为口型序列
        const result = [];
        let currentTime = 0;

        for (const [py] of pinyinArray) {
            const visemes = textToViseme.pinyinToVisemes(py);

            // 添加时间戳
            for (const v of visemes) {
                result.push({
                    ...v,
                    start: currentTime,
                    end: currentTime + v.duration
                });
                currentTime += v.duration;
            }

            // 添加字间停顿
            currentTime += textToViseme.defaultDuration.pause;
        }

        ctx.body = {
            text,
            visemes: result,
            duration: currentTime
        };

    } catch (error) {
        console.error('文本转口型错误:', error);
        ctx.status = 500;
        ctx.body = { error: '处理文本时发生错误' };
    }
} 