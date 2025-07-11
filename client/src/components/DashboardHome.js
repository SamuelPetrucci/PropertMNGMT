import React from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Paper, 
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  MonetizationOn,
  CreditCard,
  AttachMoney,
  ShowChart,
  Assessment,
  Home,
  Business
} from '@mui/icons-material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ProjectionCalculator from './ProjectionCalculator';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Robinhood-inspired color palette
const COLORS = ['#00D4AA', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Custom tooltip for charts
function PropertyTooltip({ active, payload, label, properties }) {
  if (!active || !payload || !payload.length) return null;
  const propertiesArray = Array.isArray(properties) ? properties : [];
  let propName = label;
  let prop = propertiesArray.find(p => p.name === propName);
  if (!prop && payload[0].name) {
    propName = payload[0].name;
    prop = propertiesArray.find(p => p.name === propName);
  }
  if (!prop) return null;
  const rent = prop.type === 'single-family' ? (prop.rent || 0) : (prop.units || []).reduce((uSum, u) => uSum + (u.rent || 0), 0);
  const mortgage = prop.mortgage?.monthlyPayment ? Number(prop.mortgage.monthlyPayment) : 0;
  const debt = prop.mortgage?.amount ? Number(prop.mortgage.amount) : 0;
  const cashflow = rent - mortgage;
  return (
    <Paper sx={{ p: 2, boxShadow: 3, bgcolor: '#1a1a1a', color: 'white', border: '1px solid #333' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#00D4AA' }}>{prop.name}</Typography>
      <Typography variant="body2" sx={{ color: '#e0e0e0' }}>Rent: ${typeof rent === 'number' ? rent.toLocaleString() : 'N/A'}</Typography>
      <Typography variant="body2" sx={{ color: '#e0e0e0' }}>Mortgage: {typeof mortgage === 'number' && mortgage ? `$${mortgage.toLocaleString()}` : '-'}</Typography>
      <Typography variant="body2" sx={{ color: '#e0e0e0' }}>Debt: {typeof debt === 'number' && debt ? `$${debt.toLocaleString()}` : '-'}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: cashflow >= 0 ? '#00D4AA' : '#FF6B6B' }}>
        Cashflow: ${typeof cashflow === 'number' ? cashflow.toLocaleString() : 'N/A'}
      </Typography>
    </Paper>
  );
}

// Enhanced Metric Card Component with clean blue/white theme
function MetricCard({ title, value, subtitle, icon, color, trend, progress, bgGradient }) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        color: '#2c3e50',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e9ecef',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          border: '1px solid #3498db',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(52, 152, 219, 0.2)',
          transition: 'all 0.3s ease'
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: '#3498db', 
            color: 'white',
            width: 40,
            height: 40,
            fontSize: '1.2rem'
          }}>
            {icon}
          </Avatar>
          {trend && (
            <Chip
              icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${Math.abs(trend)}%`}
              size="small"
              sx={{ 
                bgcolor: trend > 0 ? '#d4edda' : '#f8d7da',
                color: trend > 0 ? '#155724' : '#721c24',
                border: `1px solid ${trend > 0 ? '#c3e6cb' : '#f5c6cb'}`,
                fontSize: '0.75rem',
                height: 24
              }}
            />
          )}
        </Box>
        
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          mb: 1, 
          color: '#2c3e50',
          fontSize: '1.8rem'
        }}>
          {value}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ 
          mb: 1, 
          color: '#6c757d',
          fontWeight: 500,
          fontSize: '0.9rem'
        }}>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" sx={{ 
            color: '#868e96',
            fontSize: '0.8rem'
          }}>
            {subtitle}
          </Typography>
        )}
        
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                bgcolor: '#e9ecef',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#3498db'
                }
              }} 
            />
            <Typography variant="caption" sx={{ 
              mt: 0.5, 
              display: 'block', 
              color: '#868e96',
              fontSize: '0.75rem'
            }}>
              {progress}% of target
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ChartCard for consistent chart tile look
function ChartCard({ title, children }) {
  return (
    <Card 
      sx={{
        height: 400,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        color: '#2c3e50',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e9ecef',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          border: '1px solid #3498db',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(52, 152, 219, 0.2)',
          transition: 'all 0.3s ease'
        },
        p: 3
      }}
    >
      <CardContent sx={{ p: 0, height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2c3e50' }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function DashboardHome({ properties = [] }) {
  console.log('DashboardHome received properties:', properties);
  
  // Ensure properties is always an array
  const propertiesArray = Array.isArray(properties) ? properties : [];
  
  // Financial calculations (totals for all properties)
  const totalRent = propertiesArray.reduce((sum, p) => {
    if (p.type === 'single-family') return sum + (p.rent || 0);
    return sum + (p.units || []).reduce((uSum, u) => uSum + (u.rent || 0), 0);
  }, 0);
  const totalMortgage = propertiesArray.reduce((sum, p) => sum + (p.mortgage?.monthlyPayment ? Number(p.mortgage.monthlyPayment) : 0), 0);
  const totalDebt = propertiesArray.reduce((sum, p) => sum + (p.mortgage?.amount ? Number(p.mortgage.amount) : 0), 0);
  const cashflow = totalRent - totalMortgage;
  const totalValuation = propertiesArray.reduce((sum, p) => sum + (p.valuation ? Number(p.valuation) : 0), 0);

  // Calculate misc expenses and cashflow after misc
  const totalMisc = propertiesArray.reduce((sum, p) => sum + (p.miscExpenses || []).reduce((s, e) => s + Number(e.amount || 0), 0), 0);
  const cashflowAfterMisc = cashflow - totalMisc;

  // Calculate property taxes
  const totalPropertyTaxes = propertiesArray.reduce((sum, p) => {
    if (p.valuation && p.taxRate) {
      const taxRate = parseFloat(p.taxRate) / 100; // Convert percentage to decimal
      return sum + (p.valuation * taxRate);
    }
    return sum;
  }, 0);

  // Calculate annual net cashflow properly
  const annualNetCashflow = (totalRent * 12) - (totalMortgage * 12) - (totalMisc * 12) - totalPropertyTaxes;

  // Calculate ROI and other metrics
  const totalInvestment = totalDebt;
  const annualROI = totalInvestment > 0 ? (annualNetCashflow / totalInvestment) * 100 : 0;
  const monthlyROI = totalInvestment > 0 ? (cashflowAfterMisc / totalInvestment) * 100 : 0;

  // Pie chart data for rent by property
  const pieData = propertiesArray.map((p) => ({
    name: p.name,
    value: p.type === 'single-family' ? p.rent : (p.units || []).reduce((uSum, u) => uSum + (u.rent || 0), 0),
  }));

  // Bar chart data for each property
  const barData = propertiesArray.map((p) => ({
    name: p.name,
    Rent: p.type === 'single-family' ? p.rent : (p.units || []).reduce((uSum, u) => uSum + (u.rent || 0), 0),
    Mortgage: p.mortgage?.monthlyPayment ? Number(p.mortgage.monthlyPayment) : 0,
  }));

  // Area chart data for cashflow over time (simulated)
  const cashflowData = [
    { month: 'Jan', cashflow: cashflowAfterMisc * 0.8 },
    { month: 'Feb', cashflow: cashflowAfterMisc * 0.9 },
    { month: 'Mar', cashflow: cashflowAfterMisc * 1.1 },
    { month: 'Apr', cashflow: cashflowAfterMisc * 0.95 },
    { month: 'May', cashflow: cashflowAfterMisc * 1.05 },
    { month: 'Jun', cashflow: cashflowAfterMisc },
  ];

  // Pie chart data for misc expense categories
  const miscCategoryTotals = {};
  propertiesArray.forEach(p => {
    (p.miscExpenses || []).forEach(e => {
      if (!miscCategoryTotals[e.label]) miscCategoryTotals[e.label] = 0;
      miscCategoryTotals[e.label] += Number(e.amount || 0);
    });
  });
  const miscPieData = Object.entries(miscCategoryTotals).map(([label, value]) => ({ name: label, value }));

  // Get username from token
  let username = '';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.username;
    }
  } catch {}

  // Show welcome Snackbar on mount
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    setOpen(true);
  }, []);
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Snackbar open={open} autoHideDuration={3500} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert onClose={handleClose} severity="success" elevation={6} variant="filled" sx={{ bgcolor: '#3498db', color: '#fff' }}>
          Welcome, {username ? username.charAt(0).toUpperCase() + username.slice(1) : 'User'}!
        </MuiAlert>
      </Snackbar>
      
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2c3e50' }}>
        Welcome, {username ? username.charAt(0).toUpperCase() + username.slice(1) : 'User'}! 👋
      </Typography>

      {/* Enhanced Financial Summary Cards */}
      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Portfolio Value"
            value={`$${typeof totalValuation === 'number' ? totalValuation.toLocaleString() : 'N/A'}`}
            subtitle="Total property valuations"
            icon={<AccountBalance />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            progress={Math.min((totalValuation / 1000000) * 100, 100)}
          />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Monthly Rent"
            value={`$${typeof totalRent === 'number' ? totalRent.toLocaleString() : 'N/A'}`}
            subtitle="Total rental income"
            icon={<MonetizationOn />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            trend={5.2}
          />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Monthly Cashflow"
            value={`$${typeof cashflowAfterMisc === 'number' ? cashflowAfterMisc.toLocaleString() : 'N/A'}`}
            subtitle="After all expenses"
            icon={<AttachMoney />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            trend={cashflowAfterMisc >= 0 ? 3.1 : -2.5}
          />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="ROI"
            value={`${monthlyROI.toFixed(1)}%`}
            subtitle="Monthly return on investment"
            icon={<ShowChart />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            trend={monthlyROI > 0 ? 1.8 : -1.2}
          />
        </Box>
      </Stack>

      {/* Secondary Metrics */}
      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Annual Net Cashflow"
            value={`$${typeof annualNetCashflow === 'number' ? annualNetCashflow.toLocaleString() : 'N/A'}`}
            subtitle="After all expenses & taxes"
            icon={<Assessment />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Total Debt"
            value={`$${typeof totalDebt === 'number' ? totalDebt.toLocaleString() : 'N/A'}`}
            subtitle="Outstanding mortgages"
            icon={<CreditCard />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          />
        </Box>
        <Box sx={{ flex: '1 1 260px', minWidth: 260, maxWidth: 350, mb: 2 }}>
          <MetricCard
            title="Properties"
            value={propertiesArray.length}
            subtitle="Total properties owned"
            icon={<Home />}
            bgGradient="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          />
        </Box>
      </Stack>

      {/* Enhanced Charts Section */}
      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
        {/* Cashflow Trend Chart */}
        <Box sx={{ flex: '1 1 350px', minWidth: 350, maxWidth: 500, mb: 2 }}>
          <ChartCard title="Monthly Cashflow Trend">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashflowData}>
                <XAxis dataKey="month" stroke="#6c757d" />
                <YAxis tickFormatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A'} stroke="#6c757d" />
                <Tooltip 
                  formatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A'}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e9ecef',
                    color: '#2c3e50'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cashflow" 
                  stroke="#3498db" 
                  fill="#3498db" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>

        {/* Property Performance Chart */}
        <Box sx={{ flex: '1 1 350px', minWidth: 350, maxWidth: 500, mb: 2 }}>
          <ChartCard title="Property Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6c757d" />
                <YAxis tickFormatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A'} stroke="#6c757d" />
                <Tooltip 
                  content={<PropertyTooltip properties={propertiesArray} />}
                />
                <Legend />
                <Bar dataKey="Rent" fill="#3498db" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mortgage" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      </Stack>

      {/* Property Distribution Charts */}
      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
        <Box sx={{ flex: '1 1 350px', minWidth: 350, maxWidth: 500, mb: 2 }}>
          <ChartCard title="Rent Distribution by Property">
            {pieData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography color="#6c757d">No properties found.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: $${typeof value === 'number' ? value.toLocaleString() : 'N/A'}`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A'}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e9ecef',
                      color: '#2c3e50'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Box>

        <Box sx={{ flex: '1 1 350px', minWidth: 350, maxWidth: 500, mb: 2 }}>
          <ChartCard title="Misc Expenses Breakdown">
            {miscPieData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography color="#6c757d">No misc expenses found.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={miscPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: $${typeof value === 'number' ? value.toLocaleString() : 'N/A'}`}
                  >
                    {miscPieData.map((entry, idx) => (
                      <Cell key={`cell-misc-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A'}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e9ecef',
                      color: '#2c3e50'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Box>
      </Stack>

      {/* Enhanced Property Table */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#ffffff', border: '1px solid #e9ecef', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2c3e50' }}>
          Property Financial Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Property</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Rent</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Mortgage</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Debt</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>Cashflow</TableCell>
                <TableCell sx={{ color: '#3498db', fontWeight: 'bold' }}>ROI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propertiesArray.map((p) => {
                const rent = p.type === 'single-family'
                  ? (p.rent || 0)
                  : (p.units || []).reduce((uSum, u) => uSum + (u.rent || 0), 0);
                const mortgage = p.mortgage?.monthlyPayment ? Number(p.mortgage.monthlyPayment) : 0;
                const debt = p.mortgage?.amount ? Number(p.mortgage.amount) : 0;
                const cashflow = rent - mortgage;
                const propertyROI = debt > 0 ? (cashflow / debt) * 100 : 0;
                
                return (
                  <TableRow key={p.id} sx={{ 
                    '&:hover': { bgcolor: '#f8f9fa' },
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>{p.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={p.type} 
                        size="small" 
                        sx={{
                          bgcolor: p.type === 'single-family' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                          color: p.type === 'single-family' ? '#3498db' : '#e74c3c',
                          border: `1px solid ${p.type === 'single-family' ? '#3498db' : '#e74c3c'}`
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#27ae60' }}>
                      ${typeof rent === 'number' ? rent.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: '#e74c3c' }}>
                      {typeof mortgage === 'number' && mortgage ? `$${mortgage.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#2c3e50' }}>
                      {typeof debt === 'number' && debt ? `$${debt.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      color: cashflow >= 0 ? '#27ae60' : '#e74c3c'
                    }}>
                      ${typeof cashflow === 'number' ? cashflow.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${propertyROI.toFixed(1)}%`}
                        size="small" 
                        sx={{
                          bgcolor: propertyROI >= 0 ? '#d4edda' : '#f8d7da',
                          color: propertyROI >= 0 ? '#155724' : '#721c24',
                          border: `1px solid ${propertyROI >= 0 ? '#c3e6cb' : '#f5c6cb'}`
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Projection Calculator */}
      <ProjectionCalculator />
    </Box>
  );
}

export default DashboardHome;