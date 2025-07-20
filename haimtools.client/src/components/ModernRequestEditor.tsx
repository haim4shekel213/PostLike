import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send,
  Add,
  Delete,
  ExpandMore,
  Save,
  ContentCopy,
  Code,
  Security,
} from '@mui/icons-material';
import { PostmanItem, PostmanAuth, OAuth2Config } from '../types';

interface ModernRequestEditorProps {
  query: PostmanItem | null;
  onQueryChange: (query: PostmanItem) => void;
  onSendRequest: () => void;
  onSaveRequest: (updatedQuery: PostmanItem) => void;
}

const ModernRequestEditor: React.FC<ModernRequestEditorProps> = ({
  query,
  onQueryChange,
  onSendRequest,
  onSaveRequest,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [authExpanded, setAuthExpanded] = useState(false);

  if (!query || !query.request) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a request from the sidebar to get started
        </Typography>
      </Box>
    );
  }

  const { name, request } = query;

  const handleMethodChange = (method: string) => {
    onQueryChange({
      ...query,
      request: { ...request, method },
    });
  };

  const handleUrlChange = (url: string) => {
    onQueryChange({
      ...query,
      request: {
        ...request,
        url: { ...request.url, raw: url },
      },
    });
  };

  const handleAuthChange = (auth: PostmanAuth) => {
    onQueryChange({
      ...query,
      request: { ...request, auth },
    });
  };

  const handleHeaderChange = (headers: any[]) => {
    onQueryChange({
      ...query,
      request: { ...request, header: headers },
    });
  };

  const handleBodyChange = (body: any) => {
    onQueryChange({
      ...query,
      request: { ...request, body },
    });
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'success',
      POST: 'primary',
      PUT: 'warning',
      DELETE: 'error',
      PATCH: 'secondary',
      HEAD: 'info',
      OPTIONS: 'default',
    };
    return colors[method.toUpperCase()] || 'default';
  };

  const TabPanel = ({ children, value, index }: any) => (
    <Box hidden={value !== index} sx={{ pt: 2 }}>
      {value === index && children}
    </Box>
  );

  const AuthSection = () => {
    const authType = request.auth?.type || 'noauth';

    const handleOAuth2Change = (field: keyof OAuth2Config, value: string) => {
      const currentOAuth2 = request.auth?.oauth2 || {
        accessTokenUrl: '',
        authUrl: '',
        clientId: '',
        clientSecret: '',
        grantType: 'authorization_code' as const,
      };

      handleAuthChange({
        type: 'oauth2',
        oauth2: { ...currentOAuth2, [field]: value },
      });
    };

    return (
      <Box>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Authorization Type</InputLabel>
          <Select
            value={authType}
            onChange={(e) => handleAuthChange({ type: e.target.value as any })}
            label="Authorization Type"
          >
            <MenuItem value="noauth">No Auth</MenuItem>
            <MenuItem value="bearer">Bearer Token</MenuItem>
            <MenuItem value="basic">Basic Auth</MenuItem>
            <MenuItem value="oauth2">OAuth 2.0</MenuItem>
            <MenuItem value="apikey">API Key</MenuItem>
          </Select>
        </FormControl>

        {authType === 'bearer' && (
          <TextField
            fullWidth
            label="Token"
            value={request.auth?.bearer?.[0]?.value || ''}
            onChange={(e) =>
              handleAuthChange({
                type: 'bearer',
                bearer: [{ key: 'token', value: e.target.value, type: 'string' }],
              })
            }
            placeholder="Enter your bearer token"
          />
        )}

        {authType === 'basic' && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Username"
                value={request.auth?.basic?.[0]?.value || ''}
                onChange={(e) =>
                  handleAuthChange({
                    type: 'basic',
                    basic: [
                      { key: 'username', value: e.target.value, type: 'string' },
                      { key: 'password', value: request.auth?.basic?.[1]?.value || '', type: 'string' },
                    ],
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={request.auth?.basic?.[1]?.value || ''}
                onChange={(e) =>
                  handleAuthChange({
                    type: 'basic',
                    basic: [
                      { key: 'username', value: request.auth?.basic?.[0]?.value || '', type: 'string' },
                      { key: 'password', value: e.target.value, type: 'string' },
                    ],
                  })
                }
              />
            </Grid>
          </Grid>
        )}

        {authType === 'oauth2' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Configure OAuth 2.0 settings below. The client will handle the authentication flow automatically.
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Grant Type</InputLabel>
                  <Select
                    value={request.auth?.oauth2?.grantType || 'authorization_code'}
                    onChange={(e) => handleOAuth2Change('grantType', e.target.value)}
                    label="Grant Type"
                  >
                    <MenuItem value="authorization_code">Authorization Code</MenuItem>
                    <MenuItem value="client_credentials">Client Credentials</MenuItem>
                    <MenuItem value="password">Password</MenuItem>
                    <MenuItem value="refresh_token">Refresh Token</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Authorization URL"
                  value={request.auth?.oauth2?.authUrl || ''}
                  onChange={(e) => handleOAuth2Change('authUrl', e.target.value)}
                  placeholder="https://example.com/oauth/authorize"
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Access Token URL"
                  value={request.auth?.oauth2?.accessTokenUrl || ''}
                  onChange={(e) => handleOAuth2Change('accessTokenUrl', e.target.value)}
                  placeholder="https://example.com/oauth/token"
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Client ID"
                  value={request.auth?.oauth2?.clientId || ''}
                  onChange={(e) => handleOAuth2Change('clientId', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Client Secret"
                  value={request.auth?.oauth2?.clientSecret || ''}
                  onChange={(e) => handleOAuth2Change('clientSecret', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Scope"
                  value={request.auth?.oauth2?.scope || ''}
                  onChange={(e) => handleOAuth2Change('scope', e.target.value)}
                  placeholder="read write"
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Redirect URI"
                  value={request.auth?.oauth2?.redirectUri || ''}
                  onChange={(e) => handleOAuth2Change('redirectUri', e.target.value)}
                  placeholder="http://localhost:3000/callback"
                />
              </Grid>

              {request.auth?.oauth2?.grantType === 'password' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={request.auth?.oauth2?.username || ''}
                      onChange={(e) => handleOAuth2Change('username', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={request.auth?.oauth2?.password || ''}
                      onChange={(e) => handleOAuth2Change('password', e.target.value)}
                    />
                  </Grid>
                </>
              )}

              {request.auth?.oauth2?.grantType === 'refresh_token' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Refresh Token"
                    value={request.auth?.oauth2?.refreshToken || ''}
                    onChange={(e) => handleOAuth2Change('refreshToken', e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => {
                  // TODO: Implement OAuth 2.0 flow
                  console.log('Starting OAuth 2.0 flow...');
                }}
              >
                Get New Access Token
              </Button>
            </Box>
          </Box>
        )}

        {authType === 'apikey' && (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Key"
                value={request.auth?.apikey?.[0]?.key || ''}
                onChange={(e) =>
                  handleAuthChange({
                    type: 'apikey',
                    apikey: [
                      {
                        key: e.target.value,
                        value: request.auth?.apikey?.[0]?.value || '',
                        in: request.auth?.apikey?.[0]?.in || 'header',
                      },
                    ],
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Value"
                value={request.auth?.apikey?.[0]?.value || ''}
                onChange={(e) =>
                  handleAuthChange({
                    type: 'apikey',
                    apikey: [
                      {
                        key: request.auth?.apikey?.[0]?.key || '',
                        value: e.target.value,
                        in: request.auth?.apikey?.[0]?.in || 'header',
                      },
                    ],
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Add to</InputLabel>
                <Select
                  value={request.auth?.apikey?.[0]?.in || 'header'}
                  onChange={(e) =>
                    handleAuthChange({
                      type: 'apikey',
                      apikey: [
                        {
                          key: request.auth?.apikey?.[0]?.key || '',
                          value: request.auth?.apikey?.[0]?.value || '',
                          in: e.target.value as 'header' | 'query',
                        },
                      ],
                    })
                  }
                  label="Add to"
                >
                  <MenuItem value="header">Header</MenuItem>
                  <MenuItem value="query">Query Params</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Request Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          <Chip
            label={request.method}
            color={getMethodColor(request.method) as any}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={request.method}
              onChange={(e) => handleMethodChange(e.target.value)}
              size="small"
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
              <MenuItem value="PATCH">PATCH</MenuItem>
              <MenuItem value="HEAD">HEAD</MenuItem>
              <MenuItem value="OPTIONS">OPTIONS</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            value={request.url.raw}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter request URL"
            size="small"
          />

          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={onSendRequest}
            sx={{ minWidth: 100 }}
          >
            Send
          </Button>

          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={() => onSaveRequest(query)}
          >
            Save
          </Button>
        </Box>
      </Paper>

      {/* Request Details */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Params" />
            <Tab label="Authorization" />
            <Tab label="Headers" />
            <Tab label="Body" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <TabPanel value={activeTab} index={0}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Query parameters will be automatically parsed from the URL
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell width={50}>Enabled</TableCell>
                    <TableCell width={50}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.url.query?.map((param, index) => (
                    <TableRow key={index}>
                      <TableCell>{param.key}</TableCell>
                      <TableCell>{param.value}</TableCell>
                      <TableCell>
                        <Switch size="small" checked={!param.disabled} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <AuthSection />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ mb: 2 }}>
              <Button startIcon={<Add />} size="small">
                Add Header
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell width={50}>Enabled</TableCell>
                    <TableCell width={50}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.header?.map((header, index) => (
                    <TableRow key={index}>
                      <TableCell>{header.key}</TableCell>
                      <TableCell>{header.value}</TableCell>
                      <TableCell>
                        <Switch size="small" checked={!header.disabled} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Body Type</InputLabel>
                <Select
                  value={request.body?.mode || 'raw'}
                  onChange={(e) => handleBodyChange({ ...request.body, mode: e.target.value })}
                  label="Body Type"
                  size="small"
                >
                  <MenuItem value="raw">Raw</MenuItem>
                  <MenuItem value="formdata">Form Data</MenuItem>
                  <MenuItem value="urlencoded">URL Encoded</MenuItem>
                  <MenuItem value="binary">Binary</MenuItem>
                  <MenuItem value="graphql">GraphQL</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {request.body?.mode === 'raw' && (
              <TextField
                fullWidth
                multiline
                rows={12}
                value={request.body?.raw || ''}
                onChange={(e) => handleBodyChange({ ...request.body, raw: e.target.value })}
                placeholder="Enter request body..."
                sx={{ fontFamily: 'monospace' }}
              />
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default ModernRequestEditor;