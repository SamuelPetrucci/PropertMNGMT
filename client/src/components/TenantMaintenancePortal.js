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
  ListItemAvatar,
  LinearProgress,
  Badge,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  AlertTitle,
  Switch,
  FormControlLabel,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Camera as CameraIcon,
  AttachFile as AttachFileIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Engineering as EngineeringIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon
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

// Helper functions
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

const getCategoryIcon = (category) => {
  switch (category) {
    case 'ELECTRICAL': return <BuildIcon />;
    case 'PLUMBING': return <BuildIcon />;
    case 'HVAC': return <BuildIcon />;
    case 'PAINTING': return <BuildIcon />;
    case 'CLEANING': return <BuildIcon />;
    default: return <BuildIcon />;
  }
};

export default function TenantMaintenancePortal() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Dialog states
  const [createRequestDialog, setCreateRequestDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [communicationDialog, setCommunicationDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newRequest, setNewRequest] = useState({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    images: []
  });
  const [newMessage, setNewMessage] = useState({
    message: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      // Fetch tenant's maintenance requests and properties
      const [requestsRes, propertiesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/maintenance-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/properties`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [requestsData, propertiesData] = await Promise.all([
        requestsRes.json(),
        propertiesRes.json()
      ]);

      setMaintenanceRequests(requestsData);
      setProperties(propertiesData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tenant data:', err);
      setError('Failed to load maintenance data');
      setLoading(false);
    }
  };

  const handleCreateMaintenanceRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/maintenance-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      });

      if (res.ok) {
        const createdRequest = await res.json();
        setMaintenanceRequests(prev => [createdRequest, ...prev]);
        setCreateRequestDialog(false);
        setNewRequest({
          propertyId: '',
          unitId: '',
          title: '',
          description: '',
          category: 'GENERAL',
          priority: 'MEDIUM',
          images: []
        });
        fetchTenantData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to create maintenance request');
    }
  };

  const handleSendMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/maintenance-communications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMessage,
          receiverId: selectedRequest.property.landlordId,
          relatedTo: selectedRequest.id.toString(),
          subject: `Re: ${selectedRequest.title}`
        })
      });

      if (res.ok) {
        setCommunicationDialog(false);
        setNewMessage({ message: '', priority: 'MEDIUM' });
        setSelectedRequest(null);
        // Refresh communications
        fetchTenantData();
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };



  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading maintenance portal...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={fetchTenantData} variant="contained">
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
          Tenant Maintenance Portal
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateRequestDialog(true)}
          >
            New Maintenance Request
          </Button>
          <IconButton onClick={fetchTenantData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <BuildIcon />
                </Avatar>
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
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PriorityHighIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {maintenanceRequests.filter(req => req.status === 'OPEN').length}
                  </Typography>
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
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <UpdateIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {maintenanceRequests.filter(req => req.status === 'IN_PROGRESS').length}
                  </Typography>
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
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {maintenanceRequests.filter(req => req.status === 'COMPLETED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>My Maintenance Requests</Typography>
          
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
                      <TableCell>{request.title}</TableCell>
                      <TableCell>{request.property?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={getCategoryIcon(request.category)}
                          label={request.category}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.priority}
                          color={getPriorityColor(request.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
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
                              onClick={() => {
                                setSelectedRequest(request);
                                setCommunicationDialog(true);
                              }}
                            >
                              <MessageIcon />
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
        </Box>
      </Paper>

      {/* Dialogs */}
      <CreateMaintenanceRequestDialog 
        open={createRequestDialog}
        onClose={() => setCreateRequestDialog(false)}
        onSubmit={handleCreateMaintenanceRequest}
        newRequest={newRequest}
        setNewRequest={setNewRequest}
        properties={properties}
      />

      <MaintenanceRequestDetailsDialog 
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        selectedRequest={selectedRequest}
      />

      <CommunicationDialog 
        open={communicationDialog}
        onClose={() => setCommunicationDialog(false)}
        onSubmit={handleSendMessage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        selectedRequest={selectedRequest}
      />
    </Box>
  );
}

// Sub-components
function CreateMaintenanceRequestDialog({ open, onClose, onSubmit, newRequest, setNewRequest, properties }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Maintenance Request</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              value={newRequest.title}
              onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Property</InputLabel>
              <Select
                value={newRequest.propertyId}
                label="Property"
                onChange={(e) => setNewRequest(prev => ({ ...prev, propertyId: e.target.value }))}
              >
                {properties.map(property => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.name}
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
              placeholder="Please describe the issue in detail..."
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Submit Request</Button>
      </DialogActions>
    </Dialog>
  );
}

function MaintenanceRequestDetailsDialog({ open, onClose, selectedRequest }) {
  if (!selectedRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Maintenance Request Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6">{selectedRequest.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedRequest.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Property</Typography>
            <Typography variant="body1">{selectedRequest.property?.name || 'Unknown'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
            <Typography variant="body1">{selectedRequest.unit?.name || 'N/A'}</Typography>
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
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip 
              label={selectedRequest.priority}
              color={getPriorityColor(selectedRequest.priority)}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Category</Typography>
            <Chip 
              icon={getCategoryIcon(selectedRequest.category)}
              label={selectedRequest.category}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1">
              {new Date(selectedRequest.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          
          {selectedRequest.workOrder && (
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Work Order Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1">
                        {selectedRequest.workOrder.assignedTo 
                          ? `${selectedRequest.workOrder.assignedTo.firstName} ${selectedRequest.workOrder.assignedTo.lastName}`
                          : 'Not assigned'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Work Order Status</Typography>
                      <Chip 
                        label={selectedRequest.workOrder.status}
                        color={getStatusColor(selectedRequest.workOrder.status)}
                        size="small"
                      />
                    </Grid>
                    {selectedRequest.workOrder.notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                        <Typography variant="body1">{selectedRequest.workOrder.notes}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function CommunicationDialog({ open, onClose, onSubmit, newMessage, setNewMessage, selectedRequest }) {
  if (!selectedRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Message to Landlord</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="h6">{selectedRequest.title}</Typography>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={newMessage.priority}
              label="Priority"
              onChange={(e) => setNewMessage(prev => ({ ...prev, priority: e.target.value }))}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            placeholder="Type your message here..."
            value={newMessage.message}
            onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Send Message</Button>
      </DialogActions>
    </Dialog>
  );
} 