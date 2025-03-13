import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTh,
  faSitemap,
  faChartLine,
  faRocket,
  faCog,
  faQuestionCircle,
  faBell,
  faChevronRight,
  faTrash,
  faPencilAlt,
  faSignOutAlt,
  faUser,
  faProjectDiagram
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import styles from './Homepage.module.css';
import cardStyles from './DeploymentCard.module.css';
import AddDeploymentModal from './AddDeploymentModal';
import EditDeploymentModal from './EditDeploymentModal';
import ApiModeToggle from './ApiModeToggle';
import { useNavigate } from 'react-router-dom';

interface Deployment {
  id?: number;
  name: string;
  host: string;
  port: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  owner_username?: string;
}

const Homepage: React.FC = () => {
  const [userName, setUserName] = useState('Guest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user info from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Check if token has JWT format (contains two dots)
        if (token.split('.').length === 3) {
          // Decode token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const decoded = JSON.parse(jsonPayload);
          if (decoded.user && decoded.user.username) {
            setUserName(decoded.user.username);
          }
        } else {
          // If token doesn't have JWT format, just use default name
          console.log('Token is not in JWT format, using default user name');
        }
      } catch (error) {
        console.error('Error parsing user token:', error);
      }
    }

    // Fetch deployments
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const deployments = await api.deployments.getAll();
      setDeployments(deployments);
    } catch (error: any) {
      console.error('Error fetching deployments:', error);
      // For development purposes only - in production, you might want to show a more user-friendly message
      const errorMessage = error.message || 'Error fetching deployments';
      
      // Use a more subtle notification instead of an alert in production
      alert(`Failed to load deployments. ${errorMessage}`);
      
      // Display an empty array to prevent showing stale data
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeployment = async (deployment: Deployment) => {
    try {
      const newDeployment = await api.deployments.create(deployment);
      setDeployments([...deployments, newDeployment]);
    } catch (error: any) {
      console.error('Error adding deployment:', error);
      alert('Failed to add deployment. Please try again.');
    }
  };

  const handleEditClick = (deployment: Deployment) => {
    setCurrentDeployment(deployment);
    setIsEditModalOpen(true);
  };

  const handleUpdateDeployment = async (updatedDeployment: Deployment) => {
    try {
      if (!updatedDeployment.id) return;
      
      const response = await api.deployments.update(updatedDeployment.id, {
        name: updatedDeployment.name,
        host: updatedDeployment.host,
        port: updatedDeployment.port
      });
      
      // Update the deployments state
      setDeployments(deployments.map(d => d.id === updatedDeployment.id ? response : d));
    } catch (error: any) {
      console.error('Error updating deployment:', error);
      alert('Failed to update deployment. Please try again.');
    }
  };

  const handleDeleteDeployment = async (id?: number) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this deployment?')) {
      try {
        await api.deployments.delete(id);
        setDeployments(deployments.filter(deployment => deployment.id !== id));
      } catch (error: any) {
        console.error('Error deleting deployment:', error);
        alert('Failed to delete deployment. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Logo Section */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>X</span>
          <span className={styles.logoText}>XEdge</span>
        </div>

        {/* Navigation Menu */}
        <ul className={styles.navMenu}>
          <li className={`${styles.navItem} ${styles.active}`}>
            <FontAwesomeIcon icon={faTh} />
            <span>Deployments</span>
          </li>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faSitemap} />
            <span>Dashboard</span>
          </li>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faChartLine} />
            <span>Settings</span>
          </li>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faRocket} />
            <span>Test</span>
          </li>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faCog} />
            <span>Test</span>
          </li>
        </ul>

        {/* Developer Mode Toggle (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.devModeSection}>
            <div className={styles.devModeTitle}>Developer Mode</div>
            <ApiModeToggle />
          </div>
        )}

        {/* Additional Sections */}
        <ul className={styles.additionalSections}>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faQuestionCircle} />
            <span>Help & Docs</span>
            <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} />
          </li>
          <li className={styles.navItem}>
            <FontAwesomeIcon icon={faBell} />
            <span>Notifications</span>
          </li>
        </ul>

        {/* User Section */}
        <div 
          className={styles.userSection}
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
        >
          <FontAwesomeIcon icon={faUser} className={styles.userIcon} />
          <span className={styles.userName}>{userName}</span>
          <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} />
          
          {isUserMenuOpen && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuItem} onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content (Deployments Section) */}
      <div className={styles.mainContent}>
        {loading ? (
          <p>Loading deployments...</p>
        ) : deployments.length === 0 ? (
          <div className={styles.emptyProject}>
            <img
              src="https://via.placeholder.com/200x150"
              alt="Deployment Illustration"
              className={styles.projectIllustration}
            />
            <p className={styles.emptyMessage}>There are no deployments in this workspace.</p>
            <p className={styles.emptySubmessage}>
              Add a deployment and configure your workspace to start data collection.
            </p>
            <div className={styles.buttons}>
              <button className={styles.newProjectBtn} onClick={() => setIsAddModalOpen(true)}>
                + Add Deployment
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.deploymentContainer}>
            <div className={styles.deploymentHeader}>
              <h2>Your Deployments</h2>
              <button className={styles.newProjectBtn} onClick={() => setIsAddModalOpen(true)}>
                + Add Deployment
              </button>
            </div>
            <div className={cardStyles.deploymentGrid}>
              {deployments.map((deployment) => (
                <div key={deployment.id || deployment.name} className={cardStyles.card}>
                  <div className={cardStyles.cardHeader}>
                    <h3 className={cardStyles.title}>{deployment.name}</h3>
                    <div className={cardStyles.status}></div>
                  </div>
                  <div className={cardStyles.info}>
                    <span className={cardStyles.label}>Host</span>
                    <p className={cardStyles.value}>{deployment.host}</p>
                  </div>
                  <div className={cardStyles.info}>
                    <span className={cardStyles.label}>Port</span>
                    <p className={cardStyles.value}>{deployment.port}</p>
                  </div>
                  <div className={cardStyles.cardActions}>
                    <button 
                      className={`${cardStyles.actionButton} ${cardStyles.editButton}`}
                      onClick={() => handleEditClick(deployment)}
                      title="Edit deployment"
                    >
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                    <button 
                      className={`${cardStyles.actionButton} ${cardStyles.workflowButton}`}
                      onClick={() => navigate(`/deployments/${deployment.id}/workflow`)}
                      title="Workflow Canvas"
                    >
                      <FontAwesomeIcon icon={faProjectDiagram} />
                    </button>
                    <button 
                      className={cardStyles.deleteButton}
                      onClick={() => handleDeleteDeployment(deployment.id)}
                      title="Delete deployment"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddDeploymentModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddDeployment}
        />
      )}

      {isEditModalOpen && currentDeployment && (
        <EditDeploymentModal
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateDeployment}
          deployment={currentDeployment}
        />
      )}
    </div>
  );
};

export default Homepage;