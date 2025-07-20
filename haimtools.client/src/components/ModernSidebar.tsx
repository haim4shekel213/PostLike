import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  FolderOutlined,
  HttpOutlined,
  Search,
  History,
  Settings,
  Add,
  MoreVert,
} from '@mui/icons-material';
import { PostmanFile, PostmanCollection, PostmanItem } from '../types';

interface ModernSidebarProps {
  files: string[];
  content: PostmanFile | null;
  selectedFile: string;
  selectedCollection: string | null;
  selectedQuery: PostmanItem | null;
  onFileSelect: (fileName: string) => void;
  onCollectionSelect: (collectionName: string) => void;
  onQuerySelect: (query: PostmanItem) => void;
}

const DRAWER_WIDTH = 320;

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  files,
  content,
  selectedFile,
  selectedCollection,
  selectedQuery,
  onFileSelect,
  onCollectionSelect,
  onQuerySelect,
}) => {
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const toggleCollection = (collectionName: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [collectionName]: !prev[collectionName],
    }));
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: '#28A745',
      POST: '#FF6C37',
      PUT: '#FFC107',
      DELETE: '#DC3545',
      PATCH: '#6F42C1',
      HEAD: '#17A2B8',
      OPTIONS: '#6C757D',
    };
    return colors[method.toUpperCase()] || '#6C757D';
  };

  const filteredCollections = content?.item?.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.item.some((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const TabPanel = ({ children, value, index }: any) => (
    <div hidden={value !== index} style={{ height: '100%', overflow: 'auto' }}>
      {value === index && children}
    </div>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'background.default',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              API Client
            </Typography>
            <IconButton size="small">
              <Settings fontSize="small" />
            </IconButton>
          </Box>
          
          {/* File Selector */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Collections
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {files.map((file) => (
                <Chip
                  key={file}
                  label={file.replace('.json', '')}
                  onClick={() => onFileSelect(file)}
                  color={selectedFile === file ? 'primary' : 'default'}
                  size="small"
                  variant={selectedFile === file ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'grey.200' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Collections" />
            <Tab label="History" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={activeTab} index={0}>
            {/* Search */}
            <Box sx={{ p: 2, pb: 1 }}>
              <TextField
                fullWidth
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Collections List */}
            <List sx={{ px: 1, py: 0 }}>
              {filteredCollections.map((collection) => (
                <Box key={collection.name}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        toggleCollection(collection.name);
                        onCollectionSelect(collection.name);
                      }}
                      sx={{
                        borderRadius: 1,
                        mx: 1,
                        mb: 0.5,
                        backgroundColor: selectedCollection === collection.name ? 'primary.light' : 'transparent',
                        '&:hover': {
                          backgroundColor: selectedCollection === collection.name ? 'primary.light' : 'grey.100',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <FolderOutlined fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={collection.name}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      />
                      <IconButton size="small" edge="end">
                        {expandedCollections[collection.name] ? (
                          <ExpandLess fontSize="small" />
                        ) : (
                          <ExpandMore fontSize="small" />
                        )}
                      </IconButton>
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={expandedCollections[collection.name]} timeout="auto">
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {collection.item.map((item) => (
                        <ListItem key={item.name} disablePadding>
                          <ListItemButton
                            onClick={() => onQuerySelect(item)}
                            sx={{
                              borderRadius: 1,
                              mx: 1,
                              mb: 0.5,
                              backgroundColor: selectedQuery?.name === item.name ? 'primary.light' : 'transparent',
                              '&:hover': {
                                backgroundColor: selectedQuery?.name === item.name ? 'primary.light' : 'grey.100',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 1,
                                  backgroundColor: getMethodColor(item.request.method),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.6rem',
                                  }}
                                >
                                  {item.request.method.substring(0, 3)}
                                </Typography>
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={item.request.url.raw}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                noWrap: true,
                              }}
                            />
                            <IconButton size="small" edge="end">
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <History sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Request history will appear here
              </Typography>
            </Box>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {content?.item?.length || 0} collections
            </Typography>
            <Tooltip title="New Request">
              <IconButton size="small" color="primary">
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ModernSidebar;