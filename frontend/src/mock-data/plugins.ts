import { Plugin } from '../types';

// Sample plugins data with the expected format
export const mockPlugins: Plugin[] = [
  {
    id: "plugin-input-file",
    name: "File Input",
    category: "Input",
    description: "Read data from a file",
    type: "source",
    settings: {
      basic: [
        { key: "filePath", type: "string", label: "File Path" }
      ]
    }
  },
  {
    id: "plugin-input-api",
    name: "API Input",
    category: "Input",
    description: "Fetch data from an API",
    type: "source",
    settings: {
      basic: [
        { key: "apiUrl", type: "string", label: "API URL" },
        { key: "interval", type: "number", label: "Polling Interval (ms)" }
      ]
    }
  },
  {
    id: "plugin-filter-basic",
    name: "Basic Filter",
    category: "Processing",
    description: "Filter data based on conditions",
    type: "filter",
    settings: {
      basic: [
        { key: "condition", type: "string", label: "Filter Condition" }
      ]
    }
  },
  {
    id: "plugin-transform-json",
    name: "JSON Transform",
    category: "Processing",
    description: "Transform data format",
    type: "transform",
    settings: {
      basic: [
        { key: "template", type: "text", label: "JSON Template" }
      ]
    }
  },
  {
    id: "plugin-process-ai",
    name: "AI Processor",
    category: "Advanced",
    description: "Process data using AI models",
    type: "process",
    settings: {
      basic: [
        { key: "modelId", type: "string", label: "Model ID" },
        { key: "batchSize", type: "number", label: "Batch Size" }
      ]
    }
  },
  {
    id: "plugin-output-database",
    name: "Database Output",
    category: "Output",
    description: "Store data in a database",
    type: "sink",
    settings: {
      basic: [
        { key: "connectionString", type: "string", label: "Connection String" },
        { key: "tableName", type: "string", label: "Table Name" }
      ]
    }
  },
  {
    id: "plugin-output-file",
    name: "File Output",
    category: "Output",
    description: "Write data to a file",
    type: "sink",
    settings: {
      basic: [
        { key: "outputPath", type: "string", label: "Output File Path" }
      ]
    }
  }
]; 