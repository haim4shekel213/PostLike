import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

interface FileSelectorProps {
    files: string[];
    selectedFile: string;
    onFileSelect: (file: string) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ files, selectedFile, onFileSelect }) => {
    return (
        <div style={{ marginBottom: '20px' }}>
            <Typography variant="h6" gutterBottom>
                Select File
            </Typography>
            <FormControl fullWidth>
                <InputLabel id="file-selector-label">File</InputLabel>
                <Select
                    labelId="file-selector-label"
                    value={selectedFile}
                    onChange={(e) => onFileSelect(e.target.value)}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {files.map((file) => (
                        <MenuItem key={file} value={file}>
                            {file}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};

export default FileSelector;