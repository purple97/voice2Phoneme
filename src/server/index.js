import Koa from 'koa';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createPhonemeRouter } from './routes/phoneme.js';
// import bodyParser from 'koa-bodyparser';
import router from './routes/index.js';

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

// 使用音素识别路由
const phonemeRouter = createPhonemeRouter({ uploadDir: UPLOAD_DIR, outputDir: OUTPUT_DIR });
app.use(phonemeRouter.routes()).use(phonemeRouter.allowedMethods());

// 使用中间件
// app.use(bodyParser());

// 使用路由
app.use(router.routes());
app.use(router.allowedMethods());

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