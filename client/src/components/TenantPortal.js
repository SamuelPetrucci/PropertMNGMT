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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import PaymentIcon from '@mui/icons-material/Payment';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    // For IP access, use the same hostname but port 5000
    return `http://${hostname}:5000`;
  }
};

export default function TenantPortal() {
  const [userInfo, setUserInfo] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newWorkOrderDialog, setNewWorkOrderDialog] = useState(false);
  const [newWorkOrder, setNewWorkOrder] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [userRes, workOrdersRes, paymentsRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/user-info`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/work-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/tenant-payments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const userData = await userRes.json();
      const workOrdersData = await workOrdersRes.json();
      const paymentsData = await paymentsRes.json();

      setUserInfo(userData);
      setWorkOrders(workOrdersData);
      setPayments(paymentsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newWorkOrder,
          propertyId: userInfo.property.id,
          unitNumber: userInfo.property.type === 'multi-family' ? userInfo.unitNumber : null
        })
      });

      if (res.ok) {
        const newOrder = await res.json();
        setWorkOrders(prev => [...prev, newOrder]);
        setNewWorkOrderDialog(false);
        setNewWorkOrder({ title: '', description: '', priority: 'medium' });
      }
    } catch (err) {
      setError('Failed to create work order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'warning';
      case 'ASSIGNED': return 'info';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.reload();
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!userInfo) return <Typography>No user info found</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', position: 'relative' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HomeIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Welcome, {userInfo.username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {userInfo.property?.name} - {userInfo.property?.address}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Sign Out
        </Button>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {workOrders.length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Work Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${typeof payments.reduce((sum, p) => sum + (p.amount || 0), 0) === 'number' ? payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${typeof userInfo.property?.rent === 'number' ? userInfo.property.rent.toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Monthly Rent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Work Orders Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Maintenance Requests
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewWorkOrderDialog(true)}
          >
            Submit Request
          </Button>
        </Stack>

        {workOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BuildIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No maintenance requests yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submit your first maintenance request to get started
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {order.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority}
                        size="small"
                        color={getPriorityColor(order.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={getStatusColor(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {order.assignedTo ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2">
                            {order.assignedTo.username}
                          </Typography>
                        </Stack>
                      ) : (
                        <Chip label="Unassigned" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            // TODO: Implement work order details view
                            alert(`Work Order #${order.id}\nTitle: ${order.title}\nStatus: ${order.status}\nPriority: ${order.priority}`);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Work Order Dialog */}
      <Dialog open={newWorkOrderDialog} onClose={() => setNewWorkOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Maintenance Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Request Title"
              placeholder="e.g., Leaky faucet in kitchen"
              value={newWorkOrder.title}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              placeholder="Please describe the issue in detail..."
              value={newWorkOrder.description}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={newWorkOrder.priority}
                onChange={(e) => setNewWorkOrder(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority Level"
              >
                <MenuItem value="LOW">Low - Minor cosmetic issues</MenuItem>
                <MenuItem value="MEDIUM">Medium - Functional issues</MenuItem>
                <MenuItem value="HIGH">High - Safety or comfort concerns</MenuItem>
                <MenuItem value="URGENT">Urgent - Emergency situations</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Priority Guidelines:</strong><br />
                • <strong>Low:</strong> Cosmetic issues, minor repairs<br />
                • <strong>Medium:</strong> Functional problems, non-urgent<br />
                • <strong>High:</strong> Safety concerns, major functionality<br />
                • <strong>Urgent:</strong> Emergencies, immediate attention needed
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewWorkOrderDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWorkOrder}
            variant="contained"
            disabled={!newWorkOrder.title || !newWorkOrder.description}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 