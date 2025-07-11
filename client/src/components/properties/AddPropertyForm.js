import * as React from 'react';
import { Box, TextField, Typography, Stack, Button } from '@mui/material';

function AddPropertyForm({ onPropertyAdded, onCancel, initialData, isEdit }) {
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [type, setType] = React.useState('single-family');
  const [rent, setRent] = React.useState('');
  const [units, setUnits] = React.useState([{ unitNumber: '', rent: '' }]);
  const [mortgage, setMortgage] = React.useState({ amount: '', monthlyPayment: '', lender: '', rate: '', term: '', startDate: '' });
  const [valuation, setValuation] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [miscExpenses, setMiscExpenses] = React.useState([]);
  const [taxRate, setTaxRate] = React.useState('');

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

  const handleUnitChange = (idx, field, value) => {
    setUnits(units => units.map((u, i) => i === idx ? { ...u, [field]: value } : u));
  };
  const addUnit = () => setUnits([...units, { unitNumber: '', rent: '' }]);
  const removeUnit = idx => setUnits(units => units.filter((_, i) => i !== idx));

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setType(initialData.type || 'single-family');
      setRent(initialData.rent || '');
      setUnits(initialData.units && initialData.units.length > 0 ? initialData.units.map(u => ({ unitNumber: u.unitNumber || '', rent: u.rent || '' })) : [{ unitNumber: '', rent: '' }]);
      setMortgage(initialData.mortgage || { amount: '', monthlyPayment: '', lender: '', rate: '', term: '', startDate: '' });
      setValuation(initialData.valuation || '');
      setMiscExpenses(initialData.miscExpenses || []);
      setTaxRate(initialData.taxRate || '');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        name,
        address,
        type,
        mortgage,
        valuation: valuation !== '' ? Number(valuation) : null,
        taxRate,
        miscExpenses: miscExpenses.map(e => ({ label: e.label === 'Other' ? e.customLabel || 'Other' : e.label, amount: e.amount })),
        ...(type === 'single-family'
          ? {
              rent: rent !== '' ? Number(rent) : '',
            }
          : {
              units: units.map(u => ({
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
        setName('');
        setAddress('');
        setType('single-family');
        setRent('');
        setUnits([{ unitNumber: '', rent: '' }]);
        setMortgage({ amount: '', monthlyPayment: '', lender: '', rate: '', term: '', startDate: '' });
        setValuation('');
      }
      onPropertyAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => setMiscExpenses(exp => [...exp, { label: '', amount: '' }]);
  const handleRemoveExpense = idx => setMiscExpenses(exp => exp.filter((_, i) => i !== idx));
  const handleExpenseChange = (idx, field, value) => setMiscExpenses(exp => exp.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  return (
    <Box component="form" onSubmit={handleSubmit} mt={1} display="flex" flexDirection="column" gap={2}>
      <Stack direction="row" spacing={2}>
        <TextField label="Property Name" value={name} onChange={e => setName(e.target.value)} required size="small" />
        <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} required size="small" />
        <TextField
          select
          label="Type"
          value={type}
          onChange={e => setType(e.target.value)}
          SelectProps={{ native: true }}
          size="small"
        >
          <option value="single-family">Single Family</option>
          <option value="multi-family">Multi Family</option>
        </TextField>
        <TextField
          label="Estimated Valuation"
          value={valuation}
          onChange={e => setValuation(e.target.value)}
          type="number"
          size="small"
          InputProps={{ inputProps: { min: 0, step: 1000 } }}
          helperText="Estimated current market value"
        />
      </Stack>
      {type === 'single-family' ? (
        <TextField
          label="Rent"
          value={rent}
          onChange={e => setRent(e.target.value)}
          type="number"
          required={!isEdit}
          size="small"
        />
      ) :
        <Box>
          <Typography variant="subtitle2">Units</Typography>
          {units.map((unit, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
              <TextField label="Unit #" value={unit.unitNumber} onChange={e => handleUnitChange(idx, 'unitNumber', e.target.value)} size="small" required />
              <TextField label="Rent" value={unit.rent} onChange={e => handleUnitChange(idx, 'rent', e.target.value)} type="number" size="small" required />
              <Button onClick={() => removeUnit(idx)} disabled={units.length === 1}>Remove</Button>
            </Stack>
          ))}
          <Button onClick={addUnit}>Add Unit</Button>
        </Box>
      }
      <Box>
        <Typography variant="subtitle2">Mortgage Details</Typography>
        <Stack direction="row" spacing={2}>
          <TextField label="Principal Remaining" value={mortgage.amount} onChange={e => setMortgage(m => ({ ...m, amount: e.target.value }))} type="number" size="small" helperText="Principal left on the loan" />
          <TextField label="Monthly Payment" value={mortgage.monthlyPayment} onChange={e => setMortgage(m => ({ ...m, monthlyPayment: e.target.value }))} type="number" size="small" />
          <TextField label="Lender" value={mortgage.lender} onChange={e => setMortgage(m => ({ ...m, lender: e.target.value }))} size="small" />
          <TextField label="Rate (%)" value={mortgage.rate} onChange={e => setMortgage(m => ({ ...m, rate: e.target.value }))} type="number" size="small" />
          <TextField label="Term (years)" value={mortgage.term} onChange={e => setMortgage(m => ({ ...m, term: e.target.value }))} type="number" size="small" />
          <TextField label="Start Date" value={mortgage.startDate} onChange={e => setMortgage(m => ({ ...m, startDate: e.target.value }))} type="date" size="small" InputLabelProps={{ shrink: true }} />
        </Stack>
      </Box>
      <Box>
        <Typography variant="subtitle2">Miscellaneous Expenses</Typography>
        {miscExpenses.map((expense, idx) => (
          <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
            <TextField
              select
              label="Label"
              value={expense.label}
              onChange={e => handleExpenseChange(idx, 'label', e.target.value)}
              size="small"
              required
              sx={{ minWidth: 120 }}
              SelectProps={{ native: true }}
            >
              <option value="" disabled>Select</option>
              {miscExpenseOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </TextField>
            {expense.label === 'Other' && (
              <TextField
                label="Custom Label"
                value={expense.customLabel || ''}
                onChange={e => handleExpenseChange(idx, 'customLabel', e.target.value)}
                size="small"
                required
                sx={{ minWidth: 120 }}
              />
            )}
            <TextField label="Amount" value={expense.amount} onChange={e => handleExpenseChange(idx, 'amount', e.target.value)} type="number" size="small" InputProps={{ startAdornment: '$' }} required sx={{ maxWidth: 120 }} />
            <Button onClick={() => handleRemoveExpense(idx)} color="error" size="small" disabled={miscExpenses.length === 1}>Remove</Button>
          </Stack>
        ))}
        <Button onClick={handleAddExpense} size="small" sx={{ mt: 1 }}>Add Expense</Button>
      </Box>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Property Tax Rate (%)"
          value={taxRate}
          onChange={e => setTaxRate(e.target.value)}
          type="number"
          size="small"
          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          helperText="Annual property tax rate as a percentage (e.g., 1.25)"
          required={!isEdit}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Property' : 'Save Property')}
        </Button>
        <Button onClick={onCancel} variant="outlined" disabled={loading}>Cancel</Button>
      </Stack>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}

export default AddPropertyForm; 