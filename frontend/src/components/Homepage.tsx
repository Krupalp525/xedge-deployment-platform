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
import { deploymentsApi, getApiMode } from '../api';
import styles from './Homepage.module.css';
import cardStyles from './DeploymentCard.module.css';
import AddDeploymentModal from './AddDeploymentModal';
import EditDeploymentModal from './EditDeploymentModal';
import ApiModeToggle from './ApiModeToggle';
import { useNavigate } from 'react-router-dom';
import { Deployment, DeploymentCreate, DeploymentUpdate } from '../types';

const Homepage: React.FC = () => {
  const [userName, setUserName] = useState('Guest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [checkingConnections, setCheckingConnections] = useState<Record<number | string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Extract user info from token if available
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Try to decode JWT to get user info
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const { username } = JSON.parse(jsonPayload);
        setUserName(username || 'User');
      } catch (e) {
        // If token is not in JWT format, use a default name
        // console.log('Token is not in JWT format, using default user name');
        setUserName('User');
      }
    }

    // Fetch deployments
    fetchDeployments();
  }, []);

  useEffect(() => {
    // Fetch deployments on component mount
    fetchDeployments();

    // Add listener for API mode changes
    const handleApiModeChange = () => {
      fetchDeployments();
    };
    window.addEventListener('apiModeChanged', handleApiModeChange);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('apiModeChanged', handleApiModeChange);
    };
  }, []);

  // Set up an interval to periodically check connection status in real API mode
  useEffect(() => {
    let connectionCheckInterval: NodeJS.Timeout | null = null;
    
    if (getApiMode() === 'real' && deployments.length > 0) {
      connectionCheckInterval = setInterval(() => {
        Promise.all(
          deployments.map(async (deployment) => {
            try {
              const connectionResponse = await deploymentsApi.checkConnection(deployment);
              return connectionResponse.data || deployment;
            } catch (error) {
              console.error(`Error checking connection for deployment ${deployment.name}:`, error);
              return {
                ...deployment,
                connectionStatus: 'disconnected' as 'disconnected'
              };
            }
          })
        ).then(updatedDeployments => {
          setDeployments(updatedDeployments);
        });
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, [getApiMode(), deployments]);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await deploymentsApi.getAll();
      
      // Check if the response has the expected structure
      if (response && response.data && Array.isArray(response.data)) {
        const deploymentsList = response.data;
        
        // First set the deployments without connection status to render quickly
        setDeployments(deploymentsList);
        setLoading(false);
        
        // If real API mode is enabled, check the connection status for each deployment asynchronously
        if (getApiMode() === 'real') {
          // Create a tracking object for which deployments we're checking
          const checking: Record<number | string, boolean> = {};
          deploymentsList.forEach(d => {
            checking[d.id || ''] = true;
          });
          setCheckingConnections(checking);
          
          // Check connections in parallel but handle updates individually
          deploymentsList.forEach(async (deployment) => {
            try {
              const connectionResponse = await deploymentsApi.checkConnection(deployment);
              if (connectionResponse.data) {
                // Update just this one deployment in the state
                setDeployments(currentDeployments => {
                  return currentDeployments.map(d => {
                    // Make sure we're returning a valid Deployment
                    return d.id === deployment.id && connectionResponse.data 
                      ? connectionResponse.data 
                      : d;
                  });
                });
              }
            } catch (error) {
              console.error(`Error checking connection for deployment ${deployment.name}:`, error);
            } finally {
              // Mark this deployment as done checking
              setCheckingConnections(current => ({
                ...current,
                [deployment.id || '']: false
              }));
            }
          });
        }
      } else if (Array.isArray(response)) {
        // For backward compatibility, handle direct array response
        setDeployments(response);
        setLoading(false);
      } else {
        // Fallback for unexpected response format
        console.error('Unexpected deployments response format:', response);
        setDeployments([]);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching deployments:', error);
      // For development purposes only - in production, you might want to show a more user-friendly message
      const errorMessage = error.message || 'Error fetching deployments';
      
      // Use a more subtle notification instead of an alert in production
      alert(`Failed to load deployments. ${errorMessage}`);
      
      // Display an empty array to prevent showing stale data
      setDeployments([]);
      setLoading(false);
    }
  };

  const handleAddDeployment = async (deployment: DeploymentCreate) => {
    try {
      const response = await deploymentsApi.create(deployment);
      if (response.success && response.data) {
        setDeployments([...deployments, response.data]);
      } else {
        console.error('Unexpected response format during deployment creation:', response);
        alert('Failed to add deployment. Unexpected response format.');
      }
    } catch (error: any) {
      console.error('Error adding deployment:', error);
      alert('Failed to add deployment. Please try again.');
    }
  };

  const handleEditClick = (deployment: Deployment) => {
    setCurrentDeployment(deployment);
    setIsEditModalOpen(true);
  };

  const handleUpdateDeployment = async (updatedDeployment: DeploymentUpdate) => {
    try {
      if (!updatedDeployment.id) return;
      
      const response = await deploymentsApi.update(updatedDeployment.id, updatedDeployment);
      
      // Update the deployments state
      if (response.success && response.data) {
        setDeployments(deployments.map(d => d.id === updatedDeployment.id ? response.data : d).filter((d): d is Deployment => d !== undefined));
      } else {
        console.error('Unexpected response format during deployment update:', response);
        alert('Failed to update deployment. Unexpected response format.');
      }
    } catch (error: any) {
      console.error('Error updating deployment:', error);
      alert('Failed to update deployment. Please try again.');
    }
  };

  const handleDeleteDeployment = async (id?: number) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this deployment?')) {
      try {
        const response = await deploymentsApi.delete(id);
        if (response.success) {
          setDeployments(deployments.filter(deployment => deployment.id !== id));
        } else {
          console.error('Unexpected response format during deployment deletion:', response);
          alert('Failed to delete deployment. Unexpected response format.');
        }
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

  // Function to get the appropriate status style based on connection status
  const getStatusStyle = (deployment: Deployment) => {
    const deploymentId = deployment.id || '';
    const isChecking = checkingConnections[deploymentId];
    
    if (getApiMode() === 'real') {
      // If we're checking the connection, show a loading state
      if (isChecking) {
        return cardStyles.statusChecking;
      }
      
      // Otherwise, show the actual connection status
      return deployment.connectionStatus === 'connected'
        ? cardStyles.statusConnected
        : deployment.connectionStatus === 'disconnected'
          ? cardStyles.statusDisconnected
          : cardStyles.statusUnknown;
    } else {
      // In mock mode, always show the status as connected
      return cardStyles.statusConnected;
    }
  };

  // Function to get status tooltip text
  const getStatusTooltip = (deployment: Deployment) => {
    const deploymentId = deployment.id || '';
    const isChecking = checkingConnections[deploymentId];
    
    if (getApiMode() === 'real') {
      if (isChecking) {
        return `Checking connection to Fledge server at ${deployment.host}:${deployment.port}...`;
      }
      
      return deployment.connectionStatus === 'connected'
        ? `Connected to Fledge server at ${deployment.host}:${deployment.port}`
        : deployment.connectionStatus === 'disconnected'
          ? `Cannot connect to Fledge server at ${deployment.host}:${deployment.port}. Possible issues: 
          1. Server not running 
          2. Incorrect host/port 
          3. CORS policy blocking request
          4. Different endpoint format`
          : `Connection status unknown for ${deployment.host}:${deployment.port}`;
    } else {
      return 'Connection status not checked in mock mode';
    }
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
                    <div 
                      className={`${cardStyles.status} ${getStatusStyle(deployment)}`}
                      title={getStatusTooltip(deployment)}
                    ></div>
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