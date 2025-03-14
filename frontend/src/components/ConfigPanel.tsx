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
  AccordionDetails,
  FormHelperText
} from '@mui/material';
import { Node } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface PluginSetting {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
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
  
  // Set up state for form data
  const [config, setConfig] = useState<Record<string, any>>(node.data.config || {});
  
  // Build dynamic validation schema based on plugin settings
  const buildValidationSchema = () => {
    if (!plugin || !plugin.settings?.basic) {
      return yup.object({
        label: yup.string().required('Label is required')
      });
    }
    
    const schema: Record<string, any> = {
      label: yup.string().required('Label is required')
    };
    
    plugin.settings.basic.forEach(setting => {
      const { key, type, required, min, max, pattern } = setting;
      
      // Set up field validation based on type
      switch (type) {
        case 'string':
        case 'text':
          let stringSchema = yup.string();
          
          if (required) {
            stringSchema = stringSchema.required(`${setting.label} is required`);
          }
          
          if (pattern) {
            stringSchema = stringSchema.matches(
              new RegExp(pattern), 
              `${setting.label} format is invalid`
            );
          }
          
          schema[key] = stringSchema;
          break;
          
        case 'number':
          let numberSchema = yup.number().typeError(`${setting.label} must be a number`);
          
          if (required) {
            numberSchema = numberSchema.required(`${setting.label} is required`);
          }
          
          if (min !== undefined) {
            numberSchema = numberSchema.min(min, `${setting.label} must be at least ${min}`);
          }
          
          if (max !== undefined) {
            numberSchema = numberSchema.max(max, `${setting.label} must be at most ${max}`);
          }
          
          schema[key] = numberSchema;
          break;
          
        case 'boolean':
          schema[key] = yup.boolean();
          break;
          
        default:
          schema[key] = yup.mixed();
      }
    });
    
    return yup.object(schema);
  };
  
  // Create form validation schema
  const validationSchema = buildValidationSchema();
  
  // Set up form with react-hook-form
  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      label: node.data.label || '',
      ...config
    }
  });
  
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
          
          // Update form value
          setValue(setting.key, newConfig[setting.key]);
        }
      });
      
      // Only update if we've added new defaults
      if (configChanged) {
        setConfig(newConfig);
      }
    }
  }, [plugin, config, setValue]);
  
  // Update node data
  const updateNodeData = (formData: any) => {
    const { label, ...formConfig } = formData;
    
    setNodes(nds => 
      nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              label,
              config: formConfig
            }
          };
        }
        return n;
      })
    );
    
    // Update local state
    setConfig(formConfig);
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
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="dense"
                  label={label}
                  variant="outlined"
                  size="small"
                  multiline={type === 'text'}
                  rows={type === 'text' ? 4 : 1}
                  error={!!errors[key]}
                  helperText={errors[key]?.message as string}
                />
              )}
            />
          );
        case 'number':
          return (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="dense"
                  label={label}
                  type="number"
                  variant="outlined"
                  size="small"
                  error={!!errors[key]}
                  helperText={errors[key]?.message as string}
                  // Handle NaN input
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              )}
            />
          );
        case 'boolean':
          return (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={label}
                />
              )}
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
      
      // Update form values
      Object.entries(newConfig).forEach(([key, value]) => {
        setValue(key, value);
      });
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
      
      <form onSubmit={handleSubmit(updateNodeData)}>
        <Controller
          name="label"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Plugin Label"
              variant="outlined"
              size="small"
              sx={{ mb: 3 }}
              error={!!errors.label}
              helperText={errors.label?.message as string}
            />
          )}
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
          fullWidth 
          sx={{ mt: 3 }}
        >
          Apply Changes
        </Button>
      </form>
    </Box>
  );
};

export default ConfigPanel; 