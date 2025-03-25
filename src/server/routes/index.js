import Router from 'koa-router';
import { uploadAudio, getAudioList, deleteAudio } from '../controllers/audioController.js';
import { convertTextToViseme } from '../controllers/textToVisemeController.js';

const router = new Router();

// 音频相关路由
router.post('/upload', uploadAudio);
router.get('/list', getAudioList);
router.delete('/audio/:filename', deleteAudio);

// 文本转口型路由
router.post('/text-to-viseme', convertTextToViseme);

export default router; 