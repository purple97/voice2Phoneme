import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createModel() {
    // 创建一个简单的模型
    const model = tf.sequential();

    // 添加层
    model.add(tf.layers.dense({
        inputShape: [15], // 13 (MFCC) + 1 (RMS) + 1 (ZCR)
        units: 64,
        activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
        units: 32,
        activation: 'relu'
    }));

    model.add(tf.layers.dense({
        units: 10, // 假设我们有10个音素类别
        activation: 'softmax'
    }));

    // 编译模型
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    // 保存模型
    const modelPath = path.join(path.dirname(__dirname), 'models', 'phoneme_model');
    await model.save(`file://${modelPath}`);
    console.log('模型已保存到:', modelPath);
}

createModel().catch(console.error); 