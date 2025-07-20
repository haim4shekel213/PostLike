import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Toolbar,
  Button,
  Alert,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  Fullscreen,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ApiResponse } from '../types';

interface ModernResponseViewerProps {
  response: ApiResponse | null;
  loading?: boolean;
}

const ModernResponseViewer: React.FC<ModernResponseViewerProps> = ({ response, loading = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Sending request...
        </Typography>
      </Paper>
    );
  }

  if (!response) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Response will appear here after sending a request
        </Typography>
      </Paper>
    );
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'info';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return <CheckCircle />;
    if (statusCode >= 300 && statusCode < 400) return <Info />;
    if (statusCode >= 400 && statusCode < 500) return <Warning />;
    if (statusCode >= 500) return <Error />;
    return null;
  };

  const formatResponseBody = (body: string) => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  };

  const getLanguage = (contentType?: string) => {
    if (!contentType) return 'text';
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('css')) return 'css';
    if (contentType.includes('javascript')) return 'javascript';
    return 'text';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = () => {
    const blob = new Blob([response.body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TabPanel = ({ children, value, index }: any) => (
    <Box hidden={value !== index} sx={{ height: '100%' }}>
      {value === index && children}
    </Box>
  );

  const contentType = response.headers['content-type'] || response.headers['Content-Type'];
  const language = getLanguage(contentType);

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Response Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Response
            </Typography>
            <Chip
              icon={getStatusIcon(response.statusCode)}
              label={`${response.statusCode}`}
              color={getStatusColor(response.statusCode) as any}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(response.body)}
            >
              Copy
            </Button>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={downloadResponse}
            >
              Save
            </Button>
          </Box>
        </Box>

        {/* Response Stats */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {response.responseTime && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {response.responseTime}ms
              </Typography>
            </Box>
          )}
          
          {response.size && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Size
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {response.size > 1024 ? `${(response.size / 1024).toFixed(1)} KB` : `${response.size} B`}
              </Typography>
            </Box>
          )}
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {response.statusCode >= 200 && response.statusCode < 300 ? 'Success' :
               response.statusCode >= 400 ? 'Error' : 'Info'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Response Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Body (${language.toUpperCase()})`} />
          <Tab label={`Headers (${Object.keys(response.headers).length})`} />
          <Tab label="Test Results" />
        </Tabs>
      </Box>

      {/* Response Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: '100%', position: 'relative' }}>
            {response.body ? (
              <Box sx={{ height: '100%', overflow: 'auto' }}>
                <SyntaxHighlighter
                  language={language}
                  style={isDarkMode ? oneDark : oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    height: '100%',
                    background: 'transparent',
                  }}
                  showLineNumbers={language === 'json' || language === 'xml'}
                  wrapLines={true}
                >
                  {formatResponseBody(response.body)}
                </SyntaxHighlighter>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No response body
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Header</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <TableRow key={key} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {key}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {value}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(`${key}: ${value}`)}
                          title="Copy header"
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Test results functionality coming soon. You'll be able to write and run tests against your API responses.
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default ModernResponseViewer;