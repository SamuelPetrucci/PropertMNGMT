import * as React from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Stack, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  PersonAdd as PersonAddIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

function AddPropertyForm({ onPropertyAdded, onCancel, initialData, isEdit }) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  // Form data
  const [propertyForm, setPropertyForm] = React.useState({
    // Step 1: Basic Information
    name: '',
    address: '',
    type: 'single-family',
    valuation: '',
    
    // Step 2: Rental Information
    rent: '',
    units: [{ unitNumber: '', rent: '' }],
    
    // Step 3: Mortgage Details
    mortgage: {
      amount: '',
      monthlyPayment: '',
      lender: '',
      rate: '',
      term: '',
      startDate: ''
    },
    
    // Step 4: Additional Details
    taxRate: '',
    miscExpenses: []
  });

  const steps = [
    'Basic Information',
    'Rental Information', 
    'Mortgage Details',
    'Additional Details'
  ];

  const miscExpenseOptions = [
    'Insurance',
    'Maintenance',
    'Water',
    'HOA',
    'Pest Control',
    'Security',
    'Landscaping',
    'Trash',
    'Other',
  ];

  React.useEffect(() => {
    if (initialData) {
      setPropertyForm({
        name: initialData.name || '',
        address: initialData.address || '',
        type: initialData.type || 'single-family',
        valuation: initialData.valuation || '',
        rent: initialData.rent || '',
        units: initialData.units && initialData.units.length > 0 
          ? initialData.units.map(u => ({ unitNumber: u.unitNumber || '', rent: u.rent || '' }))
          : [{ unitNumber: '', rent: '' }],
        mortgage: initialData.mortgage || { amount: '', monthlyPayment: '', lender: '', rate: '', term: '', startDate: '' },
        taxRate: initialData.taxRate || '',
        miscExpenses: initialData.miscExpenses || []
      });
    }
  }, [initialData]);

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      if (!propertyForm.name || !propertyForm.address) {
        setError('Please fill in all required fields: Property Name and Address');
        return;
      }
    } else if (activeStep === 1) {
      if (propertyForm.type === 'single-family' && !propertyForm.rent) {
        setError('Please enter the rent amount for single-family properties');
        return;
      }
      if (propertyForm.type === 'multi-family') {
        const hasValidUnits = propertyForm.units.every(unit => unit.unitNumber && unit.rent);
        if (!hasValidUnits) {
          setError('Please fill in all unit numbers and rent amounts');
          return;
        }
      }
    }
    
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setPropertyForm({
      name: '',
      address: '',
      type: 'single-family',
      valuation: '',
      rent: '',
      units: [{ unitNumber: '', rent: '' }],
      mortgage: { amount: '', monthlyPayment: '', lender: '', rate: '', term: '', startDate: '' },
      taxRate: '',
      miscExpenses: []
    });
  };

  const handleUnitChange = (idx, field, value) => {
    setPropertyForm(prev => ({
      ...prev,
      units: prev.units.map((u, i) => i === idx ? { ...u, [field]: value } : u)
    }));
  };

  const addUnit = () => {
    setPropertyForm(prev => ({
      ...prev,
      units: [...prev.units, { unitNumber: '', rent: '' }]
    }));
  };

  const removeUnit = idx => {
    setPropertyForm(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== idx)
    }));
  };

  const handleAddExpense = () => {
    setPropertyForm(prev => ({
      ...prev,
      miscExpenses: [...prev.miscExpenses, { label: '', amount: '' }]
    }));
  };

  const handleRemoveExpense = idx => {
    setPropertyForm(prev => ({
      ...prev,
      miscExpenses: prev.miscExpenses.filter((_, i) => i !== idx)
    }));
  };

  const handleExpenseChange = (idx, field, value) => {
    setPropertyForm(prev => ({
      ...prev,
      miscExpenses: prev.miscExpenses.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const body = {
        name: propertyForm.name,
        address: propertyForm.address,
        type: propertyForm.type,
        mortgage: propertyForm.mortgage,
        valuation: propertyForm.valuation !== '' ? Number(propertyForm.valuation) : null,
        taxRate: propertyForm.taxRate,
        miscExpenses: propertyForm.miscExpenses.map(e => ({ 
          label: e.label === 'Other' ? e.customLabel || 'Other' : e.label, 
          amount: e.amount 
        })),
        ...(propertyForm.type === 'single-family'
          ? {
              rent: propertyForm.rent !== '' ? Number(propertyForm.rent) : '',
            }
          : {
              units: propertyForm.units.map(u => ({
                unitNumber: u.unitNumber,
                rent: u.rent !== '' ? Number(u.rent) : '',
              })),
            }),
      };

      const token = localStorage.getItem('token');
      let res;
      if (isEdit && initialData) {
        res = await fetch(`/api/properties/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save property');
      }

      if (!isEdit) {
        handleReset();
      }
      
      onPropertyAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HomeIcon />
          <Typography variant="h6">{isEdit ? 'Edit Property' : 'Add New Property'}</Typography>
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
                      label="Property Name *"
                      value={propertyForm.name}
                      onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Address *"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                      fullWidth
                      required
                    />
                    <FormControl fullWidth required>
                      <InputLabel>Property Type *</InputLabel>
                      <Select
                        value={propertyForm.type}
                        onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value})}
                        label="Property Type *"
                      >
                        <MenuItem value="single-family">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <HomeIcon fontSize="small" />
                            <Typography>Single Family</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="multi-family">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <BusinessIcon fontSize="small" />
                            <Typography>Multi Family</Typography>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Estimated Valuation"
                      value={propertyForm.valuation}
                      onChange={(e) => setPropertyForm({...propertyForm, valuation: e.target.value})}
                      type="number"
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      helperText="Estimated current market value"
                    />
                  </Stack>
                )}
                
                {index === 1 && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {propertyForm.type === 'single-family' ? (
                      <TextField
                        label="Monthly Rent *"
                        value={propertyForm.rent}
                        onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})}
                        type="number"
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        helperText="Monthly rent for this single-family property"
                      />
                    ) : (
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Multi-Family Units
                        </Typography>
                        {propertyForm.units.map((unit, idx) => (
                          <Card key={idx} sx={{ mb: 2, p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <TextField
                                label="Unit Number *"
                                value={unit.unitNumber}
                                onChange={(e) => handleUnitChange(idx, 'unitNumber', e.target.value)}
                                size="small"
                                required
                                sx={{ flexGrow: 1 }}
                              />
                              <TextField
                                label="Monthly Rent *"
                                value={unit.rent}
                                onChange={(e) => handleUnitChange(idx, 'rent', e.target.value)}
                                type="number"
                                size="small"
                                required
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ flexGrow: 1 }}
                              />
                              <IconButton
                                onClick={() => removeUnit(idx)}
                                disabled={propertyForm.units.length === 1}
                                color="error"
                                size="small"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Stack>
                          </Card>
                        ))}
                        <Button
                          startIcon={<AddIcon />}
                          onClick={addUnit}
                          variant="outlined"
                          size="small"
                        >
                          Add Unit
                        </Button>
                      </Box>
                    )}
                  </Stack>
                )}
                
                {index === 2 && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      <BankIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Mortgage Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Principal Remaining"
                          value={propertyForm.mortgage.amount}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, amount: e.target.value}
                          })}
                          type="number"
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          helperText="Principal left on the loan"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Monthly Payment"
                          value={propertyForm.mortgage.monthlyPayment}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, monthlyPayment: e.target.value}
                          })}
                          type="number"
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Lender"
                          value={propertyForm.mortgage.lender}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, lender: e.target.value}
                          })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Interest Rate (%)"
                          value={propertyForm.mortgage.rate}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, rate: e.target.value}
                          })}
                          type="number"
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Term (years)"
                          value={propertyForm.mortgage.term}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, term: e.target.value}
                          })}
                          type="number"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Start Date"
                          value={propertyForm.mortgage.startDate}
                          onChange={(e) => setPropertyForm({
                            ...propertyForm, 
                            mortgage: {...propertyForm.mortgage, startDate: e.target.value}
                          })}
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                )}
                
                {index === 3 && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Additional Details
                    </Typography>
                    
                    <TextField
                      label="Property Tax Rate"
                      value={propertyForm.taxRate}
                      onChange={(e) => setPropertyForm({...propertyForm, taxRate: e.target.value})}
                      fullWidth
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      helperText="Annual property tax rate"
                    />
                    
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Miscellaneous Expenses
                      </Typography>
                      {propertyForm.miscExpenses.map((expense, idx) => (
                        <Card key={idx} sx={{ mb: 2, p: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Expense Type</InputLabel>
                              <Select
                                value={expense.label}
                                onChange={(e) => handleExpenseChange(idx, 'label', e.target.value)}
                                label="Expense Type"
                              >
                                {miscExpenseOptions.map(opt => (
                                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {expense.label === 'Other' && (
                              <TextField
                                label="Custom Label"
                                value={expense.customLabel || ''}
                                onChange={(e) => handleExpenseChange(idx, 'customLabel', e.target.value)}
                                size="small"
                                sx={{ flexGrow: 1 }}
                              />
                            )}
                            <TextField
                              label="Monthly Amount"
                              value={expense.amount}
                              onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)}
                              type="number"
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              sx={{ flexGrow: 1 }}
                            />
                            <IconButton
                              onClick={() => handleRemoveExpense(idx)}
                              color="error"
                              size="small"
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Stack>
                        </Card>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddExpense}
                        variant="outlined"
                        size="small"
                      >
                        Add Expense
                      </Button>
                    </Box>
                  </Stack>
                )}
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    {index === steps.length - 1 ? (isEdit ? 'Update Property' : 'Create Property') : 'Continue'}
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
  );
}

export default AddPropertyForm; 