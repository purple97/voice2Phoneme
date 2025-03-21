# Voice2Phoneme

一个基于 JavaScript 的语音转音素工具，能够将语音信号转换为对应的音素序列。

## 功能特点

- 支持实时语音输入分析
- 支持音频文件分析
- 提供音素识别 API
- 支持多种语言的音素映射

## 安装

```bash
npm install
```

## 使用方法

```javascript
const Voice2Phoneme = require('./src');

// 初始化转换器
const converter = new Voice2Phoneme({
    sampleRate: 16000,
    frameSize: 1024,
    tempDir: './temp' // 可选，默认为 ./temp
});

// MP3 文件会被自动处理
const phonemes = await converter.convertFile('path/to/your/audio.mp3');

// 实时转换
converter.startLiveConversion()
  .then(stream => {
    stream.on('phoneme', phoneme => {
      console.log('检测到音素：', phoneme);
    });
  });
```

## 项目结构

```
voice2phoneme/
├── src/                # 源代码目录
│   ├── index.js       # 主入口文件
│   ├── audio/         # 音频处理相关代码
│   ├── phonemes/      # 音素识别相关代码
│   └── utils/         # 工具函数
├── test/              # 测试文件
├── examples/          # 示例代码
└── docs/              # 文档
```

## API 文档

详细的 API 文档请参见 `docs/api.md`。
