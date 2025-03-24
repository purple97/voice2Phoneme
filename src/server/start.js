import { startServer } from './index.js';

// 从环境变量或默认值获取端口号
const port = process.env.PORT || 3000;

// 启动服务器
startServer(port); 