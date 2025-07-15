import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Apartment as ApartmentIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/dashboard/integrated`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Could not fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000';
    } else {
      return `http://${hostname}:5000`;
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={handleRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No dashboard data available.</Typography>
      </Box>
    );
  }

  const { summary, properties, tenants, rentTracking, recentActivity } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Property Management Dashboard
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <HomeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{summary.totalProperties}</Typography>
                  <Typography variant="body2" color="text.secondary">Properties</Typography>
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
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{summary.activeTenants}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Tenants</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">${summary.totalMonthlyRent.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Monthly Rent</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: summary.overdueTenants > 0 ? 'error.main' : 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{summary.occupancyRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Occupancy Rate</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Overview
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Collected:</Typography>
                  <Typography variant="h6" color="success.main">
                    ${summary.totalCollected.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Outstanding:</Typography>
                  <Typography variant="h6" color="error.main">
                    ${summary.totalOutstanding.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Overdue Amount:</Typography>
                  <Typography variant="h6" color="warning.main">
                    ${summary.overdueAmount.toLocaleString()}
                  </Typography>
                </Box>
                {summary.overdueTenants > 0 && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">Overdue Tenants:</Typography>
                    <Chip 
                      label={summary.overdueTenants} 
                      color="error" 
                      icon={<WarningIcon />}
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Breakdown
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Single Family:</Typography>
                  <Typography variant="h6">
                    {summary.singleFamilyProperties}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Multi-Family:</Typography>
                  <Typography variant="h6">
                    {summary.multiFamilyProperties}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Units:</Typography>
                  <Typography variant="h6">
                    {summary.totalUnits}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Occupied Units:</Typography>
                  <Typography variant="h6">
                    {summary.occupiedUnits}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity & Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Payments
              </Typography>
              {recentActivity.recentPayments.length > 0 ? (
                <List>
                  {recentActivity.recentPayments.map((payment, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <PaymentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`$${payment.amount} - ${payment.dueDate}`}
                        secondary={`Paid on ${payment.paidDate}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent payments
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expiring Leases
              </Typography>
              {recentActivity.expiringLeases.length > 0 ? (
                <List>
                  {recentActivity.expiringLeases.slice(0, 5).map((lease, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={lease.tenant}
                        secondary={`Expires: ${lease.leaseEnd}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No expiring leases
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => handleNavigate('/properties')}
              >
                Manage Properties
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PeopleIcon />}
                onClick={() => handleNavigate('/tenants')}
              >
                Manage Tenants
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<MoneyIcon />}
                onClick={() => handleNavigate('/rent-tracking')}
              >
                Rent Tracking
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => handleNavigate('/financial-dashboard')}
              >
                Financial Dashboard
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Properties */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Performing Properties
          </Typography>
          <Grid container spacing={2}>
            {properties
              .filter(prop => prop.totalRent > 0)
              .sort((a, b) => b.totalRent - a.totalRent)
              .slice(0, 3)
              .map((property) => (
                <Grid item xs={12} md={4} key={property.id}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {property.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {property.address}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        ${property.totalRent}/month
                      </Typography>
                      <Chip 
                        label={`${property.tenantCount} tenants`}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                    {property.overdueTenants > 0 && (
                      <Chip 
                        label={`${property.overdueTenants} overdue`}
                        size="small"
                        color="error"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}