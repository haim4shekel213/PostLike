import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PostmanCollection, PostmanItem, PostmanRequest, RequestResponse } from '@/types/postman';
import { CollectionTree } from './CollectionTree';
import { RequestEditor } from './RequestEditor';
import { ResponseViewer } from './ResponseViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, Plus, FileText, Folder, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  parsePostmanCollection, 
  exportCollection, 
  createNewCollection, 
  createNewRequest, 
  createNewFolder,
  findItemByPath
} from '@/utils/postmanUtils';

export function PostmanApp() {
  const [collections, setCollections] = useState<PostmanCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<PostmanCollection | null>(null);
  const [activeRequest, setActiveRequest] = useState<PostmanRequest | null>(null);
  const [activeRequestPath, setActiveRequestPath] = useState<string[]>([]);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  // Load files from your backend on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get('/api/Postman/list-files');
      setFiles(res.data);
      
      // Load all collections from files
      const collectionsPromises = res.data.map(async (fileName: string) => {
        try {
          const fileRes = await axios.get(`/api/Postman/get-file/${fileName}`);
          return parsePostmanCollection(fileRes.data);
        } catch (error) {
          console.error(`Error loading file ${fileName}:`, error);
          return null;
        }
      });
      
      const loadedCollections = (await Promise.all(collectionsPromises))
        .filter((collection): collection is PostmanCollection => collection !== null);
      
      setCollections(loadedCollections);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error loading files",
        description: "Failed to load collections from server",
        variant: "destructive",
      });
    }
  };

  const handleSelectRequest = (collection: PostmanCollection, request: PostmanRequest, path: string[]) => {
    setActiveCollection(collection);
    setActiveRequest(request);
    setActiveRequestPath(path);
    setResponse(null);
  };

  const handleSendRequest = async () => {
    if (!activeRequest) return;

    setIsLoading(true);
    try {
      // Use your existing backend API
      const res = await axios.post('/api/Postman/execute-request', activeRequest);
      setResponse({
        status: res.data.status || res.status,
        statusText: res.data.statusText || res.statusText,
        headers: res.data.headers || {},
        data: res.data.data || res.data,
        responseTime: res.data.responseTime || 0,
        size: res.data.size || 0
      });
      
      toast({
        title: "Request sent successfully",
        description: `${activeRequest.method} ${activeRequest.url}`,
      });
    } catch (error: any) {
      const errorResponse: RequestResponse = {
        status: error.response?.status || 0,
        statusText: error.response?.statusText || 'Network Error',
        headers: error.response?.headers || {},
        data: error.response?.data || error.message,
        responseTime: 0,
        size: 0
      };
      setResponse(errorResponse);
      
      toast({
        title: "Request failed",
        description: error.message || "An error occurred while sending the request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRequest = async (updatedRequest: PostmanRequest) => {
    if (!activeCollection || !activeRequest) {
      toast({
        title: "No request selected",
        description: "Please select a request to save",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the collection file name
      const collectionFileName = `${activeCollection.info.name}.json`;
      
      // Use your existing backend API to save
      await axios.post(
        `/api/Postman/save-file/${collectionFileName}?collectionName=${activeCollection.info.name}&requestName=${updatedRequest.name}`,
        updatedRequest
      );
      
      // Update local state
      setActiveRequest(updatedRequest);
      
      // Update the collection in the collections array
      setCollections(prev => prev.map(collection => {
        if (collection.info._postman_id === activeCollection.info._postman_id) {
          // Update the request in the collection
          const updateItem = (items: PostmanItem[]): PostmanItem[] => {
            return items.map(item => {
              if ('request' in item && item.request && 
                  item.name === activeRequest.name) {
                return { ...item, request: updatedRequest };
              } else if ('item' in item) {
                return { ...item, item: updateItem(item.item) };
              }
              return item;
            });
          };
          
          return {
            ...collection,
            item: updateItem(collection.item)
          };
        }
        return collection;
      }));
      
      toast({
        title: "Request saved",
        description: `Successfully saved "${updatedRequest.name}"`,
      });
    } catch (error: any) {
      console.error('Error saving request:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save the request",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const collection = parsePostmanCollection(json);
          
          // Save to backend (you might need to implement this endpoint)
          // For now, just add to local state
          setCollections(prev => [...prev, collection]);
          
          toast({
            title: "Collection imported",
            description: `Successfully imported "${collection.info.name}"`,
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid Postman collection file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import collection",
        variant: "destructive",
      });
    }
    
    event.target.value = '';
  };

  const handleExport = (collection: PostmanCollection) => {
    const json = exportCollection(collection);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.info.name}.postman_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Collection exported",
      description: `"${collection.info.name}" has been downloaded`,
    });
  };

  const handleCreateCollection = () => {
    const name = prompt('Enter collection name:');
    if (!name) return;

    const newCollection = createNewCollection(name);
    setCollections(prev => [...prev, newCollection]);
    
    toast({
      title: "Collection created",
      description: `"${name}" collection has been created`,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">HaimTools API Client</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateCollection}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-r">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Collections
                </h2>
              </div>
              <div className="p-2 overflow-auto">
                {collections.map((collection) => (
                  <CollectionTree
                    key={collection.info._postman_id}
                    collection={collection}
                    onSelectRequest={handleSelectRequest}
                    onExport={() => handleExport(collection)}
                    selectedPath={activeRequestPath}
                  />
                ))}
                {collections.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No collections loaded</p>
                    <p className="text-xs mt-1">Import a collection or create a new one</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Panel */}
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Request Editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full">
                  {activeRequest ? (
                    <RequestEditor
                      request={activeRequest}
                      onRequestChange={setActiveRequest}
                      onSendRequest={handleSendRequest}
                      onSaveRequest={handleSaveRequest}
                      isLoading={isLoading}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <FileText className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No request selected</h3>
                        <p className="text-sm">Select a request from the sidebar to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Response Viewer */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full">
                  <ResponseViewer response={response} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}