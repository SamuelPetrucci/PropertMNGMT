import * as React from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Avatar,
  ListItemAvatar,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  CardActions,
  Switch,
  FormControlLabel
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
  Security as SecurityIcon
} from '@mui/icons-material';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    return `http://${hostname}:5000`;
  }
};

export default function Tenants() {
  const [tenants, setTenants] = React.useState([]);
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedTab, setSelectedTab] = React.useState(0);
  
  // Dialog states
  const [addTenantDialog, setAddTenantDialog] = React.useState(false);
  const [editTenantDialog, setEditTenantDialog] = React.useState(false);
  const [tenantDetailsDialog, setTenantDetailsDialog] = React.useState(false);
  const [contactDialog, setContactDialog] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState(null);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [deleteTenantId, setDeleteTenantId] = React.useState(null);
  
  // Form states
  const [newTenant, setNewTenant] = React.useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    propertyId: '',
    unitId: '',
    rentAmount: '',
    securityDeposit: '',
    leaseStartDate: '',
    leaseEndDate: ''
  });

  // Add Invite Tenant dialog state
  const [inviteTenantDialog, setInviteTenantDialog] = React.useState(false);
  const [assignDialog, setAssignDialog] = React.useState(false);
  const [assignTenant, setAssignTenant] = React.useState(null);
  const [assignPropertyId, setAssignPropertyId] = React.useState('');
  const [assignUnitId, setAssignUnitId] = React.useState('');
  const [assignRent, setAssignRent] = React.useState('');
  const [assignLeaseStart, setAssignLeaseStart] = React.useState('');
  const [assignLeaseEnd, setAssignLeaseEnd] = React.useState('');

  // Edit Tenant Dialog state
  const [editForm, setEditForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  React.useEffect(() => {
    if (editTenantDialog && selectedTenant) {
      setEditForm({
        firstName: selectedTenant.firstName || '',
        lastName: selectedTenant.lastName || '',
        email: selectedTenant.email || '',
        phone: selectedTenant.phone || '',
      });
    }
  }, [editTenantDialog, selectedTenant]);

  const handleEditTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      setEditTenantDialog(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err) {
      setError('Failed to update tenant');
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const [tenantsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/tenants`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/properties`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const tenantsData = await tenantsRes.json();
      const propertiesData = await propertiesRes.json();

      if (!Array.isArray(tenantsData)) {
        setError(tenantsData.error || 'Failed to load tenant data');
        setTenants([]);
      } else {
        setTenants(tenantsData);
      }
      setProperties(propertiesData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load tenant data');
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTenant)
      });

      if (res.ok) {
        const createdTenant = await res.json();
        setTenants(prev => [...prev, createdTenant]);
        setAddTenantDialog(false);
        setNewTenant({
          username: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          ssn: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelation: '',
          propertyId: '',
          unitId: '',
          rentAmount: '',
          securityDeposit: '',
          leaseStartDate: '',
          leaseEndDate: ''
        });
      }
    } catch (err) {
      setError('Failed to add tenant');
    }
  };

  const getTenantStatus = (tenant) => {
    // Calculate rent status based on payment history
    const currentDate = new Date();
    const rentStatus = tenant.payments?.some(payment => 
      new Date(payment.dueDate) < currentDate && payment.status !== 'PAID'
    ) ? 'PAST_DUE' : 'CURRENT';
    
    return rentStatus;
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

  const getRentProgress = (tenant) => {
    if (!tenant.payments || tenant.payments.length === 0) return 0;
    const paidPayments = tenant.payments.filter(p => p.status === 'PAID').length;
    const totalPayments = tenant.payments.length;
    return (paidPayments / totalPayments) * 100;
  };

  const getActiveContacts = (tenant) => {
    return tenant.tenantContacts?.filter(contact => contact.status === 'ACTIVE').length || 0;
  };

  // Compute rent amount for assign dialog
  const getAssignRent = () => {
    const property = properties.find(p => String(p.id) === String(assignPropertyId));
    if (!property) return '';
    if (property.type === 'single-family' || property.type === 'SINGLE_FAMILY') {
      return property.rent || '';
    }
    if (assignUnitId) {
      const unit = property.units?.find(u => String(u.id) === String(assignUnitId));
      return unit?.rent || '';
    }
    return '';
  };

  // Add this useEffect to auto-update rentAmount in Add Tenant dialog
  React.useEffect(() => {
    const property = properties.find(p => String(p.id) === String(newTenant.propertyId));
    let rent = '';
    if (property) {
      if (property.type === 'single-family' || property.type === 'SINGLE_FAMILY') {
        rent = property.rent || '';
      } else if (newTenant.unitId) {
        const unit = property.units?.find(u => String(u.id) === String(newTenant.unitId));
        rent = unit?.rent || '';
      }
    }
    if (newTenant.rentAmount !== rent) {
      setNewTenant(nt => ({ ...nt, rentAmount: rent }));
    }
  }, [newTenant.propertyId, newTenant.unitId, properties]);

  // Add this useEffect to auto-update assignRent in Assign Tenant dialog
  React.useEffect(() => {
    const property = properties.find(p => String(p.id) === String(assignPropertyId));
    let rent = '';
    if (property) {
      if (property.type === 'single-family' || property.type === 'SINGLE_FAMILY') {
        rent = property.rent || '';
      } else if (assignUnitId) {
        const unit = property.units?.find(u => String(u.id) === String(assignUnitId));
        rent = unit?.rent || '';
      }
    }
    if (assignRent !== rent) {
      setAssignRent(rent);
    }
  }, [assignPropertyId, assignUnitId, properties]);

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
                Manage your tenants, leases, and communications
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddTenantDialog(true)}
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              Add Tenant
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setInviteTenantDialog(true)}
              sx={{ ml: 2, bgcolor: 'white', color: '#1976d2', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              Invite Tenant
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Tenants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.filter(t => getTenantStatus(t) === 'CURRENT').length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Current on Rent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.filter(t => getTenantStatus(t) === 'PAST_DUE').length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Past Due
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.reduce((sum, t) => sum + getActiveContacts(t), 0)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Active Contacts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="All Tenants" />
          <Tab label="Past Due" />
          <Tab label="Lease Renewals" />
          <Tab label="Communications" />
        </Tabs>
      </Paper>

      {/* Tenant List */}
      <Grid container spacing={3}>
        {tenants && tenants.length > 0 ? (
          tenants.map((tenant) => (
            <Grid item xs={12} md={6} lg={4} key={tenant.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(tenant.firstName && tenant.firstName.charAt(0)) || 
                       (tenant.username && tenant.username.charAt(0).toUpperCase()) || 
                       'T'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {tenant.firstName && tenant.lastName 
                          ? `${tenant.firstName} ${tenant.lastName}`
                          : (tenant.username ? tenant.username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Tenant')
                        }
                      </Typography>
                      {/* Show all assignments */}
                      {tenant.assignments && tenant.assignments.length > 0 ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">Assignments:</Typography>
                          <Table size="small" sx={{ mt: 1 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Property</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>Rent</TableCell>
                                <TableCell>Lease Start</TableCell>
                                <TableCell>Lease End</TableCell>
                                <TableCell>Type</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tenant.assignments.map((a, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{a.propertyName}</TableCell>
                                  <TableCell>{a.unitNumber || 'N/A'}</TableCell>
                                  <TableCell>${typeof a.rent === 'number' ? a.rent.toLocaleString() : 'N/A'}</TableCell>
                                  <TableCell>{a.leaseStart}</TableCell>
                                  <TableCell>{a.leaseEnd}</TableCell>
                                  <TableCell>{a.type}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No Assignments</Typography>
                      )}
                    </Box>
                    <Chip 
                      label={getTenantStatus(tenant)} 
                      color={getStatusColor(getTenantStatus(tenant))}
                      size="small"
                    />
                  </Stack>

                  {/* Contact Info */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {tenant.email && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{tenant.email}</Typography>
                      </Stack>
                    )}
                    {tenant.phone && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{tenant.phone}</Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Rent Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rent Payment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getRentProgress(tenant).toFixed(0)}%
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={getRentProgress(tenant)} 
                      color={getTenantStatus(tenant) === 'PAST_DUE' ? 'error' : 'primary'}
                    />
                  </Box>

                  {/* Active Contacts */}
                  {getActiveContacts(tenant) > 0 && (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <MessageIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2" color="warning.main">
                        {getActiveContacts(tenant)} active contact(s)
                      </Typography>
                    </Stack>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setTenantDetailsDialog(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Contact Tenant">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setContactDialog(true);
                        }}
                      >
                        <MessageIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Tenant">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setEditTenantDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Tenant">
                      <IconButton size="small" onClick={() => { setDeleteTenantId(tenant.id); setDeleteDialog(true); }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    {tenant.tenantUnits && tenant.tenantUnits.length > 0 ? (
                      <Tooltip title="Unassign Tenant">
                        <IconButton size="small" onClick={async () => {
                          const propertyId = tenant.tenantUnits[0].property?.id;
                          const unitId = tenant.tenantUnits[0].unit?.id;
                          const token = localStorage.getItem('token');
                          const apiBaseUrl = getApiBaseUrl();
                          await fetch(`${apiBaseUrl}/api/tenants/${tenant.id}/assignment`, {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ propertyId, unitId })
                          });
                          fetchData();
                        }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Assign to Property/Unit">
                        <IconButton size="small" onClick={() => { setAssignTenant(tenant); setAssignDialog(true); }}>
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No tenants found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first tenant to get started with tenant management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddTenantDialog(true)}
              >
                Add First Tenant
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Tenant Dialog */}
      <Dialog open={addTenantDialog} onClose={() => setAddTenantDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Tenant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Username"
                value={newTenant.username}
                onChange={(e) => setNewTenant({...newTenant, username: e.target.value})}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="First Name"
                value={newTenant.firstName}
                onChange={(e) => setNewTenant({...newTenant, firstName: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Last Name"
                value={newTenant.lastName}
                onChange={(e) => setNewTenant({...newTenant, lastName: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                value={newTenant.phone}
                onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={newTenant.propertyId}
                  onChange={e => setNewTenant({ ...newTenant, propertyId: e.target.value, unitId: '' })}
                  label="Property"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>{property.name} - {property.address}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit (optional)</InputLabel>
                <Select
                  value={newTenant.unitId}
                  onChange={e => setNewTenant({ ...newTenant, unitId: e.target.value })}
                  label="Unit (optional)"
                  disabled={!newTenant.propertyId || (properties.find(p => String(p.id) === String(newTenant.propertyId))?.type === 'single-family' || properties.find(p => String(p.id) === String(newTenant.propertyId))?.type === 'SINGLE_FAMILY')}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {properties.find(p => String(p.id) === String(newTenant.propertyId))?.units?.map(unit => (
                    <MenuItem key={unit.id} value={unit.id}>Unit {unit.unitNumber}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Security Deposit"
                type="number"
                value={newTenant.securityDeposit}
                onChange={e => setNewTenant({...newTenant, securityDeposit: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Rent Amount"
                type="number"
                value={(() => {
                  const property = properties.find(p => String(p.id) === String(newTenant.propertyId));
                  if (!property) return '';
                  if (property.type === 'single-family' || property.type === 'SINGLE_FAMILY') {
                    return property.rent || '';
                  }
                  if (newTenant.unitId) {
                    const unit = property.units?.find(u => String(u.id) === String(newTenant.unitId));
                    return unit?.rent || '';
                  }
                  return '';
                })()}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTenantDialog(false)}>Cancel</Button>
          <Button onClick={async () => {
            const token = localStorage.getItem('token');
            const apiBaseUrl = getApiBaseUrl();
            const property = properties.find(p => String(p.id) === String(newTenant.propertyId));
            let rent = '';
            if (property) {
              if (property.type === 'single-family' || property.type === 'SINGLE_FAMILY') {
                rent = property.rent || '';
              } else if (newTenant.unitId) {
                const unit = property.units?.find(u => String(u.id) === String(newTenant.unitId));
                rent = unit?.rent || '';
              }
            }
            await fetch(`${apiBaseUrl}/api/tenants`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...newTenant,
                rentAmount: rent,
              })
            });
            setAddTenantDialog(false);
            setNewTenant({
              username: '',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              dateOfBirth: '',
              ssn: '',
              emergencyContactName: '',
              emergencyContactPhone: '',
              emergencyContactRelation: '',
              propertyId: '',
              unitId: '',
              rentAmount: '',
              securityDeposit: '',
              leaseStartDate: '',
              leaseEndDate: ''
            });
            fetchData();
          }} variant="contained">Add Tenant</Button>
        </DialogActions>
      </Dialog>

      {/* Tenant Details Dialog */}
      <Dialog open={tenantDetailsDialog} onClose={() => setTenantDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Tenant Details</DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">
                      {selectedTenant.firstName && selectedTenant.lastName 
                        ? `${selectedTenant.firstName} ${selectedTenant.lastName}`
                        : (selectedTenant.username ? selectedTenant.username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Tenant')
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedTenant.email || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedTenant.phone || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{selectedTenant.dateOfBirth || 'Not provided'}</Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedTenant.emergencyContactName || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedTenant.emergencyContactPhone || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Relation</Typography>
                    <Typography variant="body1">{selectedTenant.emergencyContactRelation || 'Not provided'}</Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Lease Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Lease Information</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Property</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Rent Amount</TableCell>
                        <TableCell>Security Deposit</TableCell>
                        <TableCell>Lease Start</TableCell>
                        <TableCell>Lease End</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTenant.leaseAgreements?.map((lease) => (
                        <TableRow key={lease.id}>
                          <TableCell>{lease.property?.name}</TableCell>
                          <TableCell>{lease.unit?.unitNumber || 'Single Family'}</TableCell>
                          <TableCell>${typeof lease.rentAmount === 'number' ? lease.rentAmount.toLocaleString() : 'N/A'}</TableCell>
                          <TableCell>${typeof lease.securityDeposit === 'number' ? lease.securityDeposit.toLocaleString() : 'N/A'}</TableCell>
                          <TableCell>{lease.leaseStartDate}</TableCell>
                          <TableCell>{lease.leaseEndDate}</TableCell>
                          <TableCell>
                            <Chip label={lease.status} color={getStatusColor(lease.status)} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Payment History */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Payment History</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTenant.payments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.dueDate}</TableCell>
                          <TableCell>${typeof payment.amount === 'number' ? payment.amount.toLocaleString() : 'N/A'}</TableCell>
                          <TableCell>{payment.paidDate || 'Not paid'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={payment.status} 
                              color={payment.status === 'PAID' ? 'success' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTenantDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editTenantDialog} onClose={() => setEditTenantDialog(false)}>
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <TextField
            label="First Name"
            value={editForm.firstName}
            onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            value={editForm.lastName}
            onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone"
            value={editForm.phone}
            onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTenantDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTenant}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Tenant Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)}>
        <DialogTitle>Assign Tenant to Property/Unit</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Property</InputLabel>
            <Select
              value={assignPropertyId}
              onChange={e => { setAssignPropertyId(e.target.value); setAssignUnitId(''); }}
              label="Property"
            >
              {properties.map(property => (
                <MenuItem key={property.id} value={property.id}>{property.name} - {property.address}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Unit (optional)</InputLabel>
            <Select
              value={assignUnitId}
              onChange={e => setAssignUnitId(e.target.value)}
              label="Unit (optional)"
              disabled={!assignPropertyId || (properties.find(p => String(p.id) === String(assignPropertyId))?.type === 'single-family' || properties.find(p => String(p.id) === String(assignPropertyId))?.type === 'SINGLE_FAMILY')}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {properties.find(p => String(p.id) === String(assignPropertyId))?.units?.map(unit => (
                <MenuItem key={unit.id} value={unit.id}>Unit {unit.unitNumber}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Rent Amount"
            type="number"
            value={getAssignRent()}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Lease Start Date"
            type="date"
            value={assignLeaseStart}
            onChange={e => setAssignLeaseStart(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Lease End Date"
            type="date"
            value={assignLeaseEnd}
            onChange={e => setAssignLeaseEnd(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            const token = localStorage.getItem('token');
            const apiBaseUrl = getApiBaseUrl();
            await fetch(`${apiBaseUrl}/api/tenants/${assignTenant.id}/leases`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                propertyId: assignPropertyId,
                unitId: assignUnitId || null,
                rentAmount: getAssignRent(),
                leaseStartDate: assignLeaseStart,
                leaseEndDate: assignLeaseEnd,
              })
            });
            setAssignDialog(false);
            setAssignTenant(null);
            setAssignPropertyId('');
            setAssignUnitId('');
            setAssignLeaseStart('');
            setAssignLeaseEnd('');
            fetchData();
          }}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Tenant Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this tenant? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            const token = localStorage.getItem('token');
            const apiBaseUrl = getApiBaseUrl();
            await fetch(`${apiBaseUrl}/api/tenants/${deleteTenantId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            setDeleteDialog(false);
            setDeleteTenantId(null);
            fetchData();
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 