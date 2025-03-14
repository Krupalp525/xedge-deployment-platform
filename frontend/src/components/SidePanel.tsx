import React, { useState, useRef, useEffect } from 'react';
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
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
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

interface PluginItemData {
  plugins: Plugin[];
  columns: number;
}

interface PluginItemProps {
  data: PluginItemData;
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

const SidePanel: React.FC<SidePanelProps> = ({ plugins }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
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

  const handleAccordionChange = (category: string) => (
    _event: React.SyntheticEvent, 
    expanded: boolean
  ) => {
    setExpandedCategory(expanded ? category : null);
  };

  // Virtualized plugin item for large lists
  const PluginItem = React.memo<PluginItemProps>(({ data, columnIndex, rowIndex, style }) => {
    const { plugins, columns } = data;
    const index = rowIndex * columns + columnIndex;
    
    if (index >= plugins.length) {
      return null;
    }
    
    const plugin = plugins[index];
    
    return (
      <Box style={style} padding={0.5}>
        <Tooltip 
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
              width: '100%',
              height: '100%',
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
      </Box>
    );
  });

  const renderPluginGrid = (category: string, pluginsInCategory: Plugin[]) => {
    // Use virtualization for categories with many plugins
    const shouldVirtualize = pluginsInCategory.length > 20;
    
    if (shouldVirtualize) {
      return (
        <Box sx={{ height: 250, width: '100%' }}>
          <AutoSizer>
            {({ height, width }: { height: number, width: number }) => {
              // Calculate how many items can fit in a row based on the width
              const ITEM_SIZE = 70; // 60px + 10px padding
              const columns = Math.max(1, Math.floor(width / ITEM_SIZE));
              const rows = Math.ceil(pluginsInCategory.length / columns);
              
              return (
                <FixedSizeGrid
                  columnCount={columns}
                  columnWidth={ITEM_SIZE}
                  height={height}
                  rowCount={rows}
                  rowHeight={ITEM_SIZE}
                  width={width}
                  itemData={{
                    plugins: pluginsInCategory,
                    columns
                  }}
                >
                  {PluginItem}
                </FixedSizeGrid>
              );
            }}
          </AutoSizer>
        </Box>
      );
    }
    
    // For smaller categories, use the regular grid
    return (
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
    );
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
          <Accordion 
            key={category} 
            defaultExpanded={pluginsInCategory.length < 10}
            onChange={handleAccordionChange(category)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{category}</Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                ({pluginsInCategory.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderPluginGrid(category, pluginsInCategory)}
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