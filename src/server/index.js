import Koa from 'koa';
import Router from 'koa-router';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Voice2Phoneme from '../index.js';
import { formatApiOutput } from '../utils/format.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const OUTPUT_DIR = path.join(__dirname, '../../output');

// 确保上传和输出目录存在
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const app = new Koa();
const router = new Router();

// 创建 Voice2Phoneme 实例
const converter = new Voice2Phoneme({
    sampleRate: 16000,
    frameSize: 1024
});

// 配置跨域和文件上传
app.use(cors());
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: UPLOAD_DIR,
        keepExtensions: true,
        maxFileSize: 200 * 1024 * 1024 // 200MB
    }
}));

// 配置静态文件路由
app.use(async (ctx, next) => {
    // 处理 /uploads/ 开头的请求
    if (ctx.path.startsWith('/uploads/')) {
        const filePath = path.join(UPLOAD_DIR, path.basename(ctx.path));
        if (fs.existsSync(filePath)) {
            ctx.type = path.extname(filePath);
            ctx.body = fs.createReadStream(filePath);
            return;
        }
    }
    // 处理 /output/ 开头的请求
    if (ctx.path.startsWith('/output/')) {
        const filePath = path.join(OUTPUT_DIR, path.basename(ctx.path));
        if (fs.existsSync(filePath)) {
            ctx.type = path.extname(filePath);
            ctx.body = fs.createReadStream(filePath);
            return;
        }
    }
    await next();
});

// 文件上传和音素识别接口
router.post('/api/recognize', async (ctx) => {
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
        const outputPath = path.join(OUTPUT_DIR, outputFileName);
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
});

// 获取已处理文件列表
router.get('/api/files', async (ctx) => {
    try {
        const files = fs.readdirSync(OUTPUT_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const jsonPath = path.join(OUTPUT_DIR, file);
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
});

// 删除文件
router.delete('/api/files/:filename', async (ctx) => {
    try {
        const fileName = ctx.params.filename;
        const jsonPath = path.join(OUTPUT_DIR, fileName);
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // 删除 JSON 文件
        fs.unlinkSync(jsonPath);

        // 删除对应的音频文件
        const audioPath = path.join(UPLOAD_DIR, data.audioFile);
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

        ctx.body = { success: true };
    } catch (error) {
        console.error('删除文件时发生错误：', error);
        ctx.status = 500;
        ctx.body = { error: '删除文件时发生错误' };
    }
});

// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 错误处理
app.on('error', (err, ctx) => {
    console.error('服务器错误', err);
});

export function startServer(port = 3000) {
    app.listen(port, () => {
        console.log(`服务器已启动，监听端口 ${port}`);
        console.log(`上传目录：${UPLOAD_DIR}`);
        console.log(`输出目录：${OUTPUT_DIR}`);
    });
} 