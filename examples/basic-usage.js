import Voice2Phoneme from '../src/index.js';
import { formatDetailedOutput, formatVisemeOutput } from '../src/utils/format.js';
import fs from 'fs';
import path from 'path';

async function example() {
    // 创建转换器实例
    const converter = new Voice2Phoneme({
        sampleRate: 16000,
        frameSize: 1024
    });

    try {
        // 从文件转换音素
        const inputFile = './audio-samples/test.mp3';
        console.log('从文件转换音素...', inputFile);

        const phonemes = await converter.convertFile(inputFile);

        // 准备详细输出数据
        const outputData = formatDetailedOutput({
            audioFile: path.basename(inputFile),
            sampleRate: converter.options.sampleRate,
            frameSize: converter.options.frameSize,
            phonemes,
            phonemeMap: converter.phonemeRecognizer.phonemeMap
        });

        // 准备简化版输出数据（用于数字人口型）
        const visemeData = formatVisemeOutput({
            audioFile: path.basename(inputFile),
            phonemes,
            frameSize: converter.options.frameSize,
            sampleRate: converter.options.sampleRate
        });

        // 生成输出文件路径
        const outputFile = path.join(
            path.dirname(inputFile),
            `${path.basename(inputFile, '.mp3')}.json`
        );
        const visemeFile = path.join(
            path.dirname(inputFile),
            `${path.basename(inputFile, '.mp3')}_visemes.json`
        );

        // 保存详细版 JSON 文件
        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        console.log('音素识别结果已保存到：', outputFile);

        // 保存简化版 JSON 文件（用于数字人口型）
        fs.writeFileSync(visemeFile, JSON.stringify(visemeData, null, 2));
        console.log('口型数据已保存到：', visemeFile);

        // 打印简要信息
        console.log('\n识别结果预览：');
        console.log('检测到的音素：',
            phonemes.map(p => `${converter.phonemeRecognizer.phonemeMap[p.phoneme]}(${p.start.toFixed(3)}s-${p.end.toFixed(3)}s)`).join(' '));

        console.log('\n口型序列预览：');
        console.log('检测到的口型：',
            phonemes.map(p => `${p.viseme}(${p.start.toFixed(3)}s-${p.end.toFixed(3)}s)`).join(' '));
    } catch (error) {
        console.error('发生错误：', error);
    }
}

example(); 