import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3000';
const TEST_AUDIO = path.join(__dirname, '../audio-samples/test.mp3');

/**
 * 测试文件上传和音素识别
 */
async function testRecognize() {
    console.log('\n测试音素识别 API...');

    try {
        // 创建 FormData
        const form = new FormData();
        form.append('audio', fs.createReadStream(TEST_AUDIO));

        // 发送请求
        const response = await fetch(`${API_BASE}/api/recognize`, {
            method: 'POST',
            body: form
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ 音素识别成功');
            console.log('音频文件 URL:', result.data.audioUrl);
            console.log('JSON 文件 URL:', result.data.jsonUrl);
            console.log('检测到的音素数量:', result.data.result.phonemes.length);

            // 打印前 5 个音素作为示例
            console.log('\n前 5 个口型:');
            result.data.result.phonemes.slice(0, 5).forEach(p => {
                console.log(`口型: ${p.viseme} (${p.start}s - ${p.end}s)`);
            });
        } else {
            console.log('❌ 音素识别失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

/**
 * 测试获取文件列表
 */
async function testGetFiles() {
    console.log('\n测试获取文件列表 API...');

    try {
        const response = await fetch(`${API_BASE}/api/files`);
        const result = await response.json();

        if (result.success) {
            console.log('✅ 获取文件列表成功');
            console.log('文件数量:', result.data.length);

            if (result.data.length > 0) {
                console.log('\n最新的文件:');
                const latest = result.data[result.data.length - 1];
                console.log('文件名:', latest.fileName);
                console.log('音频 URL:', latest.audioUrl);
                console.log('JSON URL:', latest.jsonUrl);
            }
        } else {
            console.log('❌ 获取文件列表失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

/**
 * 测试删除文件
 */
async function testDeleteFile(fileName) {
    if (!fileName) {
        console.log('\n跳过删除文件测试（未提供文件名）');
        return;
    }

    console.log('\n测试删除文件 API...');

    try {
        const response = await fetch(`${API_BASE}/api/files/${fileName}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            console.log('✅ 文件删除成功');
        } else {
            console.log('❌ 文件删除失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

/**
 * 运行所有测试
 */
async function runTests() {
    console.log('开始测试 API...\n');

    // 1. 测试音素识别
    await testRecognize();

    // 2. 测试获取文件列表
    await testGetFiles();

    // 3. 测试删除文件（可选）
    // 注意：取消下面的注释并提供文件名来测试删除功能
    // await testDeleteFile('example.json');

    console.log('\n测试完成！');
}

// 运行测试
runTests().catch(console.error); 