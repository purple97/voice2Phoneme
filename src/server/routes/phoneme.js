import Router from 'koa-router';
import { recognizePhonemes, getFileList, deleteFile } from '../controllers/phoneme.js';

export function createPhonemeRouter({ uploadDir, outputDir }) {
    const router = new Router();

    // 音频文件上传和音素识别
    router.post('/api/recognize', ctx =>
        recognizePhonemes(ctx, { uploadDir, outputDir })
    );

    // 获取已处理文件列表
    router.get('/api/files', ctx =>
        getFileList(ctx, { outputDir })
    );

    // 删除文件
    router.delete('/api/files/:filename', ctx =>
        deleteFile(ctx, { uploadDir, outputDir })
    );

    return router;
} 