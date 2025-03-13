import React, { useState, useEffect } from 'react';
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
} from 'reactflow';
import { Grid, Paper, Button, Box, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import 'reactflow/dist/style.css';
import SidePanel from './SidePanel';
import ConfigPanel from './ConfigPanel';

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

  // Handle dragging plugins onto the canvas
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pluginId = event.dataTransfer.getData('application/reactflow');
    
    if (!pluginId) return;
    
    // Find the plugin to get its details
    const plugin = plugins.find(p => p.id === pluginId);
    
    if (!plugin) return;
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'default',
      position,
      data: { 
        label: plugin.name,
        pluginId: plugin.id, 
        config: {} 
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
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
        <Button variant="contained" onClick={handleBack} startIcon={<FontAwesomeIcon icon={faArrowLeft} />}>
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
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onPaneClick={onPaneClick}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  fitView
                >
                  <Controls />
                </ReactFlow>
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

export default WorkflowCanvas; 