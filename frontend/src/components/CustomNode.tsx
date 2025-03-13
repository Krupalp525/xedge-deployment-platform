import React, { useEffect, useState, memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import styles from './CustomNode.module.css';

// Fixed dimensions for nodes to avoid resize loops
const NODE_WIDTH = 180;
const NODE_HEIGHT = 'auto';

// CustomNode component wrapped in React.memo to prevent unnecessary re-renders
const CustomNode: React.FC<NodeProps> = ({ data }) => {
  // Use state to track if the node is fully mounted
  const [mounted, setMounted] = useState(false);
  
  // Mark the node as mounted after first render
  useEffect(() => {
    // Delay the mount state slightly to allow the DOM to fully render
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`${styles.customNode} ${mounted ? styles.mounted : ''}`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      
      {/* Node content */}
      <div className={styles.nodeContent}>{data.label}</div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
    </div>
  );
};

// Use memo with a custom comparison function to prevent unnecessary re-renders
export default memo(CustomNode, (prevProps, nextProps) => {
  // Only re-render if the label or any other critical data has changed
  return (
    prevProps.data.label === nextProps.data.label &&
    prevProps.selected === nextProps.selected &&
    prevProps.dragging === nextProps.dragging
  );
}); 