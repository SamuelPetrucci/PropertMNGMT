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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Build as BuildIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    return `http://${hostname}:5000`;
  }
};

export default function SimpleMaintenanceRequests() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [properties, setProperties] = useState([]);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
    propertyId: ''
  });

  useEffect(() => {
    fetchMaintenanceRequests();
    fetchProperties();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/maintenance-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceRequests(data);
      } else {
        setError('Failed to fetch maintenance requests');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      setError('Failed to load maintenance requests');
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleCreateRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/maintenance-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        const createdRequest = await response.json();
        setMaintenanceRequests(prev => [createdRequest, ...prev]);
        setCreateDialog(false);
        setNewRequest({
          title: '',
          description: '',
          priority: 'MEDIUM',
          category: 'GENERAL',
          propertyId: ''
        });
      } else {
        setError('Failed to create maintenance request');
      }
    } catch (err) {
      setError('Failed to create maintenance request');
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/maintenance-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setMaintenanceRequests(prev => 
          prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
        );
      } else {
        setError('Failed to update maintenance request');
      }
    } catch (err) {
      setError('Failed to update maintenance request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS': return 'info';
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
    return maintenanceRequests.filter(req => req.status === status).length;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading maintenance requests...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={fetchMaintenanceRequests} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Maintenance Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          New Request
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BuildIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{maintenanceRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4">{getStatusCount('OPEN')}</Typography>
                  <Typography variant="body2" color="text.secondary">Open Requests</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4">{getStatusCount('IN_PROGRESS')}</Typography>
                  <Typography variant="body2" color="text.secondary">In Progress</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{getStatusCount('COMPLETED')}</Typography>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requests Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>All Maintenance Requests</Typography>
        
        {maintenanceRequests.length === 0 ? (
          <Alert severity="info">
            No maintenance requests found. Create your first request to get started.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {request.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {properties.find(p => p.id === request.propertyId)?.name || 'Unknown Property'}
                    </TableCell>
                    <TableCell>
                      <Chip label={request.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        size="small"
                        color={getPriorityColor(request.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDetailsDialog(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {request.status !== 'COMPLETED' && (
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
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

      {/* Create Request Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Maintenance Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newRequest.title}
                onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={newRequest.propertyId}
                  label="Property"
                  onChange={(e) => setNewRequest(prev => ({ ...prev, propertyId: e.target.value }))}
                >
                  {properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newRequest.category}
                  label="Category"
                  onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value }))}
                >
                  <MenuItem value="ELECTRICAL">Electrical</MenuItem>
                  <MenuItem value="PLUMBING">Plumbing</MenuItem>
                  <MenuItem value="HVAC">HVAC</MenuItem>
                  <MenuItem value="PAINTING">Painting</MenuItem>
                  <MenuItem value="CLEANING">Cleaning</MenuItem>
                  <MenuItem value="GENERAL">General</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newRequest.priority}
                  label="Priority"
                  onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRequest} 
            variant="contained"
            disabled={!newRequest.title || !newRequest.description || !newRequest.propertyId}
          >
            Create Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Maintenance Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedRequest.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedRequest.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Property</Typography>
                <Typography variant="body1">
                  {properties.find(p => p.id === selectedRequest.propertyId)?.name || 'Unknown Property'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Chip label={selectedRequest.category} size="small" />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Chip 
                  label={selectedRequest.priority}
                  color={getPriorityColor(selectedRequest.priority)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedRequest.status}
                  color={getStatusColor(selectedRequest.status)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography variant="body1">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedRequest && selectedRequest.status !== 'COMPLETED' && (
            <Button 
              onClick={() => {
                handleUpdateStatus(selectedRequest.id, 'COMPLETED');
                setDetailsDialog(false);
              }}
              variant="contained"
              color="success"
            >
              Mark Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 