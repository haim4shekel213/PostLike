import React, { useState } from 'react';

interface SidebarProps {
    files: string[];
    content: any;
    onFileSelect: (fileName: string) => void;
    onCollectionSelect: (collectionName: string) => void;
    onQuerySelect: (query: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ files, content, onFileSelect, onCollectionSelect, onQuerySelect }) => {
    const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
    const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});

    const toggleFile = (fileName: string) => {
        setExpandedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
    };

    const toggleCollection = (collectionName: string) => {
        setExpandedCollections((prev) => ({ ...prev, [collectionName]: !prev[collectionName] }));
    };

    return (
        <div style={{ width: '250px', background: '#f4f4f4', padding: '10px', overflowY: 'auto' }}>
            <h3>Files</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {files.map((file) => (
                    <li key={file}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <button onClick={() => toggleFile(file)} style={{ marginRight: '5px' }}>
                                {expandedFiles[file] ? '-' : '+'}
                            </button>
                            <span onClick={() => onFileSelect(file)}>{file}</span>
                        </div>
                        {expandedFiles[file] && content && (
                            <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                                {content.item?.map((collection: any) => (
                                    <li key={collection.name}>
                                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <button onClick={() => toggleCollection(collection.name)} style={{ marginRight: '5px' }}>
                                                {expandedCollections[collection.name] ? '-' : '+'}
                                            </button>
                                            <span onClick={() => onCollectionSelect(collection.name)}>{collection.name}</span>
                                        </div>
                                        {expandedCollections[collection.name] && (
                                            <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                                                {collection.item?.map((query: any) => (
                                                    <li
                                                        key={query.name}
                                                        onClick={() => onQuerySelect(query)}
                                                        style={{ cursor: 'pointer', marginBottom: '5px' }}
                                                    >
                                                        {query.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;