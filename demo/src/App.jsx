import React from 'react';
import { Layout, Typography } from 'antd';
import AudioUploader from './components/AudioUploader';
import 'antd/dist/reset.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
    return (
        <Layout>
            <Header style={{ background: '#fff', padding: '0 20px' }}>
                <Title level={3} style={{ margin: '16px 0' }}>Voice2Phoneme Demo</Title>
            </Header>
            <Content style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
                <AudioUploader />
            </Content>
        </Layout>
    );
}

export default App; 