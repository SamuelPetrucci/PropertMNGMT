import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tabs,
  Tab,
  Badge,
  CardActions,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Menu,
  MenuItem as MenuItemMui,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ContactPhone as ContactPhoneIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    return `http://${hostname}:5000`;
  }
};

export default function ModernTenantDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick actions
  const [quickActionDialog, setQuickActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [removingTenant, setRemovingTenant] = useState(false);
  
  // Edit tenant form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    leaseStartDate: '',
    leaseEndDate: '',
    rentAmount: '',
    propertyId: '',
    unitId: ''
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Tenant creation form
  const [createTenantDialog, setCreateTenantDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    unitId: '',
    rentAmount: '',
    securityDeposit: '',
    leaseStartDate: '',
    leaseEndDate: '',
    leaseFile: null,
    createAccount: true,
    sendInvitation: false
  });

  const steps = [
    'Basic Information',
    'Property Assignment', 
    'Lease Details',
    'Account Setup'
  ];

  useEffect(() => {
    fetchData();
    generateNotifications();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const [tenantsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/properties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tenantsRes.ok && propertiesRes.ok) {
        const tenantsData = await tenantsRes.json();
        const propertiesData = await propertiesRes.json();
        setTenants(tenantsData);
        setProperties(propertiesData);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = () => {
    const currentDate = new Date();
    const newNotifications = [];

    tenants.forEach(tenant => {
      // Check for expiring leases
      tenant.leaseAgreements?.forEach(lease => {
        const endDate = new Date(lease.leaseEndDate);
        const daysUntilExpiry = (endDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          newNotifications.push({
            id: `lease-${lease.id}`,
            type: 'warning',
            title: 'Lease Expiring Soon',
            message: `${tenant.firstName} ${tenant.lastName}'s lease expires in ${Math.ceil(daysUntilExpiry)} days`,
            tenant: tenant
          });
        }
      });

      // Check for overdue payments
      tenant.payments?.forEach(payment => {
        const dueDate = new Date(payment.dueDate);
        if (dueDate < currentDate && payment.status !== 'PAID') {
          newNotifications.push({
            id: `payment-${payment.id}`,
            type: 'error',
            title: 'Overdue Payment',
            message: `${tenant.firstName} ${tenant.lastName} has an overdue payment of $${payment.amount}`,
            tenant: tenant
          });
        }
      });
    });

    setNotifications(newNotifications);
  };

  const getTenantStatus = (tenant) => {
    const currentDate = new Date();
    const hasOverduePayments = tenant.payments?.some(payment => 
      new Date(payment.dueDate) < currentDate && payment.status !== 'PAID'
    );
    return hasOverduePayments ? 'PAST_DUE' : 'CURRENT';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CURRENT': return 'success';
      case 'PAST_DUE': return 'error';
      case 'ACTIVE': return 'primary';
      case 'EXPIRED': return 'warning';
      default: return 'default';
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = `${tenant.firstName} ${tenant.lastName} ${tenant.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'current' && getTenantStatus(tenant) === 'CURRENT') ||
      (filter === 'past_due' && getTenantStatus(tenant) === 'PAST_DUE') ||
      (filter === 'expiring' && tenant.leaseAgreements?.some(lease => {
        const endDate = new Date(lease.leaseEndDate);
        const daysUntilExpiry = (endDate - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }));

    return matchesSearch && matchesFilter;
  });

  const handleQuickAction = (action, tenant) => {
    setSelectedAction(action);
    setSelectedTenant(tenant);
    
    if (action === 'edit') {
      // Populate edit form with tenant data
      const assignment = tenant.assignments?.[0]; // Get first assignment
      setEditForm({
        firstName: tenant.firstName || '',
        lastName: tenant.lastName || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        leaseStartDate: assignment?.leaseStart || '',
        leaseEndDate: assignment?.leaseEnd || '',
        rentAmount: assignment?.rent?.toString() || '',
        propertyId: assignment?.propertyId?.toString() || '',
        unitId: assignment?.unitId?.toString() || ''
      });
    }
    
    // Reset tab to Overview when viewing tenant details
    if (action === 'view') {
      setSelectedTab(0);
    }
    
    setQuickActionDialog(true);
  };

  const handleRemoveTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      setRemovingTenant(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuickActionDialog(false);
        setSelectedTenant(null);
        setSelectedAction(null);
        fetchData(); // Refresh the tenant list
        alert('Tenant removed successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove tenant');
      }
    } catch (err) {
      setError('Failed to remove tenant');
    } finally {
      setRemovingTenant(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTenant) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      // First update basic tenant information
      const updateResponse = await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update tenant information');
      }
      
      // Then update lease dates if they changed
      if (editForm.leaseStartDate && editForm.leaseEndDate && editForm.propertyId) {
        const leaseResponse = await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}/lease-dates`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            propertyId: editForm.propertyId,
            unitId: editForm.unitId || null,
            leaseStartDate: editForm.leaseStartDate,
            leaseEndDate: editForm.leaseEndDate,
            rentAmount: editForm.rentAmount
          })
        });
        
        if (!leaseResponse.ok) {
          throw new Error('Failed to update lease dates');
        }
      }
      
      setQuickActionDialog(false);
      setSelectedTenant(null);
      setSelectedAction(null);
      fetchData();
      alert('Tenant updated successfully!');
    } catch (error) {
      setError(error.message || 'Failed to update tenant');
    }
  };

  // Form handling functions
  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      if (!tenantForm.firstName || !tenantForm.lastName || !tenantForm.email) {
        setError('Please fill in all required fields: First Name, Last Name, and Email');
        return;
      }
    } else if (activeStep === 1) {
      if (!tenantForm.propertyId || !tenantForm.rentAmount) {
        setError('Please select a property and enter rent amount');
        return;
      }
    } else if (activeStep === 2) {
      if (!tenantForm.leaseStartDate || !tenantForm.leaseEndDate) {
        setError('Please enter both lease start and end dates');
        return;
      }
    }
    
    setError(null); // Clear any previous errors
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTenantForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      propertyId: '',
      unitId: '',
      rentAmount: '',
      securityDeposit: '',
      leaseStartDate: '',
      leaseEndDate: '',
      leaseFile: null,
      createAccount: true,
      sendInvitation: false
    });
  };

  const handleCreateTenant = async () => {
    try {
      // Final validation before submission
      if (!tenantForm.firstName || !tenantForm.lastName || !tenantForm.email || 
          !tenantForm.propertyId || !tenantForm.rentAmount || 
          !tenantForm.leaseStartDate || !tenantForm.leaseEndDate) {
        setError('Please fill in all required fields before creating the tenant');
        return;
      }

      setCreatingTenant(true);
      setError(null);

      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const formData = new FormData();
      formData.append('firstName', tenantForm.firstName);
      formData.append('lastName', tenantForm.lastName);
      formData.append('email', tenantForm.email);
      formData.append('phone', tenantForm.phone);
      formData.append('propertyId', tenantForm.propertyId);
      formData.append('unitId', tenantForm.unitId);
      formData.append('rentAmount', tenantForm.rentAmount);
      formData.append('securityDeposit', tenantForm.securityDeposit);
      formData.append('leaseStartDate', tenantForm.leaseStartDate);
      formData.append('leaseEndDate', tenantForm.leaseEndDate);
      if (tenantForm.leaseFile) {
        formData.append('leaseFile', tenantForm.leaseFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/tenants/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setCreateTenantDialog(false);
        handleReset();
        fetchData();
        
        // Show success message with credentials if account was created
        if (result.credentials) {
          alert(`Tenant created successfully!\n\nLogin Credentials:\nUsername: ${result.credentials.username}\nPassword: ${result.credentials.password}\n\nPlease save these credentials and share them with the tenant.`);
        } else {
          alert('Tenant created successfully!');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create tenant');
      }
    } catch (err) {
      setError('Failed to create tenant');
    } finally {
      setCreatingTenant(false);
    }
  };



  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Stats */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <DashboardIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Tenant Dashboard
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Manage your properties and tenants efficiently
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Badge badgeContent={notifications.length} color="error">
                <IconButton sx={{ color: 'white' }}>
                  <NotificationsIcon />
                </IconButton>
              </Badge>
              <IconButton sx={{ color: 'white' }}>
                <SettingsIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{tenants.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Tenants</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {tenants.filter(t => getTenantStatus(t) === 'CURRENT').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Current</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <TrendingDownIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {tenants.filter(t => getTenantStatus(t) === 'PAST_DUE').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Past Due</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {tenants.filter(t => {
                      const lease = t.leaseAgreements?.[0];
                      if (!lease) return false;
                      const endDate = new Date(lease.leaseEndDate);
                      const now = new Date();
                      const daysUntilExpiry = (endDate - now) / (1000 * 60 * 60 * 24);
                      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Expiring Soon</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Tenants</MenuItem>
                <MenuItem value="current">Current</MenuItem>
                <MenuItem value="past_due">Past Due</MenuItem>
                <MenuItem value="expiring">Expiring Soon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                variant="outlined"
              >
                Refresh
              </Button>
              <Button
                startIcon={<PersonAddIcon />}
                variant="contained"
                onClick={() => setCreateTenantDialog(true)}
              >
                Add Tenant
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Notifications
          </Typography>
          <List>
            {notifications.slice(0, 3).map((notification) => (
              <ListItem key={notification.id}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: notification.type === 'error' ? 'error.main' : 'warning.main' 
                  }}>
                    {notification.type === 'error' ? <WarningIcon /> : <ScheduleIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.title}
                  secondary={notification.message}
                />
                <Button
                  size="small"
                  onClick={() => handleQuickAction('view', notification.tenant)}
                >
                  View
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Tenant Grid */}
      <Grid container spacing={2}>
        {filteredTenants.map((tenant) => (
          <Grid item xs={12} md={6} lg={4} key={tenant.id}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {tenant.firstName?.[0]}{tenant.lastName?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {tenant.firstName} {tenant.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tenant.email}
                    </Typography>
                  </Box>
                  <Chip
                    label={getTenantStatus(tenant)}
                    color={getStatusColor(getTenantStatus(tenant))}
                    size="small"
                  />
                </Stack>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  {tenant.assignments?.map((assignment, index) => (
                    <Box key={index}>
                      <Typography variant="body2" color="text.secondary">
                        <HomeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        {assignment.propertyName}
                        {assignment.unitNumber && ` - Unit ${assignment.unitNumber}`}
                      </Typography>
                      <Typography variant="body2">
                        <MoneyIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        ${assignment.rent}/month
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleQuickAction('view', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<MessageIcon />}
                    variant="outlined"
                    onClick={() => handleQuickAction('message', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Message
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PaymentIcon />}
                    variant="outlined"
                    onClick={() => handleQuickAction('payment', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Payment
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    variant="outlined"
                    onClick={() => handleQuickAction('edit', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CalendarIcon />}
                    variant="outlined"
                    onClick={() => handleQuickAction('renew', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Renew
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    variant="outlined"
                    color="error"
                    onClick={() => handleQuickAction('remove', tenant)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Remove
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* Quick Action Dialog */}
      <Dialog
        open={quickActionDialog}
        onClose={() => setQuickActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedAction === 'message' && `Send Message to ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
          {selectedAction === 'payment' && `Record Payment for ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
          {selectedAction === 'edit' && `Edit ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
          {selectedAction === 'renew' && `Renew Lease for ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
          {selectedAction === 'upload' && `Upload Document for ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
          {selectedAction === 'view' && `${selectedTenant?.firstName} ${selectedTenant?.lastName} - Details`}
          {selectedAction === 'remove' && `Remove ${selectedTenant?.firstName} ${selectedTenant?.lastName}`}
        </DialogTitle>
        <DialogContent>
          {selectedAction === 'message' && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Subject"
                fullWidth
                placeholder="Enter message subject"
              />
              <TextField
                label="Message"
                multiline
                rows={4}
                fullWidth
                placeholder="Enter your message"
              />
            </Stack>
          )}
          
          {selectedAction === 'payment' && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="online">Online Payment</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
          
          {selectedAction === 'view' && selectedTenant && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Lease History" />
                <Tab label="Documents" />
                <Tab label="Payments" />
                <Tab label="Maintenance" />
              </Tabs>

              {selectedTab === 0 && (
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {selectedTenant.firstName} {selectedTenant.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">
                          {selectedTenant.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1">
                          {selectedTenant.phone || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={getTenantStatus(selectedTenant)}
                          color={getStatusColor(getTenantStatus(selectedTenant))}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Current Property Assignment */}
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Current Property Assignment
                    </Typography>
                    {selectedTenant.assignments?.map((assignment, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Property</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {assignment.propertyName}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Unit</Typography>
                            <Typography variant="body1">
                              {assignment.unitNumber ? `Unit ${assignment.unitNumber}` : 'Single Family'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Rent Amount</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                              ${assignment.rent}/month
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Assignment Date</Typography>
                            <Typography variant="body1">
                              {new Date(assignment.createdAt).toLocaleDateString()}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Paper>

                  {/* Quick Stats */}
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Quick Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary.main">
                            {selectedTenant.leaseAgreements?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Leases
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="success.main">
                            {selectedTenant.payments?.filter(p => p.status === 'PAID').length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Paid Payments
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="warning.main">
                            {selectedTenant.payments?.filter(p => p.status !== 'PAID').length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Outstanding
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Stack>
              )}

              {selectedTab === 1 && (
                <Stack spacing={2}>
                  <Typography variant="h6" gutterBottom>
                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Lease History
                  </Typography>
                  {selectedTenant.leaseAgreements && selectedTenant.leaseAgreements.length > 0 ? (
                    selectedTenant.leaseAgreements.map((lease, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Lease Period</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {new Date(lease.leaseStartDate).toLocaleDateString()} - {new Date(lease.leaseEndDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Rent Amount</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                              ${lease.rentAmount}/month
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                            <Chip
                              label={new Date(lease.leaseEndDate) > new Date() ? 'Active' : 'Expired'}
                              color={new Date(lease.leaseEndDate) > new Date() ? 'success' : 'warning'}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
                            <Typography variant="body1">
                              {Math.max(0, Math.ceil((new Date(lease.leaseEndDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                            </Typography>
                          </Grid>
                          {lease.signedLease && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Signed Lease</Typography>
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Lease Signed"
                                color="success"
                                size="small"
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      No lease agreements found for this tenant.
                    </Alert>
                  )}
                </Stack>
              )}

              {selectedTab === 2 && (
                <Stack spacing={2}>
                  <Typography variant="h6" gutterBottom>
                    <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Documents
                  </Typography>
                  {selectedTenant.documents && selectedTenant.documents.length > 0 ? (
                    selectedTenant.documents.map((doc, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {doc.documentType || 'Document'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} textAlign="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            >
                              Download
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      No documents uploaded for this tenant.
                    </Alert>
                  )}
                </Stack>
              )}

              {selectedTab === 3 && (
                <Stack spacing={2}>
                  <Typography variant="h6" gutterBottom>
                    <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Payment History
                  </Typography>
                  {selectedTenant.payments && selectedTenant.payments.length > 0 ? (
                    selectedTenant.payments.map((payment, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              ${payment.amount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Chip
                              label={payment.status}
                              color={payment.status === 'PAID' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={3} textAlign="right">
                            {payment.paidDate && (
                              <Typography variant="body2" color="text.secondary">
                                Paid: {new Date(payment.paidDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      No payment history found for this tenant.
                    </Alert>
                  )}
                </Stack>
              )}

              {selectedTab === 4 && (
                <Stack spacing={2}>
                  <Typography variant="h6" gutterBottom>
                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Maintenance Requests
                  </Typography>
                  {selectedTenant.maintenanceRequests && selectedTenant.maintenanceRequests.length > 0 ? (
                    selectedTenant.maintenanceRequests.map((request, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {request.title || 'Maintenance Request'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Submitted: {new Date(request.createdAt).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} textAlign="right">
                            <Chip
                              label={request.status || 'Pending'}
                              color={
                                request.status === 'COMPLETED' ? 'success' : 
                                request.status === 'IN_PROGRESS' ? 'warning' : 'default'
                              }
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      No maintenance requests found for this tenant.
                    </Alert>
                  )}
                </Stack>
              )}
            </Box>
          )}
          
          {selectedAction === 'edit' && selectedTenant && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="First Name"
                value={editForm.firstName}
                onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                fullWidth
              />
              <TextField
                label="Phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                fullWidth
              />
              
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Lease Information</Typography>
              
              <TextField
                label="Lease Start Date"
                type="date"
                value={editForm.leaseStartDate}
                onChange={(e) => setEditForm({...editForm, leaseStartDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Lease End Date"
                type="date"
                value={editForm.leaseEndDate}
                onChange={(e) => setEditForm({...editForm, leaseEndDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Rent Amount"
                type="number"
                value={editForm.rentAmount}
                onChange={(e) => setEditForm({...editForm, rentAmount: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />
            </Stack>
          )}
          
          {selectedAction === 'renew' && selectedTenant && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="h6">
                Renew Lease for {selectedTenant.firstName} {selectedTenant.lastName}
              </Typography>
              <TextField
                label="New End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Rent Adjustment"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                placeholder="Enter new rent amount (optional)"
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Upload New Lease Document
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                />
              </Button>
            </Stack>
          )}
          
          {selectedAction === 'remove' && selectedTenant && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Alert severity="warning">
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Are you sure you want to remove this tenant?
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This action will permanently delete the tenant and all associated data including:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Tenant account and profile</li>
                  <li>All lease agreements</li>
                  <li>Payment history</li>
                  <li>Maintenance requests</li>
                  <li>All uploaded documents</li>
                </ul>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  This action cannot be undone.
                </Typography>
              </Alert>
              
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" color="error">
                  {selectedTenant.firstName} {selectedTenant.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTenant.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTenant.phone}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialog(false)}>Cancel</Button>
          {selectedAction === 'remove' ? (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleRemoveTenant}
              disabled={removingTenant}
              startIcon={removingTenant ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {removingTenant ? 'Removing...' : 'Remove Tenant'}
            </Button>
          ) : (
            <Button 
              variant="contained"
              onClick={selectedAction === 'edit' ? handleSaveEdit : undefined}
            >
              {selectedAction === 'message' && 'Send'}
              {selectedAction === 'payment' && 'Record'}
              {selectedAction === 'edit' && 'Save'}
              {selectedAction === 'renew' && 'Renew'}
              {selectedAction === 'upload' && 'Upload'}
              {selectedAction === 'view' && 'Close'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Tenant Creation Dialog */}
      <Dialog
        open={createTenantDialog}
        onClose={() => setCreateTenantDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PersonAddIcon />
            <Typography variant="h6">Add New Tenant</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        label="First Name *"
                        value={tenantForm.firstName}
                        onChange={(e) => setTenantForm({...tenantForm, firstName: e.target.value})}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Last Name *"
                        value={tenantForm.lastName}
                        onChange={(e) => setTenantForm({...tenantForm, lastName: e.target.value})}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Email *"
                        type="email"
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Phone"
                        value={tenantForm.phone}
                        onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                        fullWidth
                      />
                    </Stack>
                  )}
                  
                  {index === 1 && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Property *</InputLabel>
                        <Select
                          value={tenantForm.propertyId}
                          onChange={(e) => {
                            const selectedProperty = properties.find(p => p.id === e.target.value);
                            let defaultRent = '';
                            
                            if (selectedProperty) {
                              if (selectedProperty.type === 'single-family') {
                                // For single family, use property rent
                                defaultRent = selectedProperty.rent || '';
                                console.log(`Auto-populating rent for single family property: $${defaultRent}`);
                              } else if (selectedProperty.type === 'multi-family') {
                                // For multi-family, don't set rent until unit is selected
                                defaultRent = '';
                                console.log('Multi-family property selected - rent will be set when unit is chosen');
                              }
                            }
                            
                            setTenantForm({
                              ...tenantForm, 
                              propertyId: e.target.value,
                              rentAmount: defaultRent,
                              unitId: '' // Reset unit when property changes
                            });
                          }}
                        >
                          {/* Available properties first */}
                          {properties
                            .filter(property => property.isAvailable !== false)
                            .map((property) => (
                              <MenuItem key={property.id} value={property.id}>
                                <Box>
                                  <Typography variant="body1">
                                    {property.name} ({property.type === 'single-family' ? 'Single Family' : 'Multi Family'})
                                  </Typography>
                                  {property.type === 'single-family' && property.rent && (
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                      Rent: ${property.rent}/month
                                    </Typography>
                                  )}
                                  {property.type === 'multi-family' && property.units && property.units.length > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                      {property.units.filter(unit => unit.isAvailable !== false).length} unit{property.units.filter(unit => unit.isAvailable !== false).length > 1 ? 's' : ''} available
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          
                          {/* Divider */}
                          {properties.some(p => p.isAvailable === false) && (
                            <Divider sx={{ my: 1 }} />
                          )}
                          
                          {/* Unavailable properties at the bottom */}
                          {properties
                            .filter(property => property.isAvailable === false)
                            .map((property) => (
                              <MenuItem 
                                key={property.id} 
                                value={property.id}
                                disabled
                                sx={{ opacity: 0.6 }}
                              >
                                <Box>
                                  <Typography variant="body1" sx={{ textDecoration: 'line-through' }}>
                                    {property.name} ({property.type === 'single-family' ? 'Single Family' : 'Multi Family'})
                                  </Typography>
                                  <Typography variant="body2" color="error.main">
                                    Currently occupied by {property.activeTenant || 'Unknown Tenant'}
                                  </Typography>
                                  {property.leaseEndDate && (
                                    <Typography variant="body2" color="text.secondary">
                                      Lease ends: {new Date(property.leaseEndDate).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                      
                      {properties.find(p => p.id === tenantForm.propertyId)?.type === 'multi-family' && (
                        <FormControl fullWidth required>
                          <InputLabel>Unit *</InputLabel>
                          <Select
                            value={tenantForm.unitId}
                            onChange={(e) => {
                              const selectedProperty = properties.find(p => p.id === tenantForm.propertyId);
                              const selectedUnit = selectedProperty?.units?.find(u => u.id === e.target.value);
                              const unitRent = selectedUnit?.rent || '';
                              
                              if (unitRent) {
                                console.log(`Auto-populating rent for unit ${selectedUnit.unitNumber}: $${unitRent}`);
                              }
                              
                              setTenantForm({
                                ...tenantForm, 
                                unitId: e.target.value,
                                rentAmount: unitRent
                              });
                            }}
                          >
                            {/* Available units first */}
                            {properties
                              .find(p => p.id === tenantForm.propertyId)
                              ?.units?.filter(unit => unit.isAvailable !== false)
                              .map((unit) => (
                                <MenuItem key={unit.id} value={unit.id}>
                                  <Box>
                                    <Typography variant="body1">
                                      Unit {unit.unitNumber}
                                    </Typography>
                                    {unit.rent && (
                                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                        Rent: ${unit.rent}/month
                                      </Typography>
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            
                            {/* Divider */}
                            {properties
                              .find(p => p.id === tenantForm.propertyId)
                              ?.units?.some(unit => unit.isAvailable === false) && (
                                <Divider sx={{ my: 1 }} />
                              )}
                            
                            {/* Unavailable units at the bottom */}
                            {properties
                              .find(p => p.id === tenantForm.propertyId)
                              ?.units?.filter(unit => unit.isAvailable === false)
                              .map((unit) => (
                                <MenuItem 
                                  key={unit.id} 
                                  value={unit.id}
                                  disabled
                                  sx={{ opacity: 0.6 }}
                                >
                                  <Box>
                                    <Typography variant="body1" sx={{ textDecoration: 'line-through' }}>
                                      Unit {unit.unitNumber}
                                    </Typography>
                                    <Typography variant="body2" color="error.main">
                                      Currently occupied by {unit.activeTenant || 'Unknown Tenant'}
                                    </Typography>
                                    {unit.leaseEndDate && (
                                      <Typography variant="body2" color="text.secondary">
                                        Lease ends: {new Date(unit.leaseEndDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      )}
                      
                      <TextField
                        label="Rent Amount *"
                        type="number"
                        value={tenantForm.rentAmount}
                        onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          endAdornment: (
                            (tenantForm.propertyId && properties.find(p => p.id === tenantForm.propertyId)?.type === 'SINGLE_FAMILY' && tenantForm.rentAmount) ||
                            (tenantForm.unitId && properties.find(p => p.id === tenantForm.propertyId)?.units?.find(u => u.id === tenantForm.unitId) && tenantForm.rentAmount)
                          ) ? (
                            <InputAdornment position="end">
                              <CheckCircleIcon color="success" fontSize="small" />
                            </InputAdornment>
                          ) : null
                        }}
                        fullWidth
                        required
                        color={
                          (tenantForm.propertyId && properties.find(p => p.id === tenantForm.propertyId)?.type === 'single-family' && tenantForm.rentAmount) ||
                          (tenantForm.unitId && properties.find(p => p.id === tenantForm.propertyId)?.units?.find(u => u.id === tenantForm.unitId) && tenantForm.rentAmount)
                        ? "success" : "primary"
                        }
                        helperText={
                          tenantForm.propertyId && properties.find(p => p.id === tenantForm.propertyId)?.type === 'single-family'
                            ? 'Rent automatically populated from property settings'
                            : tenantForm.unitId && properties.find(p => p.id === tenantForm.propertyId)?.units?.find(u => u.id === tenantForm.unitId)
                            ? 'Rent automatically populated from unit settings'
                            : 'Please select a property and unit (if applicable) to auto-populate rent'
                        }
                      />
                      
                      <TextField
                        label="Security Deposit"
                        type="number"
                        value={tenantForm.securityDeposit}
                        onChange={(e) => setTenantForm({...tenantForm, securityDeposit: e.target.value})}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        fullWidth
                      />
                    </Stack>
                  )}
                  
                  {index === 2 && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        label="Lease Start Date *"
                        type="date"
                        value={tenantForm.leaseStartDate}
                        onChange={(e) => setTenantForm({...tenantForm, leaseStartDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                      />
                      
                      <TextField
                        label="Lease End Date *"
                        type="date"
                        value={tenantForm.leaseEndDate}
                        onChange={(e) => setTenantForm({...tenantForm, leaseEndDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                      />
                      
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                      >
                        Upload Lease Document
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setTenantForm({...tenantForm, leaseFile: e.target.files[0]})}
                        />
                      </Button>
                      {tenantForm.leaseFile && (
                        <Typography variant="body2" color="success.main">
                          ✓ {tenantForm.leaseFile.name}
                        </Typography>
                      )}
                    </Stack>
                  )}
                  
                  {index === 3 && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tenantForm.createAccount}
                            onChange={(e) => setTenantForm({...tenantForm, createAccount: e.target.checked})}
                          />
                        }
                        label="Create tenant account"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tenantForm.sendInvitation}
                            onChange={(e) => setTenantForm({...tenantForm, sendInvitation: e.target.checked})}
                          />
                        }
                        label="Send welcome email"
                      />
                      
                      <Alert severity="info">
                        {tenantForm.createAccount 
                          ? "A tenant account will be created with login credentials sent to their email."
                          : "Tenant will be added to the system without account access."
                        }
                      </Alert>
                    </Stack>
                  )}
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleCreateTenant : handleNext}
                      sx={{ mr: 1 }}
                      disabled={creatingTenant}
                      startIcon={creatingTenant ? <CircularProgress size={20} /> : null}
                    >
                      {creatingTenant ? 'Creating...' : (index === steps.length - 1 ? 'Create Tenant' : 'Continue')}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTenantDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTenant}
            disabled={activeStep < steps.length - 1 || creatingTenant}
            startIcon={creatingTenant ? <CircularProgress size={20} /> : null}
          >
            {creatingTenant ? 'Creating...' : 'Create Tenant'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 