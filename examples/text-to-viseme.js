import fetch from 'node-fetch';

// 测试文本
const text = '你好，世界';

// 发送请求到服务器
async function testTextToViseme() {
    try {
        const response = await fetch('http://localhost:3000/text-to-viseme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 打印结果
        console.log('输入文本:', result.text);
        console.log('\n口型序列:');

        for (const viseme of result.visemes) {
            console.log(`时间: ${viseme.start.toFixed(3)}s - ${viseme.end.toFixed(3)}s`);
            console.log(`类型: ${viseme.type === 'initial' ? '声母' : '韵母'}`);
            console.log(`拼音: ${viseme.text}`);
            console.log(`口型: ${viseme.viseme}`);
            console.log('---');
        }

        console.log(`\n总时长: ${result.duration.toFixed(3)}s`);

    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

// 运行测试
testTextToViseme(); 