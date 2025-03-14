import React, { useState } from 'react';
import styles from './AddDeploymentModal.module.css';
import { Deployment, DeploymentCreate } from '../types';

interface AddDeploymentModalProps {
  onClose: () => void;
  onAdd: (deployment: DeploymentCreate) => void;
}

const AddDeploymentModal: React.FC<AddDeploymentModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<DeploymentCreate>({
    name: '',
    host: '',
    port: ''
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
    onAdd(formData);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Edge Deployment</h2>
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
              Add Deployment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeploymentModal; 