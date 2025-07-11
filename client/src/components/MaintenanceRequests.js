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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Avatar,
  ListItemAvatar
} from '@mui/material';
import {
  Build as BuildIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Update as UpdateIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  PriorityHigh as PriorityHighIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

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

export default function MaintenanceRequests() {
  const [workOrders, setWorkOrders] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [newWorkOrder, setNewWorkOrder] = useState({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const [workOrdersRes, contractorsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/work-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/contractors`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/properties`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const workOrdersData = await workOrdersRes.json();
      const contractorsData = await contractorsRes.json();
      const propertiesData = await propertiesRes.json();

      setWorkOrders(workOrdersData);
      setContractors(contractorsData);
      setProperties(propertiesData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWorkOrder)
      });

      if (res.ok) {
        const createdOrder = await res.json();
        setWorkOrders(prev => [createdOrder, ...prev]);
        setCreateDialog(false);
        setNewWorkOrder({
          propertyId: '',
          unitId: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignedToId: ''
        });
      }
    } catch (err) {
      setError('Failed to create work order');
    }
  };

  const handleAssignWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/work-orders/${selectedWorkOrder.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedToId: newWorkOrder.assignedToId,
          notes: newWorkOrder.description
        })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setWorkOrders(prev => prev.map(wo => wo.id === updatedOrder.id ? updatedOrder : wo));
        setAssignDialog(false);
        setSelectedWorkOrder(null);
        setNewWorkOrder({
          propertyId: '',
          unitId: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignedToId: ''
        });
      }
    } catch (err) {
      setError('Failed to assign work order');
    }
  };

  const handleUpdateStatus = async (workOrderId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/work-orders/${workOrderId}`, {
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
      }
    } catch (err) {
      setError('Failed to update work order');
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

  const getStatusCount = (status) => {
    return workOrders.filter(wo => wo.status === status).length;
  };

  const getFilteredWorkOrders = () => {
    let filtered = workOrders;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(wo => wo.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(wo => wo.priority === filterPriority);
    }

    if (filterProperty !== 'all') {
      filtered = filtered.filter(wo => wo.propertyId === parseInt(filterProperty));
    }

    return filtered;
  };

  const openAssignDialog = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setNewWorkOrder({
      ...newWorkOrder,
      assignedToId: workOrder.assignedToId || '',
      description: ''
    });
    setAssignDialog(true);
  };

  const openDetailsDialog = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setDetailsDialog(true);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const filteredWorkOrders = getFilteredWorkOrders();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <BuildIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Maintenance Requests
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Manage work orders across all properties
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            Create Work Order
          </Button>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('OPEN')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Open
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <UpdateIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('ASSIGNED')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getStatusCount('IN_PROGRESS')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
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
        <Grid item xs={12} md={2}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PriorityHighIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {workOrders.filter(wo => wo.priority === 'URGENT').length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Urgent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {workOrders.length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Property</InputLabel>
              <Select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                label="Property"
              >
                <MenuItem value="all">All Properties</MenuItem>
                {properties.map(property => (
                  <MenuItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Work Orders Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id} hover>
                  <TableCell>#{workOrder.id}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {workOrder.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {workOrder.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <HomeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2">
                        {workOrder.property.name}
                        {workOrder.unit && ` - Unit ${workOrder.unit.unitNumber}`}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2">
                        {workOrder.createdBy.username}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {workOrder.assignedTo ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {workOrder.assignedTo.username}
                        </Typography>
                      </Stack>
                    ) : (
                      <Chip label="Unassigned" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workOrder.priority}
                      size="small"
                      color={getPriorityColor(workOrder.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workOrder.status}
                      size="small"
                      color={getStatusColor(workOrder.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(workOrder.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => openDetailsDialog(workOrder)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {workOrder.status === 'OPEN' && (
                        <Tooltip title="Assign to Contractor">
                          <IconButton
                            size="small"
                            onClick={() => openAssignDialog(workOrder)}
                            color="info"
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
                        <Tooltip title="Mark as Completed">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(workOrder.id, 'COMPLETED')}
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
      </Paper>

      {/* Create Work Order Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Work Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={newWorkOrder.propertyId}
                  onChange={(e) => setNewWorkOrder(prev => ({ ...prev, propertyId: e.target.value }))}
                  label="Property"
                >
                  {properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit (Optional)</InputLabel>
                <Select
                  value={newWorkOrder.unitId}
                  onChange={(e) => setNewWorkOrder(prev => ({ ...prev, unitId: e.target.value }))}
                  label="Unit (Optional)"
                >
                  <MenuItem value="">No Unit</MenuItem>
                  {properties
                    .find(p => p.id === parseInt(newWorkOrder.propertyId))
                    ?.units?.map(unit => (
                      <MenuItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newWorkOrder.title}
                onChange={(e) => setNewWorkOrder(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newWorkOrder.description}
                onChange={(e) => setNewWorkOrder(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newWorkOrder.priority}
                  onChange={(e) => setNewWorkOrder(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assign to Contractor (Optional)</InputLabel>
                <Select
                  value={newWorkOrder.assignedToId}
                  onChange={(e) => setNewWorkOrder(prev => ({ ...prev, assignedToId: e.target.value }))}
                  label="Assign to Contractor (Optional)"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {contractors.map(contractor => (
                    <MenuItem key={contractor.id} value={contractor.id}>
                      {contractor.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWorkOrder}
            variant="contained"
            disabled={!newWorkOrder.title || !newWorkOrder.description || !newWorkOrder.propertyId}
          >
            Create Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Work Order Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Work Order to Contractor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {selectedWorkOrder?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedWorkOrder?.description}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Contractor</InputLabel>
              <Select
                value={newWorkOrder.assignedToId}
                onChange={(e) => setNewWorkOrder(prev => ({ ...prev, assignedToId: e.target.value }))}
                label="Select Contractor"
              >
                <MenuItem value="">Unassign</MenuItem>
                {contractors.map(contractor => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Assignment Notes (Optional)"
              multiline
              rows={3}
              value={newWorkOrder.description}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, description: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignWorkOrder}
            variant="contained"
            disabled={!newWorkOrder.assignedToId}
          >
            Assign Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Order Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Work Order Details - #{selectedWorkOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedWorkOrder && (
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
                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1">
                    {selectedWorkOrder.assignedTo ? selectedWorkOrder.assignedTo.username : 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedWorkOrder.createdAt).toLocaleString()}
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
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 