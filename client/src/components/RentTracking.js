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
  Collapse
} from '@mui/material';
import {
  Info as InfoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

export default function RentTracking() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch('/api/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setTenants(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not fetch tenants');
        setLoading(false);
      });
  }, []);

  // Add/Edit dialog stubs
  const handleOpenAddDialog = () => setAddDialogOpen(true);
  const handleCloseAddDialog = () => setAddDialogOpen(false);

  function getPaymentHistoryTooltip(payments) {
    if (!payments || payments.length === 0) return 'No payment history';
    return payments.map(p => `${p.dueDate}: ${p.paid ? 'Paid' : 'Unpaid'}`).join('\n');
  }

  const handleTogglePayment = (tenant, paymentIdx) => {
    const propertyId = tenant.propertyId;
    const unitNumber = tenant.type === 'single-family' ? 'single' : tenant.unitNumber;
    // Generate all months and merge with backend payments
    const months = generateMonthList(tenant.leaseStart, tenant.leaseEnd);
    const mergedPayments = mergePaymentsWithMonths(months, tenant.payments);
    // Toggle the selected payment
    const updatedPayments = mergedPayments.map((p, idx) =>
      idx === paymentIdx
        ? {
            ...p,
            paid: !p.paid,
            paidDate: !p.paid ? new Date().toISOString().slice(0, 10) : undefined
          }
        : p
    );
    fetch(`/api/properties/${propertyId}/tenants/${unitNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payments: updatedPayments }),
    })
      .then(res => res.json())
      .then(() => {
        setTenants(ts => ts.map(t =>
          t.propertyId === propertyId && (t.unitNumber === tenant.unitNumber || (t.type === 'single-family' && t.type === tenant.type))
            ? { ...t, payments: updatedPayments }
            : t
        ));
      });
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Rent Tracking</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenAddDialog}>Add Tenant</Button>
      {loading && <Typography>Loading tenants...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>History</TableCell>
              <TableCell>Tenant Name</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Rent</TableCell>
              <TableCell>Lease Start</TableCell>
              <TableCell>Lease End</TableCell>
              <TableCell>Current Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant, idx) => {
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
                    <TableCell>{tenant.tenant || <i>No tenant</i>}</TableCell>
                    <TableCell>{tenant.propertyName}</TableCell>
                    <TableCell>{tenant.unitNumber || '-'}</TableCell>
                    <TableCell>${tenant.rent}</TableCell>
                    <TableCell>{tenant.leaseStart || '-'}</TableCell>
                    <TableCell>{tenant.leaseEnd || '-'}</TableCell>
                    <TableCell>{currentDueDate || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={currentPaid ? 'PAID' : (currentDueDate && new Date(currentDueDate) < new Date() ? 'OVERDUE' : 'DUE')}
                        color={currentPaid ? 'success' : (currentDueDate && new Date(currentDueDate) < new Date() ? 'error' : 'warning')}
                      />
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
      {/* Add/Edit Tenant Dialog (UI stub) */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog}>
        <DialogTitle>Add Tenant (Coming Soon)</DialogTitle>
        <DialogContent>
          <TextField label="Tenant Name" fullWidth margin="normal" disabled />
          <TextField label="Property" fullWidth margin="normal" disabled />
          <TextField label="Unit" fullWidth margin="normal" disabled />
          <TextField label="Rent" fullWidth margin="normal" disabled />
          <TextField label="Due Date" fullWidth margin="normal" disabled />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button variant="contained" disabled>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 