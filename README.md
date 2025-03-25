# Voice2Phoneme

一个基于 JavaScript 的语音转音素工具，能够将语音信号转换为对应的音素序列。

## 功能特点

- 支持实时语音输入分析
- 支持音频文件分析
- 提供音素识别 API
- 支持多种语言的音素映射
- 口型分类
  * A: 大开口，如"啊"
  * E: 扁平开口，如"诶"
  * O: 圆形开口，如"哦"
  * I: 微笑开口，如"一"
  * U: 嘟嘴开口，如"乌"
  * B: 双唇闭合，如"波"、"么"
  * D: 舌齿音，如"的"、"了"
  * G: 软腭音，如"个"、"克"


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
├── demo/
  ├── package.json         # 项目依赖配置
  ├── vite.config.js      # Vite 配置文件
  ├── index.html          # HTML 模板
  └── src/
      ├── main.jsx        # 应用入口
      ├── App.jsx         # 主应用组件
      └── components/
          └── AudioUploader.jsx  # 音频上传组件
```

## API 文档

详细的 API 文档请参见 `docs/api.md`。



## 问题
- 1、声音转口型，收敛后导致大量 BGD发音的口型
- 2、文字转口型，因为区分了声母和韵母，导致口型数据非常密集，要尝试收敛。
- 3、文字转口型，标点符号和停顿需要个不发音的口型符号