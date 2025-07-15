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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function FinancialDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFinancialData();
  }, [refreshTrigger]);

  const fetchFinancialData = async () => {
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
        throw new Error('Failed to fetch financial data');
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Could not fetch financial data');
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
        <Typography sx={{ mt: 2 }}>Loading financial dashboard...</Typography>
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
        <Typography>No financial data available.</Typography>
      </Box>
    );
  }

  const { summary, properties, tenants, rentTracking, recentActivity } = dashboardData;

  // Calculate additional financial metrics
  const totalMonthlyExpenses = properties.reduce((sum, prop) => {
    const mortgagePayment = prop.mortgage?.monthlyPayment || 0;
    const miscExpenses = (prop.miscExpenses || []).reduce((pSum, exp) => pSum + (exp.amount || 0), 0);
    const propertyTaxes = prop.valuation && prop.taxRate 
      ? (prop.valuation * (parseFloat(prop.taxRate) / 100) / 12)
      : 0;
    return sum + mortgagePayment + miscExpenses + propertyTaxes;
  }, 0);

  const netMonthlyCashflow = summary.totalMonthlyRent - totalMonthlyExpenses;
  const annualNetCashflow = netMonthlyCashflow * 12;
  const totalPropertyValue = properties.reduce((sum, prop) => sum + (prop.valuation || 0), 0);
  const totalMortgageDebt = properties.reduce((sum, prop) => sum + (prop.mortgage?.amount || 0), 0);
  const equity = totalPropertyValue - totalMortgageDebt;
  const cashOnCashReturn = totalPropertyValue > 0 ? (annualNetCashflow / totalPropertyValue * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Financial Dashboard
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Key Financial Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">${summary.totalMonthlyRent.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Monthly Revenue</Typography>
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
                  <AccountBalanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">${totalMonthlyExpenses.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Monthly Expenses</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: netMonthlyCashflow >= 0 ? 'success.main' : 'error.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" color={netMonthlyCashflow >= 0 ? 'success.main' : 'error.main'}>
                    ${netMonthlyCashflow.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Net Monthly Cashflow</Typography>
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
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{cashOnCashReturn.toFixed(2)}%</Typography>
                  <Typography variant="body2" color="text.secondary">Cash-on-Cash Return</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Financial Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Revenue Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Monthly Rent:</Typography>
                  <Typography variant="h6" color="success.main">
                    ${summary.totalMonthlyRent.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Collected This Month:</Typography>
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
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">Collection Rate:</Typography>
                  <Chip 
                    label={`${summary.totalMonthlyRent > 0 ? ((summary.totalCollected / summary.totalMonthlyRent) * 100).toFixed(1) : 0}%`}
                    color={summary.totalCollected / summary.totalMonthlyRent > 0.9 ? 'success' : 'warning'}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Expense Breakdown
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Mortgage Payments:</Typography>
                  <Typography variant="h6" color="error.main">
                    ${properties.reduce((sum, prop) => sum + (prop.mortgage?.monthlyPayment || 0), 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Property Taxes:</Typography>
                  <Typography variant="h6" color="error.main">
                    ${properties.reduce((sum, prop) => {
                      const annualTax = prop.valuation && prop.taxRate 
                        ? (prop.valuation * (parseFloat(prop.taxRate) / 100))
                        : 0;
                      return sum + (annualTax / 12);
                    }, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Misc Expenses:</Typography>
                  <Typography variant="h6" color="error.main">
                    ${properties.reduce((sum, prop) => 
                      sum + (prop.miscExpenses || []).reduce((pSum, exp) => pSum + (exp.amount || 0), 0), 0
                    ).toLocaleString()}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">Total Monthly Expenses:</Typography>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    ${totalMonthlyExpenses.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Property Performance */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Property Performance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Monthly Rent</TableCell>
                  <TableCell>Monthly Expenses</TableCell>
                  <TableCell>Net Cashflow</TableCell>
                  <TableCell>Occupancy</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => {
                  const propertyRentData = rentTracking.filter(rent => rent.propertyId === property.id);
                  const monthlyRent = propertyRentData.reduce((sum, rent) => sum + (rent.rent || 0), 0);
                  const mortgagePayment = property.mortgage?.monthlyPayment || 0;
                  const miscExpenses = (property.miscExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
                  const propertyTaxes = property.valuation && property.taxRate 
                    ? (property.valuation * (parseFloat(property.taxRate) / 100) / 12)
                    : 0;
                  const monthlyExpenses = mortgagePayment + miscExpenses + propertyTaxes;
                  const netCashflow = monthlyRent - monthlyExpenses;
                  const occupancyRate = property.units?.length > 0 
                    ? (propertyRentData.length / property.units.length * 100).toFixed(1)
                    : propertyRentData.length > 0 ? '100' : '0';
                  
                  return (
                    <TableRow key={property.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{property.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{property.address}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" color="success.main">
                          ${monthlyRent.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" color="error.main">
                          ${monthlyExpenses.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" color={netCashflow >= 0 ? 'success.main' : 'error.main'}>
                          ${netCashflow.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {occupancyRate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={netCashflow >= 0 ? 'Profitable' : 'Loss'}
                          color={netCashflow >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Portfolio Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Property Value:</Typography>
                  <Typography variant="h6">
                    ${totalPropertyValue.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Mortgage Debt:</Typography>
                  <Typography variant="h6" color="error.main">
                    ${totalMortgageDebt.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Total Equity:</Typography>
                  <Typography variant="h6" color="success.main">
                    ${equity.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Annual Net Cashflow:</Typography>
                  <Typography variant="h6" color={annualNetCashflow >= 0 ? 'success.main' : 'error.main'}>
                    ${annualNetCashflow.toLocaleString()}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">Leverage Ratio:</Typography>
                  <Typography variant="h6">
                    {totalPropertyValue > 0 ? ((totalMortgageDebt / totalPropertyValue) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Alerts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {summary.overdueTenants > 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      {summary.overdueTenants} tenant(s) have overdue payments totaling ${summary.overdueAmount.toLocaleString()}
                    </Typography>
                  </Alert>
                )}
                {summary.totalOutstanding > 0 && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      ${summary.totalOutstanding.toLocaleString()} in outstanding rent payments
                    </Typography>
                  </Alert>
                )}
                {netMonthlyCashflow < 0 && (
                  <Alert severity="error">
                    <Typography variant="body2">
                      Negative monthly cashflow of ${Math.abs(netMonthlyCashflow).toLocaleString()}
                    </Typography>
                  </Alert>
                )}
                {recentActivity.expiringLeases.length > 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      {recentActivity.expiringLeases.length} lease(s) expiring within 30 days
                    </Typography>
                  </Alert>
                )}
                {summary.occupancyRate < 90 && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Occupancy rate is {summary.occupancyRate}% - consider marketing vacant units
                    </Typography>
                  </Alert>
                )}
                {summary.occupancyRate >= 90 && netMonthlyCashflow > 0 && (
                  <Alert severity="success">
                    <Typography variant="body2">
                      Excellent performance! High occupancy and positive cashflow
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
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
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => handleNavigate('/properties')}
              >
                Property Management
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PeopleIcon />}
                onClick={() => handleNavigate('/tenants')}
              >
                Tenant Management
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleNavigate('/')}
              >
                Main Dashboard
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
} 