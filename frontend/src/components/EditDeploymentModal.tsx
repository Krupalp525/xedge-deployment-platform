import React, { useState } from 'react';
import styles from './AddDeploymentModal.module.css'; // Reusing the same styles
import { Deployment, DeploymentUpdate } from '../types';

interface EditDeploymentModalProps {
  onClose: () => void;
  onUpdate: (deployment: DeploymentUpdate) => void;
  deployment: Deployment;
}

const EditDeploymentModal: React.FC<EditDeploymentModalProps> = ({ onClose, onUpdate, deployment }) => {
  const [formData, setFormData] = useState<DeploymentUpdate>({
    id: deployment.id,
    name: deployment.name,
    host: deployment.host,
    port: deployment.port
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for port field to ensure it's a valid port number
    if (name === 'port') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, '');
      
      // Ensure port is within valid range (1-65535)
      if (numericValue === '' || (parseInt(numericValue, 10) >= 1 && parseInt(numericValue, 10) <= 65535)) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Deployment</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="name">Edge Deployment Name</label>
            <input
              className={styles.input}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="host">Host</label>
            <input
              className={styles.input}
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="port">Port</label>
            <input
              className={styles.input}
              type="number"
              id="port"
              name="port"
              value={formData.port}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Update Deployment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDeploymentModal; 