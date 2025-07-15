import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Info as InfoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

export default function RentTracking() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Enhanced tenant form state
  const [tenantForm, setTenantForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    unitId: '',
    rentAmount: '',
    leaseStartDate: '',
    leaseEndDate: '',
    securityDeposit: ''
  });

  useEffect(() => {
    fetchIntegratedData();
  }, [refreshTrigger]);

  const fetchIntegratedData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      // Fetch all data in parallel
      const [rentTrackingRes, tenantsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/rent-tracking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/properties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (rentTrackingRes.ok && tenantsRes.ok && propertiesRes.ok) {
        const [rentData, tenantsData, propertiesData] = await Promise.all([
          rentTrackingRes.json(),
          tenantsRes.json(),
          propertiesRes.json()
        ]);

        // Merge data from all sources
        const integratedData = mergeRentTrackingData(rentData, tenantsData, propertiesData);
        setTenants(integratedData);
        setProperties(propertiesData);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching integrated data:', err);
      setError('Could not fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Function to get API base URL dynamically
  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000';
    } else {
      return `http://${hostname}:5000`;
    }
  };

  // Merge data from rent tracking, tenants, and properties
  const mergeRentTrackingData = (rentData, tenantsData, propertiesData) => {
    const propertyMap = new Map(propertiesData.map(p => [p.id, p]));
    
    return rentData.map(rentItem => {
      const property = propertyMap.get(rentItem.propertyId);
      const tenant = tenantsData.find(t => t.id === rentItem.tenantId);
      
      return {
        ...rentItem,
        propertyName: property?.name || 'Unknown Property',
        propertyAddress: property?.address || '',
        propertyType: property?.type || 'unknown',
        tenantFirstName: tenant?.firstName || '',
        tenantLastName: tenant?.lastName || '',
        tenantEmail: tenant?.email || '',
        tenantPhone: tenant?.phone || '',
        tenantStatus: tenant?.status || 'INACTIVE',
        // Enhanced payment tracking
        totalPayments: rentItem.payments?.length || 0,
        paidPayments: rentItem.payments?.filter(p => p.paid)?.length || 0,
        overduePayments: rentItem.payments?.filter(p => !p.paid && new Date(p.dueDate) < new Date())?.length || 0,
        // Financial summary
        totalRentCollected: rentItem.payments?.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        outstandingBalance: rentItem.payments?.filter(p => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      };
    });
  };

  // Add/Edit dialog handlers
  const handleOpenAddDialog = () => setAddDialogOpen(true);
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setTenantForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      propertyId: '',
      unitId: '',
      rentAmount: '',
      leaseStartDate: '',
      leaseEndDate: '',
      securityDeposit: ''
    });
  };

  const handleCreateTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const formData = new FormData();
      Object.keys(tenantForm).forEach(key => {
        if (tenantForm[key]) {
          formData.append(key, tenantForm[key]);
        }
      });

      const response = await fetch(`${apiBaseUrl}/api/tenants/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        handleCloseAddDialog();
        setRefreshTrigger(prev => prev + 1);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create tenant');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      setError('Failed to create tenant');
    }
  };

  function getPaymentHistoryTooltip(payments) {
    if (!payments || payments.length === 0) return 'No payment history';
    return payments.map(p => `${p.dueDate}: ${p.paid ? 'Paid' : 'Unpaid'}`).join('\n');
  }

  const handleTogglePayment = async (tenant, paymentIdx) => {
    try {
      const months = generateMonthList(tenant.leaseStart, tenant.leaseEnd);
      const mergedPayments = mergePaymentsWithMonths(months, tenant.payments);
      const payment = mergedPayments[paymentIdx];
      
      if (!payment) return;
      
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const isPaid = !payment.paid;
      const paidDate = isPaid ? new Date().toISOString().slice(0, 10) : null;
      
      const tenantId = tenant.tenantId || tenant.id;
      
      if (payment.id) {
        // Update existing payment
        const response = await fetch(`${apiBaseUrl}/api/rent-tracking/payments/${payment.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paid: isPaid,
            paidDate: paidDate
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update payment');
        }
      } else {
        // Create new payment
        const response = await fetch(`${apiBaseUrl}/api/rent-tracking/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tenantId: tenantId,
            propertyId: tenant.propertyId,
            unitId: tenant.unitId || null,
            dueDate: payment.dueDate,
            amount: tenant.rent,
            paid: isPaid,
            paidDate: paidDate
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment');
        }
      }
      
      // Update local state
      const updatedPayments = mergedPayments.map((p, idx) =>
        idx === paymentIdx
          ? {
              ...p,
              paid: isPaid,
              paidDate: paidDate
            }
          : p
      );
      
      setTenants(ts => ts.map(t =>
        t.propertyId === tenant.propertyId && 
        (t.unitNumber === tenant.unitNumber || (t.type === 'single-family' && t.type === tenant.type))
          ? { ...t, payments: updatedPayments }
          : t
      ));
      
    } catch (error) {
      console.error('Error updating payment:', error);
      setError('Failed to update payment status');
    }
  };

  // Utility to generate all months from leaseStart to next due date (or today)
  function generateMonthList(leaseStart, leaseEnd) {
    if (!leaseStart) return [];
    const start = new Date(leaseStart);
    const end = leaseEnd ? new Date(leaseEnd) : new Date();
    const today = new Date();
    // Show up to the later of today or leaseEnd
    const last = leaseEnd ? (end > today ? end : today) : today;
    const months = [];
    let d = new Date(start);
    while (d <= last) {
      months.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  }

  function mergePaymentsWithMonths(months, payments) {
    // For each month, find a payment or create an unpaid entry
    return months.map(monthDate => {
      // Use the same day as leaseStart for each due date
      const dueDate = monthDate.toISOString().slice(0, 10);
      const payment = payments?.find(p => p.dueDate === dueDate);
      return payment || { dueDate, paid: false };
    });
  }

  // Filter functions
  const getFilteredTenants = () => {
    let filtered = tenants;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tenant => {
        const currentDueDate = tenant.payments?.find(p => !p.paid)?.dueDate;
        const isOverdue = currentDueDate && new Date(currentDueDate) < new Date();
        const isPaid = tenant.payments?.every(p => p.paid);
        
        if (filterStatus === 'overdue') return isOverdue;
        if (filterStatus === 'paid') return isPaid;
        if (filterStatus === 'due') return !isOverdue && !isPaid;
        return true;
      });
    }
    
    if (filterProperty !== 'all') {
      filtered = filtered.filter(tenant => tenant.propertyId === parseInt(filterProperty));
    }
    
    return filtered;
  };

  const filteredTenants = getFilteredTenants();

  // Summary statistics
  const getSummaryStats = () => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.tenantStatus === 'ACTIVE').length;
    const totalRent = tenants.reduce((sum, t) => sum + (t.rent || 0), 0);
    const totalCollected = tenants.reduce((sum, t) => sum + (t.totalRentCollected || 0), 0);
    const totalOutstanding = tenants.reduce((sum, t) => sum + (t.outstandingBalance || 0), 0);
    
    return { totalTenants, activeTenants, totalRent, totalCollected, totalOutstanding };
  };

  const stats = getSummaryStats();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Rent Tracking Dashboard</Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Tenants</Typography>
              <Typography variant="h4">{stats.totalTenants}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Tenants</Typography>
              <Typography variant="h4">{stats.activeTenants}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Monthly Rent</Typography>
              <Typography variant="h4">${stats.totalRent.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Collected</Typography>
              <Typography variant="h4" color="success.main">${stats.totalCollected.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Outstanding</Typography>
              <Typography variant="h4" color="error.main">${stats.totalOutstanding.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Tenant
        </Button>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
            <MenuItem value="due">Due</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Property</InputLabel>
          <Select
            value={filterProperty}
            label="Property"
            onChange={(e) => setFilterProperty(e.target.value)}
          >
            <MenuItem value="all">All Properties</MenuItem>
            {properties.map(property => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton onClick={() => setRefreshTrigger(prev => prev + 1)}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>History</TableCell>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Rent</TableCell>
              <TableCell>Lease Period</TableCell>
              <TableCell>Current Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Financial Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTenants.map((tenant, idx) => {
              const months = generateMonthList(tenant.leaseStart, tenant.leaseEnd);
              const mergedPayments = mergePaymentsWithMonths(months, tenant.payments);
              const currentDueDate = mergedPayments.find(p => !p.paid)?.dueDate || (mergedPayments.length > 0 ? mergedPayments[mergedPayments.length - 1].dueDate : '-');
              const currentPaid = mergedPayments.find(p => p.dueDate === currentDueDate)?.paid;
              const rowKey = tenant.propertyId + '-' + (tenant.unitNumber || 'single');
              const isRowExpanded = expanded[rowKey] || false;
              
              return (
                <React.Fragment key={rowKey}>
                  <TableRow>
                    <TableCell>
                      <IconButton size="small" onClick={() => setExpanded(exp => ({ ...exp, [rowKey]: !isRowExpanded }))}>
                        {isRowExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{getPaymentHistoryTooltip(mergedPayments)}</span>}>
                        <IconButton size="small"><InfoIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {tenant.tenant || `${tenant.tenantFirstName} ${tenant.tenantLastName}`}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={tenant.tenantStatus} 
                          color={tenant.tenantStatus === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{tenant.tenantEmail}</Typography>
                        <Typography variant="body2" color="textSecondary">{tenant.tenantPhone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{tenant.propertyName}</Typography>
                        <Typography variant="body2" color="textSecondary">{tenant.propertyAddress}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{tenant.unitNumber || '-'}</TableCell>
                    <TableCell>${tenant.rent}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{tenant.leaseStart || '-'}</Typography>
                        <Typography variant="body2" color="textSecondary">{tenant.leaseEnd || '-'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{currentDueDate || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={currentPaid ? 'PAID' : (currentDueDate && new Date(currentDueDate) < new Date() ? 'OVERDUE' : 'DUE')}
                        color={currentPaid ? 'success' : (currentDueDate && new Date(currentDueDate) < new Date() ? 'error' : 'warning')}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="success.main">
                          Collected: ${tenant.totalRentCollected}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Outstanding: ${tenant.outstandingBalance}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                      <Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
                        <Box margin={2}>
                          <Typography variant="subtitle2" gutterBottom>Payment History</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {mergedPayments.map((p, i) => (
                              <Button
                                key={p.dueDate}
                                size="small"
                                variant={p.paid ? 'contained' : 'outlined'}
                                color={p.paid ? 'success' : 'warning'}
                                onClick={() => { handleTogglePayment(tenant, i); }}
                                sx={{ minWidth: 100, mb: 1 }}
                              >
                                {p.dueDate.slice(0, 7)}<br />{p.paid ? 'Paid' : 'Unpaid'}
                              </Button>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Tenant Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Tenant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={tenantForm.firstName}
                onChange={(e) => setTenantForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={tenantForm.lastName}
                onChange={(e) => setTenantForm(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={tenantForm.email}
                onChange={(e) => setTenantForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={tenantForm.phone}
                onChange={(e) => setTenantForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={tenantForm.propertyId}
                  label="Property"
                  onChange={(e) => setTenantForm(prev => ({ ...prev, propertyId: e.target.value }))}
                >
                  {properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rent Amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={tenantForm.rentAmount}
                onChange={(e) => setTenantForm(prev => ({ ...prev, rentAmount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lease Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={tenantForm.leaseStartDate}
                onChange={(e) => setTenantForm(prev => ({ ...prev, leaseStartDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lease End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={tenantForm.leaseEndDate}
                onChange={(e) => setTenantForm(prev => ({ ...prev, leaseEndDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Security Deposit"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={tenantForm.securityDeposit}
                onChange={(e) => setTenantForm(prev => ({ ...prev, securityDeposit: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleCreateTenant} variant="contained">Create Tenant</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 