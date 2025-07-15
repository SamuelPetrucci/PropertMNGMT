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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  InputAdornment
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
  Receipt as ReceiptIcon
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

export default function EnhancedMaintenanceDashboard() {
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Dialog states
  const [createRequestDialog, setCreateRequestDialog] = useState(false);
  const [createWorkOrderDialog, setCreateWorkOrderDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [communicationDialog, setCommunicationDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newRequest, setNewRequest] = useState({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    images: []
  });
  const [newWorkOrder, setNewWorkOrder] = useState({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    estimatedCost: '',
    estimatedDuration: ''
  });

  useEffect(() => {
    fetchIntegratedData();
  }, []);

  const fetchIntegratedData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      // Fetch all maintenance-related data
      const [workOrdersRes, maintenanceRequestsRes, contractorsRes, propertiesRes, tenantsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/work-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/maintenance-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/contractors`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/properties`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/tenants`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [workOrdersData, maintenanceRequestsData, contractorsData, propertiesData, tenantsData] = await Promise.all([
        workOrdersRes.json(),
        maintenanceRequestsRes.json(),
        contractorsRes.json(),
        propertiesData.json(),
        tenantsRes.json()
      ]);

      // Create integrated maintenance data
      const integratedData = createIntegratedMaintenanceData(
        workOrdersData,
        maintenanceRequestsData,
        contractorsData,
        propertiesData,
        tenantsData
      );

      setMaintenanceData(integratedData);
      setWorkOrders(workOrdersData);
      setMaintenanceRequests(maintenanceRequestsData);
      setContractors(contractorsData);
      setProperties(propertiesData);
      setTenants(tenantsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
      setError('Failed to load maintenance data');
      setLoading(false);
    }
  };

  const createIntegratedMaintenanceData = (workOrders, maintenanceRequests, contractors, properties, tenants) => {
    // Calculate comprehensive statistics
    const totalRequests = maintenanceRequests.length;
    const totalWorkOrders = workOrders.length;
    const openRequests = maintenanceRequests.filter(req => req.status === 'OPEN').length;
    const inProgressRequests = maintenanceRequests.filter(req => req.status === 'IN_PROGRESS').length;
    const completedRequests = maintenanceRequests.filter(req => req.status === 'COMPLETED').length;
    const urgentRequests = maintenanceRequests.filter(req => req.priority === 'URGENT').length;
    
    // Calculate costs
    const totalEstimatedCost = workOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
    const totalActualCost = workOrders.reduce((sum, wo) => sum + (wo.actualCost || 0), 0);
    
    // Calculate response times
    const avgResponseTime = maintenanceRequests.length > 0 
      ? maintenanceRequests.reduce((sum, req) => {
          const created = new Date(req.createdAt);
          const assigned = req.workOrder?.assignedAt ? new Date(req.workOrder.assignedAt) : null;
          return sum + (assigned ? (assigned - created) / (1000 * 60 * 60 * 24) : 0);
        }, 0) / maintenanceRequests.length
      : 0;

    // Property-wise breakdown
    const propertyBreakdown = properties.map(property => {
      const propertyRequests = maintenanceRequests.filter(req => req.propertyId === property.id);
      const propertyWorkOrders = workOrders.filter(wo => wo.propertyId === property.id);
      
      return {
        ...property,
        requestCount: propertyRequests.length,
        openRequests: propertyRequests.filter(req => req.status === 'OPEN').length,
        completedRequests: propertyRequests.filter(req => req.status === 'COMPLETED').length,
        estimatedCost: propertyWorkOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0),
        actualCost: propertyWorkOrders.reduce((sum, wo) => sum + (wo.actualCost || 0), 0)
      };
    });

    // Contractor performance
    const contractorPerformance = contractors.map(contractor => {
      const contractorWorkOrders = workOrders.filter(wo => wo.assignedToId === contractor.id);
      const completedWorkOrders = contractorWorkOrders.filter(wo => wo.status === 'COMPLETED');
      
      return {
        ...contractor,
        totalAssigned: contractorWorkOrders.length,
        completed: completedWorkOrders.length,
        completionRate: contractorWorkOrders.length > 0 
          ? (completedWorkOrders.length / contractorWorkOrders.length * 100).toFixed(1)
          : 0,
        avgCompletionTime: completedWorkOrders.length > 0
          ? completedWorkOrders.reduce((sum, wo) => {
              const assigned = new Date(wo.assignedAt);
              const completed = new Date(wo.completedAt);
              return sum + (completed - assigned) / (1000 * 60 * 60 * 24);
            }, 0) / completedWorkOrders.length
          : 0
      };
    });

    return {
      summary: {
        totalRequests,
        totalWorkOrders,
        openRequests,
        inProgressRequests,
        completedRequests,
        urgentRequests,
        totalEstimatedCost,
        totalActualCost,
        avgResponseTime: avgResponseTime.toFixed(1)
      },
      propertyBreakdown,
      contractorPerformance,
      recentActivity: {
        recentRequests: maintenanceRequests.slice(0, 5),
        recentWorkOrders: workOrders.slice(0, 5),
        urgentItems: [...maintenanceRequests.filter(req => req.priority === 'URGENT'), 
                     ...workOrders.filter(wo => wo.priority === 'URGENT')].slice(0, 5)
      }
    };
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
        fetchIntegratedData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to create maintenance request');
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
        const createdWorkOrder = await res.json();
        setWorkOrders(prev => [createdWorkOrder, ...prev]);
        setCreateWorkOrderDialog(false);
        setNewWorkOrder({
          propertyId: '',
          unitId: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignedToId: '',
          estimatedCost: '',
          estimatedDuration: ''
        });
        fetchIntegratedData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to create work order');
    }
  };

  const handleAssignWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/work-orders/${selectedItem.id}/assign`, {
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
        const updatedWorkOrder = await res.json();
        setWorkOrders(prev => prev.map(wo => wo.id === updatedWorkOrder.id ? updatedWorkOrder : wo));
        setAssignDialog(false);
        setSelectedItem(null);
        fetchIntegratedData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to assign work order');
    }
  };

  const handleUpdateStatus = async (itemId, status, itemType = 'workOrder', notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      const endpoint = itemType === 'request' ? 'maintenance-requests' : 'work-orders';
      
      const res = await fetch(`${apiBaseUrl}/api/${endpoint}/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      if (res.ok) {
        const updatedItem = await res.json();
        if (itemType === 'request') {
          setMaintenanceRequests(prev => prev.map(req => req.id === updatedItem.id ? updatedItem : req));
        } else {
          setWorkOrders(prev => prev.map(wo => wo.id === updatedItem.id ? updatedItem : wo));
        }
        fetchIntegratedData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to update status');
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading maintenance dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={fetchIntegratedData} variant="contained">
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
          Enhanced Maintenance Dashboard
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateRequestDialog(true)}
          >
            New Request
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateWorkOrderDialog(true)}
          >
            New Work Order
          </Button>
          <IconButton onClick={fetchIntegratedData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Summary Cards */}
      {maintenanceData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <BuildIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{maintenanceData.summary.totalRequests}</Typography>
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
                    <Typography variant="h4">{maintenanceData.summary.urgentRequests}</Typography>
                    <Typography variant="body2" color="text.secondary">Urgent Items</Typography>
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
                    <Typography variant="h4">{maintenanceData.summary.completedRequests}</Typography>
                    <Typography variant="body2" color="text.secondary">Completed</Typography>
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
                    <AssessmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">${maintenanceData.summary.totalEstimatedCost.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content with Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="All Items" />
          <Tab label="Maintenance Requests" />
          <Tab label="Work Orders" />
          <Tab label="Property Overview" />
          <Tab label="Contractor Performance" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {selectedTab === 0 && (
            <EnhancedMaintenanceOverview 
              maintenanceData={maintenanceData}
              workOrders={workOrders}
              maintenanceRequests={maintenanceRequests}
              properties={properties}
              tenants={tenants}
              contractors={contractors}
              onUpdateStatus={handleUpdateStatus}
              onAssignWorkOrder={(item) => {
                setSelectedItem(item);
                setAssignDialog(true);
              }}
              onViewDetails={(item) => {
                setSelectedItem(item);
                setDetailsDialog(true);
              }}
            />
          )}
          
          {selectedTab === 1 && (
            <MaintenanceRequestsTab 
              requests={maintenanceRequests}
              properties={properties}
              tenants={tenants}
              onUpdateStatus={handleUpdateStatus}
              onViewDetails={(item) => {
                setSelectedItem(item);
                setDetailsDialog(true);
              }}
            />
          )}
          
          {selectedTab === 2 && (
            <WorkOrdersTab 
              workOrders={workOrders}
              contractors={contractors}
              properties={properties}
              onUpdateStatus={handleUpdateStatus}
              onAssignWorkOrder={(item) => {
                setSelectedItem(item);
                setAssignDialog(true);
              }}
              onViewDetails={(item) => {
                setSelectedItem(item);
                setDetailsDialog(true);
              }}
            />
          )}
          
          {selectedTab === 3 && (
            <PropertyOverviewTab 
              propertyBreakdown={maintenanceData?.propertyBreakdown || []}
            />
          )}
          
          {selectedTab === 4 && (
            <ContractorPerformanceTab 
              contractorPerformance={maintenanceData?.contractorPerformance || []}
            />
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
        tenants={tenants}
      />

      <CreateWorkOrderDialog 
        open={createWorkOrderDialog}
        onClose={() => setCreateWorkOrderDialog(false)}
        onSubmit={handleCreateWorkOrder}
        newWorkOrder={newWorkOrder}
        setNewWorkOrder={setNewWorkOrder}
        properties={properties}
        contractors={contractors}
      />

      <AssignWorkOrderDialog 
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        onSubmit={handleAssignWorkOrder}
        selectedItem={selectedItem}
        newWorkOrder={newWorkOrder}
        setNewWorkOrder={setNewWorkOrder}
        contractors={contractors}
      />

      <MaintenanceDetailsDialog 
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        selectedItem={selectedItem}
        properties={properties}
        tenants={tenants}
        contractors={contractors}
        onUpdateStatus={handleUpdateStatus}
      />
    </Box>
  );
}

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

// Sub-components for different tabs
function EnhancedMaintenanceOverview({ maintenanceData, workOrders, maintenanceRequests, properties, tenants, contractors, onUpdateStatus, onAssignWorkOrder, onViewDetails }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const allItems = [
    ...maintenanceRequests.map(req => ({ ...req, type: 'request' })),
    ...workOrders.map(wo => ({ ...wo, type: 'workOrder' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredItems = allItems.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    return true;
  });

  return (
    <Box>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="URGENT">Urgent</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Items Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell>
                  <Chip 
                    label={item.type === 'request' ? 'Request' : 'Work Order'}
                    color={item.type === 'request' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  {properties.find(p => p.id === item.propertyId)?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  {tenants.find(t => t.id === item.tenantId)?.firstName || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.priority}
                    color={getPriorityColor(item.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.status}
                    color={getStatusColor(item.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => onViewDetails(item)}>
                      <VisibilityIcon />
                    </IconButton>
                    {item.type === 'workOrder' && item.status === 'OPEN' && (
                      <IconButton size="small" onClick={() => onAssignWorkOrder(item)}>
                        <AssignmentIcon />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Additional tab components
function MaintenanceRequestsTab({ requests, properties, tenants, onUpdateStatus, onViewDetails }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Maintenance Requests</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.title}</TableCell>
                <TableCell>
                  {properties.find(p => p.id === request.propertyId)?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  {tenants.find(t => t.id === request.tenantId)?.firstName || 'Unknown'}
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
                  <IconButton size="small" onClick={() => onViewDetails(request)}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function WorkOrdersTab({ workOrders, contractors, properties, onUpdateStatus, onAssignWorkOrder, onViewDetails }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Work Orders</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map((workOrder) => (
              <TableRow key={workOrder.id}>
                <TableCell>{workOrder.title}</TableCell>
                <TableCell>
                  {properties.find(p => p.id === workOrder.propertyId)?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  {workOrder.assignedTo 
                    ? `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`
                    : 'Unassigned'
                  }
                </TableCell>
                <TableCell>
                  <Chip 
                    label={workOrder.priority}
                    color={getPriorityColor(workOrder.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={workOrder.status}
                    color={getStatusColor(workOrder.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(workOrder.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => onViewDetails(workOrder)}>
                      <VisibilityIcon />
                    </IconButton>
                    {workOrder.status === 'OPEN' && (
                      <IconButton size="small" onClick={() => onAssignWorkOrder(workOrder)}>
                        <AssignmentIcon />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function PropertyOverviewTab({ propertyBreakdown }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Property Overview</Typography>
      <Grid container spacing={3}>
        {propertyBreakdown.map((property) => (
          <Grid item xs={12} md={6} key={property.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{property.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {property.address}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Total Requests: {property.requestCount}
                  </Typography>
                  <Typography variant="body2">
                    Open Requests: {property.openRequests}
                  </Typography>
                  <Typography variant="body2">
                    Completed: {property.completedRequests}
                  </Typography>
                  <Typography variant="body2">
                    Estimated Cost: ${property.estimatedCost?.toLocaleString() || 0}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ContractorPerformanceTab({ contractorPerformance }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Contractor Performance</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contractor</TableCell>
              <TableCell>Total Assigned</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Completion Rate</TableCell>
              <TableCell>Avg Completion Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contractorPerformance.map((contractor) => (
              <TableRow key={contractor.id}>
                <TableCell>
                  {contractor.firstName} {contractor.lastName}
                </TableCell>
                <TableCell>{contractor.totalAssigned}</TableCell>
                <TableCell>{contractor.completed}</TableCell>
                <TableCell>{contractor.completionRate}%</TableCell>
                <TableCell>
                  {contractor.avgCompletionTime 
                    ? `${contractor.avgCompletionTime.toFixed(1)} days`
                    : 'N/A'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function CreateMaintenanceRequestDialog({ open, onClose, onSubmit, newRequest, setNewRequest, properties, tenants }) {
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
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Create Request</Button>
      </DialogActions>
    </Dialog>
  );
}

function CreateWorkOrderDialog({ open, onClose, onSubmit, newWorkOrder, setNewWorkOrder, properties, contractors }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Work Order</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              value={newWorkOrder.title}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, title: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Property</InputLabel>
              <Select
                value={newWorkOrder.propertyId}
                label="Property"
                onChange={(e) => setNewWorkOrder(prev => ({ ...prev, propertyId: e.target.value }))}
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
            <TextField
              fullWidth
              label="Estimated Cost"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              value={newWorkOrder.estimatedCost}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, estimatedCost: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Duration (days)"
              type="number"
              value={newWorkOrder.estimatedDuration}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={newWorkOrder.description}
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Create Work Order</Button>
      </DialogActions>
    </Dialog>
  );
}

function AssignWorkOrderDialog({ open, onClose, onSubmit, selectedItem, newWorkOrder, setNewWorkOrder, contractors }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign Work Order</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="h6">{selectedItem?.title}</Typography>
          <FormControl fullWidth>
            <InputLabel>Assign to Contractor</InputLabel>
            <Select
              value={newWorkOrder.assignedToId}
              label="Assign to Contractor"
              onChange={(e) => setNewWorkOrder(prev => ({ ...prev, assignedToId: e.target.value }))}
            >
              {contractors.map(contractor => (
                <MenuItem key={contractor.id} value={contractor.id}>
                  {contractor.firstName} {contractor.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={newWorkOrder.description}
            onChange={(e) => setNewWorkOrder(prev => ({ ...prev, description: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Assign</Button>
      </DialogActions>
    </Dialog>
  );
}

function MaintenanceDetailsDialog({ open, onClose, selectedItem, properties, tenants, contractors, onUpdateStatus }) {
  if (!selectedItem) return null;

  const property = properties.find(p => p.id === selectedItem.propertyId);
  const tenant = tenants.find(t => t.id === selectedItem.tenantId);
  const contractor = contractors.find(c => c.id === selectedItem.assignedToId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedItem.type === 'request' ? 'Maintenance Request Details' : 'Work Order Details'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6">{selectedItem.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedItem.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Property</Typography>
            <Typography variant="body1">{property?.name || 'Unknown'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Tenant</Typography>
            <Typography variant="body1">
              {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip 
              label={selectedItem.status}
              color={getStatusColor(selectedItem.status)}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip 
              label={selectedItem.priority}
              color={getPriorityColor(selectedItem.priority)}
              size="small"
            />
          </Grid>
          
          {selectedItem.type === 'workOrder' && contractor && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
              <Typography variant="body1">
                {contractor.firstName} {contractor.lastName}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1">
              {new Date(selectedItem.createdAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {selectedItem.status !== 'COMPLETED' && (
          <Button 
            onClick={() => onUpdateStatus(selectedItem.id, 'COMPLETED', selectedItem.type)}
            variant="contained"
            color="success"
          >
            Mark Complete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 