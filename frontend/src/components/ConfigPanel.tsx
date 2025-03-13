import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  TextField, 
  Button, 
  FormControl, 
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Node } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

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

interface ConfigPanelProps {
  node: Node;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  plugins: Plugin[];
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ node, setNodes, plugins }) => {
  // Find the corresponding plugin
  const plugin = plugins.find(p => p.id === node.data.pluginId);
  
  // Set up state for the form
  const [label, setLabel] = useState(node.data.label || '');
  const [config, setConfig] = useState<Record<string, any>>(node.data.config || {});
  
  // Set default config fields based on plugin settings
  useEffect(() => {
    if (plugin && plugin.settings?.basic) {
      const newConfig = { ...config };
      let configChanged = false;
      
      // Initialize any missing settings with default values
      plugin.settings.basic.forEach(setting => {
        if (newConfig[setting.key] === undefined) {
          configChanged = true;
          
          // Set default values based on type
          switch (setting.type) {
            case 'string':
            case 'text':
              newConfig[setting.key] = '';
              break;
            case 'number':
              newConfig[setting.key] = 0;
              break;
            case 'boolean':
              newConfig[setting.key] = false;
              break;
            default:
              newConfig[setting.key] = '';
          }
        }
      });
      
      // Only update if we've added new defaults
      if (configChanged) {
        setConfig(newConfig);
      }
    }
  }, [plugin, config]);
  
  // Update node data
  const updateNodeData = () => {
    setNodes(nds => 
      nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              label,
              config
            }
          };
        }
        return n;
      })
    );
  };
  
  // Handle config change
  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNodeData();
  };
  
  // Create form fields based on plugin settings
  const renderFormFields = () => {
    if (!plugin || !plugin.settings?.basic) return null;
    
    return plugin.settings.basic.map(setting => {
      const { key, type, label } = setting;
      
      switch (type) {
        case 'string':
        case 'text':
          return (
            <TextField
              key={key}
              fullWidth
              margin="dense"
              label={label}
              value={config[key] || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              variant="outlined"
              size="small"
              multiline={type === 'text'}
              rows={type === 'text' ? 4 : 1}
            />
          );
        case 'number':
          return (
            <TextField
              key={key}
              fullWidth
              margin="dense"
              label={label}
              type="number"
              value={config[key] || 0}
              onChange={(e) => handleConfigChange(key, Number(e.target.value))}
              variant="outlined"
              size="small"
            />
          );
        case 'boolean':
          return (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={!!config[key]}
                  onChange={(e) => handleConfigChange(key, e.target.checked)}
                  color="primary"
                />
              }
              label={label}
            />
          );
        default:
          return null;
      }
    });
  };
  
  // Update JSON configuration
  const handleJsonChange = (json: string) => {
    try {
      const newConfig = JSON.parse(json);
      setConfig(newConfig);
    } catch (err) {
      // Ignore invalid JSON
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Plugin Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {plugin?.description || 'Configure this plugin'}
      </Typography>
      <Divider sx={{ my: 2 }} />
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Plugin Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ mb: 3 }}
        />
        
        {/* Basic configuration fields */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
          >
            <Typography variant="subtitle2">Basic Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderFormFields()}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* Advanced configuration - JSON editor */}
        <Accordion>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
          >
            <Typography variant="subtitle2">Advanced Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                fullWidth
                label="JSON Configuration"
                multiline
                rows={4}
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => handleJsonChange(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2, width: '100%' }}
        >
          Save Configuration
        </Button>
      </form>
      
      <Box sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          onClick={() => {
            setNodes(nds => nds.filter(n => n.id !== node.id));
          }}
        >
          Remove Plugin
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigPanel; 