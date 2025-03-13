import React, { useState } from 'react';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  Box, 
  TextField,
  InputAdornment,
  Paper,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';

interface PluginSetting {
  key: string;
  type: string;
  label: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  settings?: {
    basic: PluginSetting[];
  };
}

interface SidePanelProps {
  plugins: Plugin[];
}

const SidePanel: React.FC<SidePanelProps> = ({ plugins }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter plugins based on search term
  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group plugins by category
  const categories = filteredPlugins.reduce<Record<string, Plugin[]>>((acc, plugin) => {
    const cat = plugin.category || 
      (plugin.type.charAt(0).toUpperCase() + plugin.type.slice(1));
    
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(plugin);
    return acc;
  }, {});

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, pluginId: string) => {
    // Set multiple MIME types for better cross-browser compatibility
    console.log('Starting drag for plugin ID:', pluginId);
    
    // Set data in multiple formats for browser compatibility
    event.dataTransfer.setData('pluginId', pluginId);
    event.dataTransfer.setData('application/reactflow', pluginId);
    event.dataTransfer.setData('text', pluginId);
    event.dataTransfer.setData('text/plain', pluginId);
    
    // For Firefox, create a ghost image that's more visible
    const ghostElement = document.createElement('div');
    ghostElement.textContent = 'Plugin';
    ghostElement.style.backgroundColor = '#3f51b5';
    ghostElement.style.color = 'white';
    ghostElement.style.padding = '10px';
    ghostElement.style.borderRadius = '4px';
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';
    document.body.appendChild(ghostElement);
    
    event.dataTransfer.setDragImage(ghostElement, 0, 0);
    event.dataTransfer.effectAllowed = 'move';
    
    // Clean up the ghost element after the drag operation
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Available Plugins
      </Typography>
      <TextField
        fullWidth
        placeholder="Search plugins..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {Object.entries(categories).map(([category, pluginsInCategory]) => (
          <Accordion key={category} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                gap: 1 
              }}>
                {pluginsInCategory.map((plugin) => (
                  <Tooltip 
                    key={plugin.id}
                    title={plugin.description || ''}
                    placement="right"
                    arrow
                  >
                    <Paper
                      elevation={2}
                      onDragStart={(event) => handleDragStart(event, plugin.id)}
                      draggable="true"
                      role="button"
                      aria-label={`Drag ${plugin.name} plugin`}
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 0.5,
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'white',
                          boxShadow: 3,
                        },
                        '&:active': {
                          cursor: 'grabbing',
                        },
                        textAlign: 'center',
                      }}
                    >
                      <Typography 
                        variant="caption"
                        sx={{ 
                          fontSize: '0.7rem', 
                          lineHeight: 1.1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {plugin.name}
                      </Typography>
                    </Paper>
                  </Tooltip>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {filteredPlugins.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            {plugins.length > 0 ? 'No matching plugins found' : 'No plugins available'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SidePanel; 