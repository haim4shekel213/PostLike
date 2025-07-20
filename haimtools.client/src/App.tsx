import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import axios from 'axios';
import { theme } from './theme';
import ModernSidebar from './components/ModernSidebar';
import ModernRequestEditor from './components/ModernRequestEditor';
import ModernResponseViewer from './components/ModernResponseViewer';
import ErrorBoundary from './components/ErrorBoundary';
import { PostmanFile, PostmanItem, ApiResponse } from './types';

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [content, setContent] = useState<PostmanFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<PostmanItem | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
      setResponse(null);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedQuery) return;

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const requestData = {
        method: selectedQuery.request.method,
        url: { raw: selectedQuery.request.url.raw },
        header: selectedQuery.request.header || [],
        body: selectedQuery.request.body || { raw: '' },
        auth: selectedQuery.request.auth,
      };

      const res = await axios.post('/api/Postman/execute-request', requestData);
      const endTime = Date.now();
      
      const apiResponse: ApiResponse = {
        statusCode: res.data.statusCode || res.status,
        headers: res.data.headers || {},
        body: typeof res.data.body === 'string' ? res.data.body : JSON.stringify(res.data.body || res.data, null, 2),
        responseTime: endTime - startTime,
        size: new Blob([res.data.body || JSON.stringify(res.data)]).size,
      };

      setResponse(apiResponse);
    } catch (error: any) {
      console.error('Error executing request:', error);
      
      const errorResponse: ApiResponse = {
        statusCode: error.response?.status || 0,
        headers: error.response?.headers || {},
        body: error.response?.data ? 
          (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data, null, 2)) : 
          error.message,
        responseTime: Date.now() - startTime,
        size: error.response?.data ? new Blob([JSON.stringify(error.response.data)]).size : 0,
      };
      
      setResponse(errorResponse);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequest = async (updatedQuery: PostmanItem) => {
    if (!selectedFile) {
      alert('No file selected.');
      return;
    }

    try {
      const response = await axios.post(
        `/api/Postman/save-file/${selectedFile}?collectionName=${selectedCollection || ''}&requestName=${updatedQuery.name}`,
        updatedQuery.request
      );
      alert('Request saved successfully!');
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save the request.');
    }
  };

  const handleCollectionSelect = (collectionName: string) => {
    setSelectedCollection(collectionName);
    setSelectedQuery(null);
    setResponse(null);
  };

  const handleQuerySelect = (query: PostmanItem) => {
    setSelectedQuery(query);
    setResponse(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default' }}>
          <ModernSidebar
            files={files}
            content={content}
            selectedFile={selectedFile}
            selectedCollection={selectedCollection}
            selectedQuery={selectedQuery}
            onFileSelect={fetchFileContent}
            onCollectionSelect={handleCollectionSelect}
            onQuerySelect={handleQuerySelect}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, gap: 2, overflow: 'hidden' }}>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ModernRequestEditor
                query={selectedQuery}
                onQueryChange={setSelectedQuery}
                onSendRequest={handleSendRequest}
                onSaveRequest={handleSaveRequest}
              />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ModernResponseViewer 
                response={response} 
                loading={loading}
              />
            </Box>
          </Box>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;