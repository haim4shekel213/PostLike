import axios from 'axios';
import { useEffect, useState } from 'react';
import QueryEditor from './components/QueryEditor';
import ResponseViewer from './components/ResponseViewer';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';

function App() {
    const [files, setFiles] = useState<string[]>([]);
    const [content, setContent] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [selectedQuery, setSelectedQuery] = useState<any>(null);
    const [response, setResponse] = useState<any>();

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await axios.get('/api/Postman/list-files');
            setFiles(res.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const fetchFileContent = async (fileName: string) => {
        try {
            const res = await axios.get(`/api/Postman/get-file/${fileName}`);
            setContent(res.data);
            setSelectedFile(fileName);
            setSelectedCollection(null);
            setSelectedQuery(null);
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    };

    const handleSendRequest = async () => {
        if (!selectedQuery) return;

        try {
            const res = await axios.post('/api/Postman/execute-request', selectedQuery.request);
            setResponse(res.data);
        } catch (error) {
            console.error('Error executing request:', error);
        }
    };

    const handleSaveRequest = async (updatedQuery: any) => {
        if (!selectedFile) {
            alert('No file selected.');
            return;
        }

        try {
            const response = await axios.post(
                `/api/Postman/save-file/${selectedFile}?collectionName=${selectedCollection || ''}&requestName=${updatedQuery.name}`,
                updatedQuery.request
            );
            alert(response.data);
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Failed to save the file.');
        }
    };

    return (
        <ErrorBoundary>
            <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
                <Sidebar
                    files={files}
                    content={content}
                    onFileSelect={fetchFileContent}
                    onCollectionSelect={setSelectedCollection}
                    onQuerySelect={setSelectedQuery}
                />

                <div style={{ flex: 1, padding: '20px' }}>
                    <h1 style={{ color: '#333' }}>Postman-like GUI</h1>

                    <QueryEditor
                        query={selectedQuery}
                        onQueryChange={setSelectedQuery}
                        onSendRequest={handleSendRequest}
                        onSaveRequest={handleSaveRequest}
                    />

                    <ResponseViewer response={response} />
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;