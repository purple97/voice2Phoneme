import React, { useState, useRef, useEffect } from 'react';
import { Upload, Button, Card, List, Space, message, Drawer, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const AudioUploader = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [visemeSequence, setVisemeSequence] = useState([]);
    const [displayedVisemes, setDisplayedVisemes] = useState([]);
    const audioRef = useRef(null);
    const lastIndexRef = useRef(0);

    // 获取文件列表
    const fetchFileList = async () => {
        try {
            const response = await axios.get('/api/files');
            if (response.data.success) {
                setFileList(response.data.data);
            }
        } catch (error) {
            console.error('获取文件列表失败：', error);
            message.error('获取文件列表失败');
        }
    };

    // 组件加载时获取文件列表
    React.useEffect(() => {
        fetchFileList();
    }, []);

    // 处理文件上传
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('audio', file);

        setUploading(true);
        try {
            const response = await axios.post('/api/recognize', formData);
            if (response.data.success) {
                message.success('上传成功');
                fetchFileList(); // 刷新文件列表
            }
        } catch (error) {
            console.error('上传失败：', error);
            message.error('上传失败');
        } finally {
            setUploading(false);
        }
    };

    // 处理文件删除
    const handleDelete = async (fileName) => {
        try {
            await axios.delete(`/api/files/${fileName}`);
            message.success('删除成功');
            fetchFileList(); // 刷新文件列表
        } catch (error) {
            console.error('删除失败：', error);
            message.error('删除失败');
        }
    };

    // 处理口型显示
    const handleShowPhonemes = async (jsonUrl, audioElement) => {
        try {
            const response = await axios.get(jsonUrl);
            const phonemes = response.data.phonemes;

            // 预处理音素序列，按时间排序
            const sequence = phonemes.map(p => ({
                viseme: p.viseme,
                time: p.start,
                duration: p.end - p.start
            })).sort((a, b) => a.time - b.time);

            setVisemeSequence(sequence);
            setDisplayedVisemes([]);
            lastIndexRef.current = 0;
            setCurrentAudio(audioElement);
            setDrawerVisible(true);

            // 重置音频
            audioElement.currentTime = 0;

            // 添加时间更新监听器
            const handleTimeUpdate = () => {
                const currentTime = audioElement.currentTime;
                setCurrentTime(currentTime);

                // 查找当前时间应该显示的所有口型
                while (lastIndexRef.current < sequence.length &&
                    sequence[lastIndexRef.current].time <= currentTime) {
                    const viseme = sequence[lastIndexRef.current];
                    setDisplayedVisemes(prev => [...prev, viseme.viseme]);
                    lastIndexRef.current++;
                }
            };

            audioElement.addEventListener('timeupdate', handleTimeUpdate);
            audioElement.addEventListener('ended', () => {
                lastIndexRef.current = 0;
            });

            // 开始播放
            audioElement.play();
        } catch (error) {
            console.error('获取音素数据失败：', error);
            message.error('获取音素数据失败');
        }
    };

    // 关闭抽屉时清理
    const handleCloseDrawer = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.removeEventListener('timeupdate', () => { });
            currentAudio.removeEventListener('ended', () => { });
        }
        setDrawerVisible(false);
        setCurrentTime(0);
        setVisemeSequence([]);
        setDisplayedVisemes([]);
        setCurrentAudio(null);
        lastIndexRef.current = 0;
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Card title="音频文件上传">
                <Upload.Dragger
                    accept=".mp3,.wav"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file);
                        return false;
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽音频文件到此区域上传</p>
                    <p className="ant-upload-hint">支持 MP3、WAV 格式</p>
                </Upload.Dragger>
            </Card>

            <Card title="已处理文件列表" style={{ marginTop: '20px' }}>
                <List
                    dataSource={fileList}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Space size="middle">
                                    <audio
                                        ref={audioRef}
                                        controls
                                        style={{ width: '300px' }}
                                        src={item.audioUrl}
                                        preload="none"
                                    >
                                        您的浏览器不支持音频播放
                                    </audio>
                                    <Button
                                        type="primary"
                                        icon={<PlayCircleOutlined />}
                                        onClick={() => handleShowPhonemes(item.jsonUrl, audioRef.current)}
                                    >
                                        查看口型
                                    </Button>
                                    <Button type="link" href={item.jsonUrl} target="_blank">
                                        数据
                                    </Button>
                                    <Button
                                        type="link"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(item.fileName)}
                                    >
                                        删除
                                    </Button>
                                </Space>
                            ]}
                        >
                            <List.Item.Meta
                                title={item.fileName}
                                description={`音频文件：${item.audioFile}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer
                title="口型同步显示"
                placement="right"
                width={800}
                onClose={handleCloseDrawer}
                open={drawerVisible}
            >
                <div style={{ marginBottom: '20px' }}>
                    <Text>当前时间: {currentTime.toFixed(3)}s</Text>
                </div>
                <div style={{
                    height: '600px',
                    overflowY: 'auto',
                    padding: '20px',
                    backgroundColor: '#000',
                    color: '#00ff00',
                    fontFamily: 'monospace',
                    fontSize: '24px',
                    lineHeight: '1.5',
                }}>
                    {displayedVisemes.map((viseme, index) => (
                        <span key={index} style={{ display: "inline-block" }}>
                            {viseme}
                        </span>
                    ))}
                </div>
            </Drawer>
        </div>
    );
};

export default AudioUploader; 