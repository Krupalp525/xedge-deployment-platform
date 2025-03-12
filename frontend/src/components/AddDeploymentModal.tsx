import React, { useState } from 'react';
import styles from './AddDeploymentModal.module.css';

interface DeploymentFormData {
  name: string;
  host: string;
  port: string;
}

interface AddDeploymentModalProps {
  onClose: () => void;
  onAdd: (deployment: DeploymentFormData) => void;
}

const AddDeploymentModal: React.FC<AddDeploymentModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<DeploymentFormData>({
    name: '',
    host: '',
    port: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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