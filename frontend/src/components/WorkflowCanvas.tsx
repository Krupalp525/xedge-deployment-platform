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
import { Grid, Paper, Button, Box, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import 'reactflow/dist/style.css';
import SidePanel from './SidePanel';
import ConfigPanel from './ConfigPanel';
import CustomNode from './CustomNode';
import { debounce } from 'lodash';

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  settings?: {
    basic: Array<{
      key: string;
      type: string;
      label: string;
    }>;
  };
}

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
  elements?: WorkflowElement[];
  nodes?: Node[];
  edges?: Edge[];
}

const WorkflowCanvas: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploymentName, setDeploymentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    setLoading(true);
    
    // Fetch deployment details
    const fetchDeploymentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/deployments/${deploymentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        setDeploymentName(response.data.name);
      } catch (err: any) {
        const errorMessage = err.response ? 
          `Error: ${err.response.status} - ${err.response.statusText}` : 
          'Error loading deployment details. Server may be offline.';
        setError(errorMessage);
        console.error('Error fetching deployment details:', err);
      }
    };

    // Fetch available plugins
    const fetchPlugins = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/plugins', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-auth-token': localStorage.getItem('token')
          }
        });
        setPlugins(response.data);
      } catch (err) {
        console.error('Failed to fetch plugins:', err);
        // Using mock data if fetch fails is handled by the mock API
      }
    };

    // Fetch existing workflow
    const fetchWorkflow = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/deployments/${deploymentId}/workflow`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        const workflowData: WorkflowData = response.data;
        
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
              type: el.type
            }));
          
          setNodes(nodesArray);
          setEdges(edgesArray);
        } else {
          // Set default empty workflow
          setNodes([]);
          setEdges([]);
        }
      } catch (err) {
        console.error('Failed to fetch workflow:', err);
        // Set default empty workflow
        setNodes([]);
        setEdges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeploymentDetails();
    fetchPlugins();
    fetchWorkflow();
  }, [deploymentId, setNodes, setEdges]);

  // Handle connecting nodes
  const onConnect = (params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  };

  // Handle node selection
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  // Handle edge selection
  const onEdgeClick = () => {
    setSelectedNode(null);
  };

  // Handle pane (background) clicks - deselect any selected node
  const onPaneClick = () => {
    // Only clear selection if there's actually a node selected
    if (selectedNode) {
      setSelectedNode(null);
    }
  };

  // Save the workflow
  const handleSave = async () => {
    try {
      // Convert to the format expected by the API
      const workflowData = { 
        elements: nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          position: node.position,
          data: node.data
        }))
      };

      await axios.put(`http://localhost:5000/api/deployments/${deploymentId}/workflow`, 
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );
      alert('Workflow saved successfully');
    } catch (err) {
      console.error('Failed to save workflow:', err);
      alert('Failed to save workflow. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/deployments');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Loading workflow...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleBack} 
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          sx={{ backgroundColor: '#1976d2', color: '#fff' }}
        >
          Back to Deployments
        </Button>
        <Paper sx={{ mt: 2, p: 3, bgcolor: '#ffebee' }}>
          <Typography variant="h6" color="error">Error</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Please check your connection and try again.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack} size="small">
            <FontAwesomeIcon icon={faArrowLeft} />
          </IconButton>
          <Typography variant="h6">Workflow for {deploymentName}</Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          startIcon={<FontAwesomeIcon icon={faSave} />}
          sx={{ backgroundColor: '#1976d2', color: '#fff' }}
        >
          Save Workflow
        </Button>
      </Box>
      
      {/* Main Layout */}
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 2 }}>
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ height: '100%', p: 2, overflowY: 'auto' }}>
            <SidePanel plugins={plugins} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={selectedNode ? 7 : 10}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <ReactFlowProvider>
              <div style={{ width: '100%', height: '100%' }}>
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
              </div>
            </ReactFlowProvider>
          </Paper>
        </Grid>
        {selectedNode && (
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ height: '100%', p: 2, overflowY: 'auto' }}>
              <ConfigPanel
                node={selectedNode}
                setNodes={setNodes}
                plugins={plugins}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
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
  
  // Define node types with our custom node
  const nodeTypes = useMemo(() => ({ default: CustomNode }), []);
  
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