import Voice2Phoneme from '../src/index.js';

async function streamExample() {
    // 创建转换器实例
    const converter = new Voice2Phoneme({
        sampleRate: 16000,
        frameSize: 1024,
        hopSize: 512
    });

    try {
        // 监听音素识别事件
        converter.on('phonemes', (result) => {
            const { phonemes, timestamp, realtime } = result;

            // 打印识别结果
            phonemes.forEach(p => {
                console.log(
                    `[${realtime.toFixed(3)}s] 检测到音素: ${converter.phonemeRecognizer.phonemeMap[p.phoneme]} ` +
                    `口型: ${p.viseme} ` +
                    `时间戳: ${timestamp.toFixed(3)}s`
                );
            });
        });

        console.log('开始录音...');
        console.log('将在 30 秒后自动停止');

        // 开始从麦克风录音并处理
        await converter.startLiveConversion();

        // 30 秒后停止
        setTimeout(() => {
            converter.stopLiveConversion();
            console.log('录音已停止');
            process.exit(0);
        }, 30000);

    } catch (error) {
        console.error('发生错误：', error);
        process.exit(1);
    }
}

// 运行示例
streamExample(); 