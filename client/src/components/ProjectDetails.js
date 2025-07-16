import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon
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

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createJobDialog, setCreateJobDialog] = useState(false);
  const [createCostDialog, setCreateCostDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    laborCost: '',
    materialCost: '',
    dueDate: '',
  });
  const [newCost, setNewCost] = useState({
    description: '',
    amount: '',
    type: 'MATERIAL',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    jobId: null,
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
  });

  const token = localStorage.getItem('token');

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    console.log('ProjectDetails: id =', id); // Debug log
    
    if (!id) {
      console.error('ProjectDetails: No project ID provided');
      setError('No project ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch project details');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchProjectDetails();
  }, [id, fetchProjectDetails]);

  useEffect(() => {
    if (project) {
      setEditProject({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'PLANNING',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget || '',
        location: project.location || '',
      });
    }
  }, [project]);

  // Create new job
  const handleCreateJob = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${id}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newJob)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create job');
      }
      
      // Refresh project details
      await fetchProjectDetails();
      
      // Reset form and close dialog
      setNewJob({ name: '', description: '', status: 'PENDING', priority: 'MEDIUM', laborCost: '', materialCost: '', dueDate: '' });
      setCreateJobDialog(false);
    } catch (error) {
      console.error('Error creating job:', error);
      setError(error.message || 'Failed to create job');
    }
  };

  // Create new cost
  const handleCreateCost = async () => {
    try {
      const costData = {
        ...newCost,
        projectId: parseInt(id),
      };

      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${id}/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create cost');
      }
      
      // Refresh project details
      await fetchProjectDetails();
      
      // Reset form and close dialog
      setNewCost({ description: '', amount: '', type: 'MATERIAL', date: new Date().toISOString().split('T')[0], notes: '', jobId: null });
      setCreateCostDialog(false);
    } catch (error) {
      console.error('Error creating cost:', error);
      setError(error.message || 'Failed to create cost');
    }
  };

  // Update job status
  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update job');
      
      // Refresh project details
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job');
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete job');
      
      // Refresh project details
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    }
  };

  // Delete cost
  const handleDeleteCost = async (costId) => {
    if (!window.confirm('Are you sure you want to delete this cost?')) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/costs/${costId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete cost');
      
      // Refresh project details
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error deleting cost:', error);
      setError('Failed to delete cost');
    }
  };

  const handleEditProject = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProject),
      });
      if (!response.ok) throw new Error('Failed to update project');
      await fetchProjectDetails();
      setEditDialogOpen(false);
    } catch (error) {
      setError('Failed to update project');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING': return 'default';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'CANCELLED': return 'error';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchProjectDetails}>Retry</Button>
        <Button variant="outlined" onClick={() => navigate('/project-management')} sx={{ ml: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  if (!id) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          No project ID provided. Please navigate to this page from the project management page.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/project-management')}>
          Go to Project Management
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <Alert severity="error">Project not found</Alert>
        <Button variant="contained" onClick={() => navigate('/project-management')}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/project-management')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {project.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {project.description || 'No description'}
          </Typography>
        </Box>
        <Box ml="auto" display="flex" gap={1}>
          <Chip 
            label={project.status.replace('_', ' ')} 
            color={getStatusColor(project.status)}
          />
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Project Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(project.totalSpent || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Budget
              </Typography>
              <Typography variant="h4" component="div">
                {project.budget ? formatCurrency(project.budget) : 'Not set'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Jobs
              </Typography>
              <Typography variant="h4" component="div">
                {project.jobs?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completion
              </Typography>
              <Typography variant="h4" component="div">
                {project.jobs?.length > 0 
                  ? `${Math.round((project.jobs.filter(job => job.status === 'COMPLETED').length / project.jobs.length) * 100)}%`
                  : '0%'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Progress */}
      {project.budget && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Budget Progress
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">
                {formatCurrency(project.totalSpent || 0)} of {formatCurrency(project.budget)}
              </Typography>
              <Typography variant="body2">
                {((project.totalSpent || 0) / project.budget * 100).toFixed(1)}% used
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(((project.totalSpent || 0) / project.budget) * 100, 100)}
              color={(project.totalSpent || 0) > project.budget ? 'error' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              {(project.totalSpent || 0) > project.budget 
                ? `${formatCurrency(Math.abs(project.remainingBudget || 0))} over budget`
                : `${formatCurrency(project.remainingBudget || 0)} remaining`
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {project.costByType && Object.keys(project.costByType).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cost Breakdown
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(project.costByType).map(([type, amount]) => (
                <Grid item xs={6} md={3} key={type}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {formatCurrency(amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Jobs Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Jobs ({project.jobs?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateJobDialog(true)}
            >
              Add Job
            </Button>
          </Box>

          {project.jobs && project.jobs.length > 0 ? (
            <List>
              {project.jobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" width="100%">
                        <Checkbox
                          checked={job.status === 'COMPLETED'}
                          onChange={(e) => handleUpdateJobStatus(job.id, e.target.checked ? 'COMPLETED' : 'PENDING')}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {job.name}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip 
                            label={job.priority} 
                            size="small" 
                            color={getPriorityColor(job.priority)}
                            variant="outlined"
                          />
                          <Chip 
                            label={job.status.replace('_', ' ')} 
                            size="small" 
                            color={getStatusColor(job.status)}
                          />
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job.id);
                            }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        {job.description && (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {job.description}
                          </Typography>
                        )}
                        
                        {/* Job Cost Summary */}
                        <Grid container spacing={2} mb={2}>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Labor: {formatCurrency(job.laborCost)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Materials: {formatCurrency(job.materialCost)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Additional: {formatCurrency(job.costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total: {formatCurrency((job.laborCost || 0) + (job.materialCost || 0) + (job.costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0))}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Job Costs Table */}
                        <Typography variant="subtitle1" gutterBottom>
                          Additional Costs
                        </Typography>
                        {job.costs && job.costs.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {job.costs.map((cost) => (
                                  <TableRow key={cost.id}>
                                    <TableCell>{cost.description}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={cost.type.charAt(0) + cost.type.slice(1).toLowerCase()} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>{formatCurrency(cost.amount)}</TableCell>
                                    <TableCell>{formatDate(cost.date)}</TableCell>
                                    <TableCell>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleDeleteCost(cost.id)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            No additional costs recorded for this job.
                          </Typography>
                        )}

                        {/* Add Cost to Job Button */}
                        <Button
                          variant="outlined"
                          startIcon={<AttachMoneyIcon />}
                          size="small"
                          onClick={() => {
                            setNewCost({ ...newCost, jobId: job.id });
                            setCreateCostDialog(true);
                          }}
                        >
                          Add Cost to Job
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                  {index < project.jobs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No jobs yet. Add your first job to get started!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Create Job Dialog */}
      <Dialog 
        open={createJobDialog} 
        onClose={() => setCreateJobDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Job Name"
            fullWidth
            variant="outlined"
            value={newJob.name}
            onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newJob.description}
            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newJob.status}
                  label="Status"
                  onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newJob.priority}
                  label="Priority"
                  onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Labor Cost"
                type="number"
                fullWidth
                variant="outlined"
                value={newJob.laborCost}
                onChange={(e) => setNewJob({ ...newJob, laborCost: e.target.value })}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Material Cost"
                type="number"
                fullWidth
                variant="outlined"
                value={newJob.materialCost}
                onChange={(e) => setNewJob({ ...newJob, materialCost: e.target.value })}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Due Date"
                type="date"
                fullWidth
                variant="outlined"
                value={newJob.dueDate}
                onChange={(e) => setNewJob({ ...newJob, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" height="100%">
                <Typography variant="body2" color="text.secondary">
                  Total: {formatCurrency((Number(newJob.laborCost) || 0) + (Number(newJob.materialCost) || 0))}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateJobDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateJob} 
            variant="contained"
            disabled={!newJob.name.trim()}
          >
            Create Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Cost Dialog */}
      <Dialog 
        open={createCostDialog} 
        onClose={() => setCreateCostDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Cost
          {newCost.jobId && (
            <Typography variant="body2" color="text.secondary">
              for {project?.jobs?.find(job => job.id === parseInt(newCost.jobId))?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cost Description"
            fullWidth
            variant="outlined"
            value={newCost.description}
            onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Amount"
                type="number"
                fullWidth
                variant="outlined"
                value={newCost.amount}
                onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newCost.type}
                  label="Type"
                  onChange={(e) => setNewCost({ ...newCost, type: e.target.value })}
                >
                  <MenuItem value="MATERIAL">Material</MenuItem>
                  <MenuItem value="LABOR">Labor</MenuItem>
                  <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                  <MenuItem value="PERMIT">Permit</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Date"
                type="date"
                fullWidth
                variant="outlined"
                value={newCost.date}
                onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newCost.notes}
            onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCostDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCost} 
            variant="contained"
            disabled={!newCost.description.trim() || !newCost.amount}
          >
            Add Cost
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project Details</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={editProject.name}
            onChange={e => setEditProject({ ...editProject, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editProject.description}
            onChange={e => setEditProject({ ...editProject, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editProject.status}
              label="Status"
              onChange={e => setEditProject({ ...editProject, status: e.target.value })}
            >
              <MenuItem value="PLANNING">Planning</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Start Date"
                type="date"
                fullWidth
                variant="outlined"
                value={editProject.startDate}
                onChange={e => setEditProject({ ...editProject, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="End Date"
                type="date"
                fullWidth
                variant="outlined"
                value={editProject.endDate}
                onChange={e => setEditProject({ ...editProject, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Budget"
            type="number"
            fullWidth
            variant="outlined"
            value={editProject.budget}
            onChange={e => setEditProject({ ...editProject, budget: e.target.value })}
            InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={editProject.location}
            onChange={e => setEditProject({ ...editProject, location: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditProject} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails; 