import * as React from 'react';
import { Box, Typography, Stack, Paper, Grid, Chip, Divider, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const handleBackClick = () => {
    navigate('/properties');
  };

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/properties', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const found = data.find((p) => String(p.id) === String(id));
        setProperty(found);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography variant="h6">Loading property details...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography color="error" variant="h6">{error}</Typography>
    </Box>
  );
  
  if (!property) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography variant="h6">Property not found.</Typography>
    </Box>
  );

  // Calculate financial metrics
  const totalRent = property.type === 'single-family'
    ? property.rent
    : (property.units || []).reduce((sum, u) => sum + (u.rent || 0), 0);
  
  const monthlyMortgagePayment = property.mortgage?.monthlyPayment || 0;
  const monthlyCashflow = totalRent - monthlyMortgagePayment;
  const monthlyMiscExpenses = (property.miscExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthlyCashflowAfterMisc = monthlyCashflow - monthlyMiscExpenses;
  
  // Calculate property taxes
  const annualPropertyTaxes = property.valuation && property.taxRate 
    ? (property.valuation * (parseFloat(property.taxRate) / 100))
    : 0;
  const monthlyPropertyTaxes = annualPropertyTaxes / 12;
  const monthlyCashflowAfterTaxes = monthlyCashflowAfterMisc - monthlyPropertyTaxes;
  
  const annualCashflow = monthlyCashflow * 12;
  const annualRent = totalRent * 12;
  const annualMortgage = monthlyMortgagePayment * 12;
  const annualMiscExpenses = monthlyMiscExpenses * 12;
  const annualNetCashflow = annualRent - annualMortgage - annualMiscExpenses - annualPropertyTaxes;
  const cashOnCashReturn = property.valuation ? (annualCashflow / property.valuation * 100) : null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', position: 'relative' }}>
        {/* Back Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{
            position: 'absolute',
            top: -8,
            left: 16,
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
            zIndex: 2
          }}
        >
          Back to Properties
        </Button>
        
        <Stack direction="row" alignItems="center" spacing={2} mb={2} sx={{ pl: 12 }}>
          <HomeIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {property.name}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOnIcon fontSize="small" />
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {property.address}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ pl: 12 }}>
          <Chip 
            icon={<ApartmentIcon />} 
            label={property.type === 'single-family' ? 'Single Family' : 'Multi Family'} 
            sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Chip 
            icon={<PersonIcon />} 
            label={`Owner: ${property.owner}`} 
            sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Stack>
      </Paper>

      {/* Financial Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
            <AttachMoneyIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof totalRent === 'number' ? `$${totalRent.toLocaleString()}` : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Monthly Income</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <AccountBalanceIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof monthlyMortgagePayment === 'number' ? `$${monthlyMortgagePayment.toLocaleString()}` : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Monthly Mortgage</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <ReceiptLongIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof monthlyMiscExpenses === 'number' ? monthlyMiscExpenses.toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Monthly Misc</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', color: 'white' }}>
            <AccountBalanceIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof monthlyPropertyTaxes === 'number' ? monthlyPropertyTaxes.toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Monthly Taxes</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: monthlyCashflow >= 0 ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof monthlyCashflow === 'number' ? `$${monthlyCashflow.toLocaleString()}` : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Net Cashflow</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', background: monthlyCashflowAfterTaxes >= 0 ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof monthlyCashflowAfterTaxes === 'number' ? monthlyCashflowAfterTaxes.toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">Net After Taxes</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Property Details and Financial Analysis */}
      <Grid container spacing={3}>
        {/* Property Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon /> Property Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {property.type === 'single-family' ? (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>Single Family Home</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Monthly Rent:</strong> {typeof property.rent === 'number' ? `$${property.rent.toLocaleString()}` : 'Not set'}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>Multi-Family Property</Typography>
                <Typography variant="subtitle1" gutterBottom>Units:</Typography>
                <Stack spacing={1}>
                  {(property.units || []).map((unit, idx) => (
                    <Paper key={idx} elevation={1} sx={{ p: 2, background: '#f5f5f5' }}>
                      <Typography variant="subtitle2" color="primary">
                        Unit {unit.unitNumber}
                      </Typography>
                      <Typography variant="body2">
                        Rent: {typeof unit.rent === 'number' ? `$${unit.rent.toLocaleString()}` : 'Not set'}
                      </Typography>
                      {unit.tenant && (
                        <Typography variant="body2" color="text.secondary">
                          Tenant: {unit.tenant}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Financial Analysis */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon /> Financial Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" color="primary" gutterBottom>Annual Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Annual Rent</Typography>
                    <Typography variant="h6">${typeof annualRent === 'number' ? annualRent.toLocaleString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Annual Mortgage</Typography>
                    <Typography variant="h6">${typeof annualMortgage === 'number' ? annualMortgage.toLocaleString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Annual Property Taxes</Typography>
                    <Typography variant="h6" color="error.main">${typeof annualPropertyTaxes === 'number' ? annualPropertyTaxes.toLocaleString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Annual Cashflow</Typography>
                    <Typography variant="h6" color={annualNetCashflow >= 0 ? 'success.main' : 'error.main'}>
                      ${typeof annualNetCashflow === 'number' ? annualNetCashflow.toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                  {cashOnCashReturn !== null && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Cash-on-Cash Return</Typography>
                      <Typography variant="h6" color="primary">
                        {cashOnCashReturn.toFixed(2)}%
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Mortgage Details */}
        {property.mortgage && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon /> Mortgage Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Principal Remaining</Typography>
                  <Typography variant="h6">${typeof property.mortgage?.amount === 'number' ? Number(property.mortgage.amount).toLocaleString() : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Monthly Payment</Typography>
                  <Typography variant="h6">${typeof property.mortgage?.monthlyPayment === 'number' ? Number(property.mortgage.monthlyPayment).toLocaleString() : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
                  <Typography variant="h6">{property.mortgage.rate}%</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Term</Typography>
                  <Typography variant="h6">{property.mortgage.term} years</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Lender</Typography>
                  <Typography variant="h6">{property.mortgage.lender}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="h6">{property.mortgage.startDate}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Miscellaneous Expenses */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyIcon /> Miscellaneous Expenses
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {property.miscExpenses && property.miscExpenses.length > 0 ? (
              <Box>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="primary" gutterBottom>Monthly Expenses Breakdown</Typography>
                    <Stack spacing={2}>
                      {property.miscExpenses.map((expense, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {expense.label}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${typeof expense.amount === 'number' ? Number(expense.amount).toLocaleString() : 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="primary" gutterBottom>Financial Impact</Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body1">Total Monthly Rent</Typography>
                        <Typography variant="h6" color="success.main">
                          ${typeof totalRent === 'number' ? totalRent.toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="body1">Monthly Mortgage</Typography>
                        <Typography variant="h6" color="warning.main">
                          -${typeof monthlyMortgagePayment === 'number' ? monthlyMortgagePayment.toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                        <Typography variant="body1">Monthly Misc Expenses</Typography>
                        <Typography variant="h6" color="error.main">
                          -${typeof property.miscExpenses === 'object' ? (property.miscExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fce4ec', borderRadius: 1 }}>
                        <Typography variant="body1">Monthly Property Taxes</Typography>
                        <Typography variant="h6" color="error.main">
                          -${typeof monthlyPropertyTaxes === 'number' ? monthlyPropertyTaxes.toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: monthlyCashflowAfterTaxes >= 0 ? '#e8f5e9' : '#ffebee', borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Net Cashflow After Taxes</Typography>
                        <Typography variant="h5" color={monthlyCashflowAfterTaxes >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
                          ${typeof monthlyCashflowAfterTaxes === 'number' ? monthlyCashflowAfterTaxes.toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  * Miscellaneous expenses are recurring monthly costs that impact your property's cashflow.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No miscellaneous expenses configured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add expenses like insurance, maintenance, utilities, and other recurring costs to get a complete financial picture.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PropertyDetails; 