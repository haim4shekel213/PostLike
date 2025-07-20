import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface QueryEditorProps {
    query: any;
    onQueryChange: (query: any) => void;
    onSendRequest: () => void;
    onSaveRequest: (updatedQuery: any) => void;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ query, onQueryChange, onSendRequest, onSaveRequest }) => {
    const [headerError, setHeaderError] = useState<string | null>(null);

    if (!query || !query.request) return null;

    const { name, request } = query;

    const handleHeaderChange = (value: string) => {
        try {
            const parsedHeaders = JSON.parse(value);
            setHeaderError(null);
            onQueryChange({ ...query, request: { ...request, header: parsedHeaders } });
        } catch (error) {
            setHeaderError('Invalid JSON format for headers.');
        }
    };

    const handleAuthChange = (type: string, token: string) => {
        const auth = type === 'none' ? null : { type, bearer: [{ key: 'token', value: token, type: 'string' }] };
        onQueryChange({ ...query, request: { ...request, auth } });
    };

    return (
        <Box mb={3}>
            <Typography variant="h6" gutterBottom>
                Edit Query: {name || 'Unnamed Query'}
            </Typography>
            <Box mb={2}>
                <TextField
                    label="Method"
                    fullWidth
                    value={request.method || ''}
                    onChange={(e) => onQueryChange({ ...query, request: { ...request, method: e.target.value } })}
                />
            </Box>
            <Box mb={2}>
                <TextField
                    label="URL"
                    fullWidth
                    value={request.url?.raw || ''}
                    onChange={(e) => onQueryChange({ ...query, request: { ...request, url: { ...request.url, raw: e.target.value } } })}
                />
            </Box>
            <Box mb={2}>
                <TextField
                    label="Headers"
                    fullWidth
                    multiline
                    rows={4}
                    value={JSON.stringify(request.header || {}, null, 2)}
                    onChange={(e) => handleHeaderChange(e.target.value)}
                    error={!!headerError}
                    helperText={headerError}
                />
            </Box>
            <Box mb={2}>
                <TextField
                    label="Body"
                    fullWidth
                    multiline
                    rows={4}
                    value={request.body?.raw || ''}
                    onChange={(e) => onQueryChange({ ...query, request: { ...request, body: { ...request.body, raw: e.target.value } } })}
                />
            </Box>
            <Box mb={2}>
                <FormControl fullWidth>
                    <InputLabel>Auth Type</InputLabel>
                    <Select
                        value={request.auth?.type || 'none'}
                        onChange={(e) => handleAuthChange(e.target.value, request.auth?.bearer?.[0]?.value || '')}
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="bearer">Bearer</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {request.auth?.type === 'bearer' && (
                <Box mb={2}>
                    <TextField
                        label="Bearer Token"
                        fullWidth
                        value={request.auth?.bearer?.[0]?.value || ''}
                        onChange={(e) => handleAuthChange('bearer', e.target.value)}
                    />
                </Box>
            )}
            <Box display="flex" gap={2}>
                <Button variant="contained" color="primary" onClick={onSendRequest}>
                    Send Request
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => onSaveRequest(query)}>
                    Save Changes
                </Button>
            </Box>
        </Box>
    );
};

export default QueryEditor;