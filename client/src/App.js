import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CssBaseline, Box, Toolbar, AppBar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Button, TextField, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import PaymentIcon from '@mui/icons-material/Payment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardHome from './components/DashboardHome';
import PropertyList from './components/properties/PropertyList';
import PropertyDetails from './components/properties/PropertyDetails';
import MarketListings from './components/Market/MarketListings';
import Avatar from '@mui/material/Avatar';
import RentTracking from './components/RentTracking';
import TenantPortal from './components/TenantPortal';
import ContractorPortal from './components/ContractorPortal';
import ProjectManagement from './components/ProjectManagement';
import ProjectDetails from './components/ProjectDetails';
import MaintenanceRequests from './components/MaintenanceRequests';
import SimpleMaintenanceRequests from './components/SimpleMaintenanceRequests';
import SimplifiedTenantManager from './components/SimplifiedTenantManager';
import ModernTenantDashboard from './components/ModernTenantDashboard';
import FinancialDashboard from './components/FinancialDashboard';
import Login from './components/Auth/Login';
import ProjectJobsDashboard from './components/ProjectJobsDashboard';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Menu, MenuItem as MuiMenuItem } from '@mui/material';

const drawerWidth = 220;

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    // For IP access, use the same hostname but port 5000
    return `http://${hostname}:5000`;
  }
};

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Financial Dashboard', icon: <AssessmentIcon />, path: '/financial-dashboard' },
  { text: 'Properties', icon: <HomeWorkIcon />, path: '/properties' },
  { text: 'Tenant Management', icon: <PeopleIcon />, path: '/tenants' },
  { text: 'Project Management', icon: <AssignmentIcon />, path: '/project-management', dropdown: [
    { text: 'Project Management', path: '/project-management' },
    { text: 'Project Dashboard', path: '/project-management/dashboard' },
  ] },
  { text: 'Market Listings', icon: <OpenInNewIcon />, path: '/market-listings' },
  { text: 'Rent Tracking', icon: <AttachMoneyIcon />, path: '/rent-tracking' },
  { text: 'Maintenance', icon: <BuildIcon />, path: '/maintenance' },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
  { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
];

// Removed old lease upload route - now integrated into tenant management

function Tenants() {
  return <ModernTenantDashboard />;
}

function Maintenance() {
  return <MaintenanceRequests />;
}

function Payments() {
  return <Typography variant="h4">Payments</Typography>;
}

function Profile({ user, onSignOut }) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      <Typography variant="body1">Username: <b>{user?.username}</b></Typography>
      <Typography variant="body1">Role: <b>{user?.role}</b></Typography>
      {user?.firstName && (
        <Typography variant="body1">Name: <b>{user.firstName} {user.lastName}</b></Typography>
      )}
      {user?.email && (
        <Typography variant="body1">Email: <b>{user.email}</b></Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        (This is a demo account. Credentials are not changeable in this demo.)
      </Typography>
      <Button variant="outlined" color="error" sx={{ mt: 4 }} onClick={onSignOut}>Sign Out</Button>
    </Box>
  );
}

// Role-based content component
function RoleBasedContent({ user, onSignOut }) {
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const location = useLocation();

  // Dropdown state for nav
  const [dropdownAnchorEl, setDropdownAnchorEl] = React.useState(null);
  const [dropdownMenuKey, setDropdownMenuKey] = React.useState(null);
  const handleDropdownOpen = (event, key) => {
    setDropdownAnchorEl(event.currentTarget);
    setDropdownMenuKey(key);
  };
  const handleDropdownClose = () => {
    setDropdownAnchorEl(null);
    setDropdownMenuKey(null);
  };

  const fetchProperties = React.useCallback(() => {
    if (user?.role !== 'LANDLORD') return; // Only landlords need properties data
    
    console.log('Fetching properties for role:', user.role);
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    fetch(`${getApiBaseUrl()}/api/properties`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Properties data received:', data);
        setProperties(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching properties:', error);
        setError('Could not fetch properties');
        setLoading(false);
      });
  }, [user]);

  React.useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Render different content based on user role
  if (user?.role === 'TENANT') {
    return <TenantPortal />;
  }

  if (user?.role === 'CONTRACTOR') {
    return <ContractorPortal />;
  }

  // Landlord dashboard (existing functionality)
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'white' }}>
            Property Management System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={onSignOut} sx={{ color: 'white' }}>Sign Out</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {navItems.map((item) => {
              if (item.dropdown) {
                return (
                  <React.Fragment key={item.text}>
                    <ListItem
                      button
                      onClick={(e) => handleDropdownOpen(e, item.text)}
                      sx={{ '&:hover': { backgroundColor: '#e3f2fd' } }}
                    >
                      <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} sx={{ color: '#333', '& .MuiTypography-root': { fontWeight: 500 } }} />
                      <ArrowDropDownIcon />
                    </ListItem>
                    <Menu
                      anchorEl={dropdownAnchorEl}
                      open={dropdownMenuKey === item.text}
                      onClose={handleDropdownClose}
                    >
                      {item.dropdown.map((sub) => (
                        <MuiMenuItem
                          key={sub.text}
                          component={Link}
                          to={sub.path}
                          onClick={handleDropdownClose}
                        >
                          {sub.text}
                        </MuiMenuItem>
                      ))}
                    </Menu>
                  </React.Fragment>
                );
              } else {
                return (
                  <ListItem
                    button
                    key={item.text}
                    component={Link}
                    to={item.path}
                    sx={{ '&:hover': { backgroundColor: '#e3f2fd' }, '&.active': { backgroundColor: '#bbdefb' } }}
                  >
                    <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} sx={{ color: '#333', '& .MuiTypography-root': { fontWeight: 500 } }} />
                  </ListItem>
                );
              }
            })}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Toolbar />
        <Routes>
          <Route path="/" element={<DashboardHome properties={properties} loading={loading} error={error} />} />
          <Route path="/financial-dashboard" element={<FinancialDashboard />} />
          <Route path="/properties" element={<PropertyList properties={properties} loading={loading} error={error} />} />
          <Route path="/properties/:id" element={<PropertyDetails properties={properties} />} />
          <Route path="/project-management" element={<ProjectManagement />} />
          <Route path="/project-management/dashboard" element={<ProjectJobsDashboard />} />
          <Route path="/project-management/:id" element={<ProjectDetails />} />
          <Route path="/market-listings" element={<MarketListings />} />
          <Route path="/tenants" element={<Tenants />} />

          <Route path="/rent-tracking" element={<RentTracking />} />
          <Route path="/maintenance" element={<SimpleMaintenanceRequests />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/profile" element={<Profile user={user} onSignOut={onSignOut} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Login onLogin={handleLogin} />
      </Router>
    );
  }

  return (
    <Router>
      <RoleBasedContent user={user} onSignOut={handleSignOut} />
    </Router>
  );
} 