import React from 'react';
import { Typography, Paper } from '@mui/material';

interface ResponseViewerProps {
    response: any;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ response }) => {
    if (!response) return null;

    return (
        <Paper elevation={3} style={{ padding: '16px', marginTop: '20px' }}>
            <Typography variant="h6" gutterBottom>
                Response
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {JSON.stringify(response, null, 2)}
            </pre>
        </Paper>
    );
};

export default ResponseViewer;