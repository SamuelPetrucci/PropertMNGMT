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
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  ListItemAvatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateIcon from '@mui/icons-material/Update';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    // For IP access, use the same hostname but port 5000
    return `http://${hostname}:5000`;
  }
};

export default function ContractorPortal() {
  const [userInfo, setUserInfo] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [userRes, workOrdersRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/user-info`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/work-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const userData = await userRes.json();
      const workOrdersData = await workOrdersRes.json();

      setUserInfo(userData);
      setWorkOrders(workOrdersData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleUpdateWorkOrder = async (workOrderId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setWorkOrders(prev => prev.map(wo => wo.id === updatedOrder.id ? updatedOrder : wo));
        if (selectedWorkOrder && selectedWorkOrder.id === workOrderId) {
          setUpdateDialog(false);
          setSelectedWorkOrder(null);
          setUpdateData({ status: '', notes: '' });
        }
      }
    } catch (err) {
      setError('Failed to update work order');
    }
  };

  const openUpdateDialog = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setUpdateData({ status: workOrder.status, notes: '' });
    setUpdateDialog(true);
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

  const getStatusCount = (status) => {
    return workOrders.filter(wo => wo.status === status).length;
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
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', position: 'relative' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <BuildIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Welcome, {userInfo.username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Contractor Dashboard
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
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('ASSIGNED')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <UpdateIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('IN_PROGRESS')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('COMPLETED')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {workOrders.length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Work Orders Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Assigned Work Orders
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUserData}
          >
            Refresh
          </Button>
        </Stack>

        {workOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No work orders assigned yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Work orders will appear here once they are assigned to you
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
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
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <HomeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {order.property.name}
                          {order.unit && ` - Unit ${order.unit.unitNumber}`}
                        </Typography>
                      </Stack>
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
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {order.createdBy.username}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openUpdateDialog(order)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {order.status === 'ASSIGNED' && (
                          <Tooltip title="Start Work">
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateWorkOrder(order.id, 'IN_PROGRESS', 'Started working on this request')}
                              color="primary"
                            >
                              <UpdateIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <Tooltip title="Mark as Completed">
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateWorkOrder(order.id, 'COMPLETED', 'Work completed successfully')}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Update Work Order Dialog */}
      {selectedWorkOrder && (
        <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Work Order Details - #{selectedWorkOrder.id}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{selectedWorkOrder.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedWorkOrder.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Chip
                      label={selectedWorkOrder.priority}
                      color={getPriorityColor(selectedWorkOrder.priority)}
                    />
                    <Chip
                      label={selectedWorkOrder.status}
                      color={getStatusColor(selectedWorkOrder.status)}
                    />
                  </Stack>
                </Grid>
              </Grid>
              
              <Divider />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Property</Typography>
                  <Typography variant="body1">
                    {selectedWorkOrder.property.name}
                    {selectedWorkOrder.unit && ` - Unit ${selectedWorkOrder.unit.unitNumber}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{selectedWorkOrder.createdBy.username}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedWorkOrder.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1">
                    {new Date(selectedWorkOrder.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {selectedWorkOrder.notes && selectedWorkOrder.notes.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Notes & Updates</Typography>
                    <List>
                      {selectedWorkOrder.notes.map((note, index) => (
                        <React.Fragment key={note.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <PersonIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={note.author.username}
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" color="text.primary">
                                    {note.text}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(note.timestamp).toLocaleString()}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                          {index < selectedWorkOrder.notes.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                </>
              )}

              <Divider />
              
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Update Status</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={updateData.status}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                        label="Status"
                      >
                        <MenuItem value="ASSIGNED">Assigned</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Add Note (Optional)"
                      multiline
                      rows={3}
                      placeholder="Add a note about the current status or any updates..."
                      value={updateData.notes}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => handleUpdateWorkOrder(selectedWorkOrder.id, updateData.status, updateData.notes)}
              variant="contained"
              disabled={!updateData.status}
            >
              Update Work Order
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
} 