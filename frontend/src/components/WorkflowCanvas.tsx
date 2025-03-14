import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  Edge,
  Node,
  Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeTypes,
  useOnViewportChange,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { Grid, Paper, Button, Box, Typography, IconButton, Alert, Skeleton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SidePanel from './SidePanel';
import ConfigPanel from './ConfigPanel';
import CustomNode from './CustomNode';
import { debounce } from 'lodash';
import { deploymentsApi, pluginsApi, workflowsApi, getApiMode } from '../api';
import { Plugin, Deployment, Workflow } from '../types';

// Define the custom node types
const customNodeTypes = { default: CustomNode, custom: CustomNode };

interface WorkflowElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    pluginId?: string;
    label?: string;
    config?: Record<string, any>;
  };
}

interface WorkflowData {
  elements: WorkflowElement[];
  nodes?: Node[];
  edges?: Edge[];
}

const WorkflowCanvas: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pluginsError, setPluginsError] = useState<string | null>(null);
  const [deploymentName, setDeploymentName] = useState('');
  
  // Convert deploymentId to number
  const parsedDeploymentId = deploymentId ? parseInt(deploymentId, 10) : undefined;
  const isValidDeploymentId = parsedDeploymentId !== undefined && !isNaN(parsedDeploymentId);

  // Process workflow data and set nodes/edges
  const processWorkflowData = useCallback((workflowData: any) => {
    if (!workflowData) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    if (workflowData.nodes && workflowData.edges) {
      // If the API returns nodes and edges directly
      setNodes(workflowData.nodes);
      setEdges(workflowData.edges);
    } else if (workflowData.elements) {
      // If the API returns elements array in the expected format
      const elements = workflowData.elements;
      
      // Convert elements to nodes (all non-edge elements are nodes)
      const nodesArray = elements
        .filter((el: any) => el.type !== 'edge')
        .map((el: any) => ({
          id: el.id,
          type: el.type || 'default',
          position: el.position,
          data: el.data
        }));
      
      // Look for edges in the elements or create them if needed
      const edgesArray = elements
        .filter((el: any) => el.type === 'edge')
        .map((el: any) => ({
          id: el.id,
          source: el.source,
          target: el.target,
          type: el.type || 'default'
        }));
      
      setNodes(nodesArray);
      setEdges(edgesArray);
    } else {
      // Set default empty workflow
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  // Fetch deployment details
  const { 
    data: deployment, 
    isLoading: isDeploymentLoading, 
    error: deploymentError 
  } = useQuery({
    queryKey: ['deployment', parsedDeploymentId],
    queryFn: () => {
      if (!isValidDeploymentId) {
        throw new Error("Invalid deployment ID");
      }
      return deploymentsApi.getById(parsedDeploymentId);
    },
    enabled: isValidDeploymentId
  });

  // Update deployment name when data is available
  useEffect(() => {
    if (deployment?.success && deployment.data) {
      setDeploymentName(deployment.data.name);
    }
  }, [deployment]);

  // Destructure deployment data for cleaner access
  const deploymentData = deployment?.success ? deployment.data : null;
  
  // Check connection status (in real API mode)
  const { 
    data: connectionStatus,
    isLoading: isConnectionLoading
  } = useQuery({
    queryKey: ['connection', parsedDeploymentId],
    queryFn: () => {
      if (!deploymentData) return Promise.resolve({ success: false, error: "No deployment data" });
      return deploymentsApi.checkConnection(deploymentData);
    },
    enabled: !!deploymentData && getApiMode() === 'real',
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const isConnected = connectionStatus?.success && 
                      connectionStatus.data?.connectionStatus === 'connected';

  // Fetch plugins - try Fledge first, then fall back to regular API
  const { 
    data: plugins = [],
    isLoading: isPluginsLoading
  } = useQuery({
    queryKey: ['plugins', parsedDeploymentId, isConnected],
    queryFn: async () => {
      // Try to get plugins from Fledge if connected
      if (getApiMode() === 'real' && deploymentData && isConnected) {
        try {
          console.log('Fetching plugins from Fledge server');
          const pluginsResponse = await pluginsApi.getFledgePlugins(deploymentData);
          
          if (pluginsResponse.success && pluginsResponse.data) {
            return pluginsResponse.data;
          } else {
            setPluginsError(`Could not load plugins from Fledge server: ${pluginsResponse.error}. Using mock plugins instead.`);
          }
        } catch (error: any) {
          console.error('Error fetching plugins from Fledge:', error);
          setPluginsError(`Error loading plugins from Fledge: ${error.message}`);
        }
      }
      
      // Fall back to regular API
      const fallbackResponse = await pluginsApi.getAll();
      if (fallbackResponse.success) {
        return fallbackResponse.data || [];
      }
      return [];
    },
    enabled: !!deploymentData,
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

  // Fetch workflow
  const {
    data: workflow,
    isLoading: isWorkflowLoading
  } = useQuery({
    queryKey: ['workflow', parsedDeploymentId, isConnected],
    queryFn: async () => {
      if (!isValidDeploymentId) {
        throw new Error("Invalid deployment ID");
      }

      // Try to get workflow from Fledge if connected
      if (getApiMode() === 'real' && deploymentData && isConnected) {
        try {
          console.log('Trying to fetch workflow directly from Fledge server');
          const fledgeWorkflowResponse = await workflowsApi.getFledgeWorkflow(deploymentData);
          
          if (fledgeWorkflowResponse.success && fledgeWorkflowResponse.data) {
            console.log('Successfully fetched workflow from Fledge server');
            return fledgeWorkflowResponse.data;
          }
        } catch (error) {
          console.error('Error fetching workflow from Fledge:', error);
        }
      }
      
      // Fall back to regular API
      console.log('Fetching workflow from our API');
      const response = await workflowsApi.getByDeploymentId(parsedDeploymentId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    },
    enabled: isValidDeploymentId
  });

  // Process workflow data when available
  useEffect(() => {
    if (workflow) {
      processWorkflowData(workflow);
    }
  }, [workflow, processWorkflowData]);

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflowData: Workflow) => {
      if (!isValidDeploymentId) {
        throw new Error('Invalid deployment ID');
      }
      
      // Try to save to Fledge if connected
      if (getApiMode() === 'real' && deploymentData && isConnected) {
        try {
          console.log('Trying to save workflow directly to Fledge server');
          const fledgeResponse = await workflowsApi.updateFledgeWorkflow(
            deploymentData, 
            workflowData
          );
          
          if (fledgeResponse.success) {
            return { source: 'fledge', data: fledgeResponse.data };
          }
        } catch (error) {
          console.error('Error saving workflow to Fledge:', error);
        }
      }
      
      // Fall back to regular API
      console.log('Saving workflow to our API');
      const response = await workflowsApi.update(parsedDeploymentId, workflowData);
      
      if (response.success) {
        return { source: 'api', data: response.data };
      }
      
      throw new Error(response.error || 'Unknown error saving workflow');
    },
    onSuccess: (result) => {
      alert(`Workflow saved successfully${result.source === 'fledge' ? ' to Fledge server' : ''}`);
    },
    onError: (error: Error) => {
      console.error('Failed to save workflow:', error);
      alert(`Failed to save workflow. ${error.message || 'Please try again.'}`);
    }
  });

  // Check if we're loading any data
  const isLoading = isDeploymentLoading || isWorkflowLoading;
  const error = deploymentError ? String(deploymentError) : null;

  // Handle connecting nodes
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle pane (background) clicks - deselect any selected node
  const onPaneClick = useCallback(() => {
    // Only clear selection if there's actually a node selected
    if (selectedNode) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Save the workflow
  const handleSave = useCallback(() => {
    // Convert to the format expected by the API
    const workflowData: Workflow = { 
      elements: nodes.map(node => ({
        id: node.id,
        type: node.type || 'default',
        position: node.position,
        data: node.data
      }))
    };
    
    saveWorkflowMutation.mutate(workflowData);
  }, [nodes, saveWorkflowMutation]);

  const handleBack = useCallback(() => {
    navigate('/deployments');
  }, [navigate]);

  // Prepare the loading and error UI
  const renderLoading = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 3, height: '100vh' }}>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={300} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Box>
      
      {/* Main content skeleton */}
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Left sidebar skeleton */}
        <Grid item xs={2}>
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
        </Grid>
        
        {/* Center canvas skeleton */}
        <Grid item xs={10}>
          <Skeleton 
            variant="rectangular" 
            height="100%" 
            sx={{ 
              minHeight: 400,
              animation: 'pulse 1.5s ease-in-out 0.5s infinite'
            }} 
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderError = () => (
    <Box sx={{ p: 3 }}>
      <Button 
        variant="contained" 
        onClick={handleBack} 
        startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        sx={{ backgroundColor: '#1976d2', color: '#fff' }}
      >
        Back to Deployments
      </Button>
      <Typography variant="h6" sx={{ mt: 3, color: 'error.main' }}>
        Error: {error}
      </Typography>
    </Box>
  );

  const renderWorkflowEditor = () => (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={handleBack} 
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {deploymentName} - Workflow Editor
          {isConnected && (
            <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
              (Connected to Fledge)
            </Typography>
          )}
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          startIcon={<FontAwesomeIcon icon={faSave} />}
          color="primary"
          disabled={saveWorkflowMutation.isPending}
        >
          {saveWorkflowMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Show plugin loading error if there is one */}
      {pluginsError && (
        <Alert severity="warning" sx={{ m: 2 }}>
          {pluginsError}
        </Alert>
      )}

      {/* Main content */}
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left sidebar - Plugin list */}
        <Grid item xs={2} sx={{ borderRight: '1px solid #e0e0e0', height: '100%', overflowY: 'auto' }}>
          {isPluginsLoading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
            </Box>
          ) : (
            <SidePanel plugins={plugins} />
          )}
        </Grid>

        {/* Center - Flow canvas */}
        <Grid item xs={selectedNode ? 7 : 10} sx={{ height: '100%' }}>
          <ReactFlowProvider>
            <FlowWithDropSupport
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              plugins={plugins}
              setNodes={setNodes}
            />
          </ReactFlowProvider>
        </Grid>

        {/* Right sidebar - Node configuration */}
        {selectedNode && (
          <Grid item xs={3} sx={{ borderLeft: '1px solid #e0e0e0', height: '100%', overflowY: 'auto' }}>
            <ConfigPanel 
              node={selectedNode} 
              setNodes={setNodes} 
              plugins={plugins}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // Render the component based on state
  if (isLoading) {
    return renderLoading();
  }

  if (error) {
    return renderError();
  }

  return renderWorkflowEditor();
};

// Define props interface for FlowWithDropSupport
interface FlowWithDropSupportProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: () => void;
  onPaneClick: () => void;
  plugins: Plugin[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

// This component has access to useReactFlow for coordinate transformation
const FlowWithDropSupport: React.FC<FlowWithDropSupportProps> = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect, 
  onNodeClick, 
  onEdgeClick, 
  onPaneClick,
  plugins,
  setNodes
}) => {
  const reactFlow = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Define node types with our custom node - using non-hook constant from top level
  const nodeTypes = customNodeTypes;
  
  // Debounce node changes to prevent too many updates
  const debouncedNodesChange = useCallback(
    debounce((changes: NodeChange[]) => {
      onNodesChange(changes);
    }, 10),
    [onNodesChange]
  );
  
  // Debounce edge changes to prevent too many updates
  const debouncedEdgesChange = useCallback(
    debounce((changes: EdgeChange[]) => {
      onEdgesChange(changes);
    }, 10),
    [onEdgesChange]
  );
  
  // Memoize the reactflow instance to avoid unnecessary re-renders
  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('ReactFlow initialized');
    setRfInstance(instance);
    setIsInitialized(true);
  }, []);
  
  // Stop propagation of wheel events to prevent zooming while scrolling
  const onWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, []);
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Drag over detected');
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log('Drop event detected');
    console.log('Available data types:', event.dataTransfer.types);
    
    // Try to get plugin ID from different MIME types
    let pluginId = event.dataTransfer.getData('pluginId');
    
    if (!pluginId) {
      pluginId = event.dataTransfer.getData('application/reactflow');
      console.log('Trying alternative MIME type: application/reactflow');
    }
    
    if (!pluginId) {
      pluginId = event.dataTransfer.getData('text');
      console.log('Trying text MIME type');
    }
    
    if (!pluginId) {
      pluginId = event.dataTransfer.getData('text/plain');
      console.log('Trying text/plain MIME type');
    }
    
    console.log('Plugin ID from drop:', pluginId);
    
    if (!pluginId || !isInitialized) {
      console.log('No valid plugin ID or React Flow not initialized');
      return;
    }
    
    // Find the plugin to get its details
    const plugin = plugins.find(p => p.id === pluginId);
    
    if (!plugin) {
      console.log('Plugin not found with ID:', pluginId);
      return;
    }
    
    console.log('Found plugin:', plugin.name);
    
    // Calculate the drop position using ReactFlow's coordinate system
    const position = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    const newNode = {
      id: `${pluginId}-${Date.now()}`,
      type: 'default',
      position,
      data: { 
        label: plugin.name,
        pluginId: plugin.id, 
        config: {} 
      },
    };
    
    console.log('Creating new node:', newNode);
    setNodes((nds) => nds.concat(newNode));
  }, [plugins, reactFlow, setNodes, isInitialized]);
  
  return (
    <div 
      ref={reactFlowWrapper} 
      style={{ 
        width: '100%',
        height: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onWheel={onWheel}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={debouncedNodesChange}
        onEdgesChange={debouncedEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: '100%', height: '100%' }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        elementsSelectable={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        panOnScroll={true}
        panOnDrag={true}
        preventScrolling={true}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas; 