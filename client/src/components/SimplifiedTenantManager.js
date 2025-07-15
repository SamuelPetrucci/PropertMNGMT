import React, { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  CardActions,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment
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
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon
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

export default function SimplifiedTenantManager() {
  console.log('SimplifiedTenantManager: Component mounted');
  
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Unified tenant creation dialog
  const [createTenantDialog, setCreateTenantDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [tenantForm, setTenantForm] = useState({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Step 2: Property Assignment
    propertyId: '',
    unitId: '',
    rentAmount: '',
    securityDeposit: '',
    
    // Step 3: Lease Details
    leaseStartDate: '',
    leaseEndDate: '',
    leaseFile: null,
    
    // Step 4: Account Setup
    createAccount: true,
    sendInvitation: false
  });

  // Quick actions dialog
  const [quickActionsDialog, setQuickActionsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Remove tenant dialog
  const [removeTenantDialog, setRemoveTenantDialog] = useState(false);
  const [removingTenant, setRemovingTenant] = useState(false);

  // Lease renewal dialog
  const [renewalDialog, setRenewalDialog] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    newEndDate: '',
    rentAdjustment: '',
    leaseFile: null
  });

  const steps = [
    'Basic Information',
    'Property Assignment', 
    'Lease Details',
    'Account Setup'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('SimplifiedTenantManager: fetchData called');
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      console.log('SimplifiedTenantManager: fetching data from', apiBaseUrl);
      
      const [tenantsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/properties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('SimplifiedTenantManager: API responses:', { 
        tenantsStatus: tenantsRes.status, 
        propertiesStatus: propertiesRes.status 
      });

      if (tenantsRes.ok && propertiesRes.ok) {
        const tenantsData = await tenantsRes.json();
        const propertiesData = await propertiesRes.json();
        console.log('SimplifiedTenantManager: data received:', { 
          tenants: tenantsData.length, 
          properties: propertiesData.length 
        });
        setTenants(tenantsData);
        setProperties(propertiesData);
      } else {
        console.error('SimplifiedTenantManager: API error:', { 
          tenantsStatus: tenantsRes.status, 
          propertiesStatus: propertiesRes.status 
        });
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('SimplifiedTenantManager: fetch error:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
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
          alert(`Tenant created successfully!\nUsername: ${result.credentials.username}\nPassword: ${result.credentials.password}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create tenant');
      }
    } catch (err) {
      setError('Failed to create tenant');
    }
  };

  const handleRenewLease = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const formData = new FormData();
      formData.append('newEndDate', renewalForm.newEndDate);
      formData.append('rentAdjustment', renewalForm.rentAdjustment);
      if (renewalForm.leaseFile) {
        formData.append('leaseFile', renewalForm.leaseFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}/renew-lease`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setRenewalDialog(false);
        setRenewalForm({
          newEndDate: '',
          rentAdjustment: '',
          leaseFile: null
        });
        fetchData();
      }
    } catch (err) {
      setError('Failed to renew lease');
    }
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

  console.log('SimplifiedTenantManager render:', { loading, error, tenants: tenants.length, properties: properties.length });
  
  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <PeopleIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Tenant Management
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Simplified tenant and lease management
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setCreateTenantDialog(true)}
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              Add New Tenant
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              sx={{ bgcolor: 'white', color: '#1976d2', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Quick Stats */}
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
                  <CheckCircleIcon />
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
                  <WarningIcon />
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
                  <ScheduleIcon />
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

      {/* Tenant List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5">All Tenants</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<FilterIcon />}
              variant="outlined"
              size="small"
            >
              Filter
            </Button>
            <Button
              startIcon={<SearchIcon />}
              variant="outlined"
              size="small"
            >
              Search
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {tenants.map((tenant) => (
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
                    {tenant.tenantUnits?.map((assignment, index) => (
                      <Box key={index}>
                        <Typography variant="body2" color="text.secondary">
                          <HomeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          {assignment.property?.name}
                          {assignment.unit && ` - Unit ${assignment.unit.unitNumber}`}
                        </Typography>
                        <Typography variant="body2">
                          <MoneyIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          ${assignment.rent}/month
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<MessageIcon />}
                      variant="outlined"
                    >
                      Message
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Unified Tenant Creation Dialog */}
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
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        label="First Name"
                        value={tenantForm.firstName}
                        onChange={(e) => setTenantForm({...tenantForm, firstName: e.target.value})}
                        fullWidth
                      />
                      <TextField
                        label="Last Name"
                        value={tenantForm.lastName}
                        onChange={(e) => setTenantForm({...tenantForm, lastName: e.target.value})}
                        fullWidth
                      />
                      <TextField
                        label="Email"
                        type="email"
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                        fullWidth
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
                            const defaultRent = selectedProperty?.type === 'single-family' 
                              ? selectedProperty.rent 
                              : '';
                            setTenantForm({
                              ...tenantForm, 
                              propertyId: e.target.value,
                              rentAmount: defaultRent || '',
                              unitId: '' // Reset unit when property changes
                            });
                          }}
                        >
                          {properties.map((property) => (
                            <MenuItem key={property.id} value={property.id}>
                              {property.name} ({property.type === 'single-family' ? 'Single Family' : 'Multi Family'})
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
                              setTenantForm({
                                ...tenantForm, 
                                unitId: e.target.value,
                                rentAmount: selectedUnit?.rent || ''
                              });
                            }}
                          >
                            {properties
                              .find(p => p.id === tenantForm.propertyId)
                              ?.units?.map((unit) => (
                                <MenuItem key={unit.id} value={unit.id}>
                                  Unit {unit.unitNumber} - ${unit.rent}/month
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
                        }}
                        fullWidth
                        required
                        helperText={
                          tenantForm.propertyId 
                            ? `Auto-populated from ${properties.find(p => p.id === tenantForm.propertyId)?.type === 'single-family' ? 'property' : 'unit'} selection` 
                            : "Select a property first"
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
                        label="Lease Start Date"
                        type="date"
                        value={tenantForm.leaseStartDate}
                        onChange={(e) => setTenantForm({...tenantForm, leaseStartDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      
                      <TextField
                        label="Lease End Date"
                        type="date"
                        value={tenantForm.leaseEndDate}
                        onChange={(e) => setTenantForm({...tenantForm, leaseEndDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
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
                    >
                      {index === steps.length - 1 ? 'Create Tenant' : 'Continue'}
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
      </Dialog>

      {/* Lease Renewal Dialog */}
      <Dialog
        open={renewalDialog}
        onClose={() => setRenewalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Renew Lease</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="New End Date"
              type="date"
              value={renewalForm.newEndDate}
              onChange={(e) => setRenewalForm({...renewalForm, newEndDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <TextField
              label="Rent Adjustment"
              type="number"
              value={renewalForm.rentAdjustment}
              onChange={(e) => setRenewalForm({...renewalForm, rentAdjustment: e.target.value})}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              fullWidth
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
                onChange={(e) => setRenewalForm({...renewalForm, leaseFile: e.target.files[0]})}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewalDialog(false)}>Cancel</Button>
          <Button onClick={handleRenewLease} variant="contained">
            Renew Lease
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 