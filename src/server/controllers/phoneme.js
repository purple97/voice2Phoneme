import path from 'path';
import fs from 'fs';
import Voice2Phoneme from '../../index.js';
import { formatApiOutput } from '../../utils/format.js';

// 创建 Voice2Phoneme 实例
const converter = new Voice2Phoneme({
    sampleRate: 16000,
    frameSize: 1024
});

/**
 * 处理音频文件并识别音素
 * @param {Object} ctx - Koa 上下文
 * @param {Object} options - 配置选项
 * @param {string} options.uploadDir - 上传文件目录
 * @param {string} options.outputDir - 输出文件目录
 */
export async function recognizePhonemes(ctx, { uploadDir, outputDir }) {
    try {
        const file = ctx.request.files?.audio;
        if (!file) {
            ctx.status = 400;
            ctx.body = { error: '未找到音频文件' };
            return;
        }

        // 获取文件信息
        const fileName = path.basename(file.filepath);
        const fileUrl = `/uploads/${fileName}`;

        // 处理音频文件
        const phonemes = await converter.convertFile(file.filepath);

        // 生成输出文件名
        const outputFileName = `${path.parse(fileName).name}.json`;
        const outputPath = path.join(outputDir, outputFileName);
        const outputUrl = `/output/${outputFileName}`;

        // 保存音素数据
        const outputData = formatApiOutput({
            audioFile: fileName,
            fileUrl: fileUrl,
            phonemes
        });

        // 写入 JSON 文件
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

        // 返回结果
        ctx.body = {
            success: true,
            data: {
                audioFile: fileName,
                audioUrl: fileUrl,
                jsonUrl: outputUrl,
                result: outputData
            }
        };

    } catch (error) {
        console.error('处理请求时发生错误：', error);
        ctx.status = 500;
        ctx.body = { error: '处理音频文件时发生错误' };
    }
}

/**
 * 获取已处理文件列表
 * @param {Object} ctx - Koa 上下文
 * @param {Object} options - 配置选项
 * @param {string} options.outputDir - 输出文件目录
 */
export async function getFileList(ctx, { outputDir }) {
    try {
        const files = fs.readdirSync(outputDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const jsonPath = path.join(outputDir, file);
                const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                return {
                    fileName: file,
                    audioFile: data.audioFile,
                    audioUrl: data.fileUrl,
                    jsonUrl: `/output/${file}`
                };
            });

        ctx.body = { success: true, data: files };
    } catch (error) {
        console.error('获取文件列表时发生错误：', error);
        ctx.status = 500;
        ctx.body = { error: '获取文件列表时发生错误' };
    }
}

/**
 * 删除文件
 * @param {Object} ctx - Koa 上下文
 * @param {Object} options - 配置选项
 * @param {string} options.uploadDir - 上传文件目录
 * @param {string} options.outputDir - 输出文件目录
 */
export async function deleteFile(ctx, { uploadDir, outputDir }) {
    try {
        const fileName = ctx.params.filename;
        const jsonPath = path.join(outputDir, fileName);
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // 删除 JSON 文件
        fs.unlinkSync(jsonPath);

        // 删除对应的音频文件
        const audioPath = path.join(uploadDir, data.audioFile);
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

        ctx.body = { success: true };
    } catch (error) {
        console.error('删除文件时发生错误：', error);
        ctx.status = 500;
        ctx.body = { error: '删除文件时发生错误' };
    }
} 