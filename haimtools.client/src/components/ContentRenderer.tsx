import React from 'react';
import { Button, Typography, Box } from '@mui/material';

interface ContentRendererProps {
    content: any;
    currentFolder: any;
    onFolderSelect: (folder: any) => void;
    onQuerySelect: (query: any, collectionName?: string) => void;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, currentFolder, onFolderSelect, onQuerySelect }) => {
    if (!content) return null;

    if (currentFolder) {
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Collection: {currentFolder.name}
                </Typography>
                {currentFolder.item.map((item: any) => (
                    <Button
                        key={item.name}
                        variant="outlined"
                        onClick={() => (item.item ? onFolderSelect(item) : onQuerySelect(item, currentFolder.name))}
                        style={{ margin: '5px' }}
                    >
                        {item.name}
                    </Button>
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                File Content
            </Typography>
            {content.item.map((item: any) => (
                <Button
                    key={item.name}
                    variant="outlined"
                    onClick={() => (item.item ? onFolderSelect(item) : onQuerySelect(item))}
                    style={{ margin: '5px' }}
                >
                    {item.name}
                </Button>
            ))}
        </Box>
    );
};

export default ContentRenderer;