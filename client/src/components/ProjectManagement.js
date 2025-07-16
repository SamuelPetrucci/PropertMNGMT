import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Stack,
  InputAdornment,
  Paper,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  PriorityHigh as PriorityIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon
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

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createProjectDialog, setCreateProjectDialog] = useState(false);
  const [createJobDialog, setCreateJobDialog] = useState(false);
  const [createCostDialog, setCreateCostDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [processing, setProcessing] = useState(false);
  
  // Stepper states
  const [projectActiveStep, setProjectActiveStep] = useState(0);
  const [jobActiveStep, setJobActiveStep] = useState(0);
  const [costActiveStep, setCostActiveStep] = useState(0);
  
  // Job status menu state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedJobForStatus, setSelectedJobForStatus] = useState(null);
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: '',
  });
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

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Stepper steps
  const projectSteps = ['Basic Information', 'Timeline & Budget'];
  const jobSteps = ['Job Details', 'Costs & Timeline'];
  const costSteps = ['Cost Information', 'Assignment & Notes'];

  // Reset form states
  const resetNewProject = () => {
    setNewProject({
      name: '',
      description: '',
      status: 'PLANNING',
      startDate: '',
      endDate: '',
      budget: '',
    });
    setProjectActiveStep(0);
  };

  const resetNewJob = () => {
    setNewJob({
      name: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      laborCost: '',
      materialCost: '',
      dueDate: '',
    });
    setJobActiveStep(0);
  };

  const resetNewCost = () => {
    setNewCost({
      description: '',
      amount: '',
      type: 'MATERIAL',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      jobId: null,
    });
    setCostActiveStep(0);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch standalone projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create new project
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      showSnackbar('Project name is required', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      resetNewProject();
      setCreateProjectDialog(false);
      showSnackbar('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      showSnackbar(error.message || 'Failed to create project', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Create new job
  const handleCreateJob = async () => {
    if (!newJob.name.trim()) {
      showSnackbar('Job name is required', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${selectedProject.id}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newJob)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      resetNewJob();
      setCreateJobDialog(false);
      setSelectedProject(null);
      showSnackbar('Job created successfully');
    } catch (error) {
      console.error('Error creating job:', error);
      showSnackbar(error.message || 'Failed to create job', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Update job status
  const handleUpdateJobStatus = async (projectId, jobId, newStatus) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }
      
      // Refresh projects to update progress bars
      await fetchProjects();
      showSnackbar('Job status updated successfully');
    } catch (error) {
      console.error('Error updating job:', error);
      showSnackbar(error.message || 'Failed to update job status', 'error');
    }
  };

  // Get next status in the cycle
  const getNextStatus = (currentStatus) => {
    const statusCycle = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    return statusCycle[nextIndex];
  };

  // Get status display name
  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <PauseIcon fontSize="small" />;
      case 'IN_PROGRESS': return <PlayIcon fontSize="small" />;
      case 'COMPLETED': return <CheckIcon fontSize="small" />;
      case 'CANCELLED': return <CancelIcon fontSize="small" />;
      default: return <PauseIcon fontSize="small" />;
    }
  };

  // Handle status menu open
  const handleStatusMenuOpen = (event, job) => {
    setStatusMenuAnchor(event.currentTarget);
    setSelectedJobForStatus(job);
  };

  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedJobForStatus(null);
  };

  // Handle status change from menu
  const handleStatusChange = (newStatus) => {
    if (selectedJobForStatus) {
      handleUpdateJobStatus(selectedJobForStatus.projectId, selectedJobForStatus.id, newStatus);
    }
    handleStatusMenuClose();
  };

  // Delete job
  const handleDeleteJob = async (projectId, jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      setProcessing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }
      
      // Refresh projects to update progress bars
      await fetchProjects();
      showSnackbar('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      showSnackbar(error.message || 'Failed to delete job', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Create new cost
  const handleCreateCost = async () => {
    if (!newCost.description.trim() || !newCost.amount) {
      showSnackbar('Description and amount are required', 'error');
      return;
    }

    try {
      setProcessing(true);
      const costData = {
        ...newCost,
        projectId: selectedProject.id,
      };

      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${selectedProject.id}/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create cost');
      }
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      resetNewCost();
      setCreateCostDialog(false);
      setSelectedProject(null);
      showSnackbar('Cost added successfully');
    } catch (error) {
      console.error('Error creating cost:', error);
      showSnackbar(error.message || 'Failed to create cost', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Open job creation dialog for specific project
  const openCreateJobDialog = (project) => {
    setSelectedProject(project);
    setCreateJobDialog(true);
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated jobs and costs.')) {
      return;
    }
    
    try {
      setProcessing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // Refresh projects list
      await fetchProjects();
      showSnackbar('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      showSnackbar(error.message || 'Failed to delete project', 'error');
    } finally {
      setProcessing(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Project Management
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Manage your standalone projects and track costs
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={fetchProjects} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      <Box mb={4}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateProjectDialog(true)}
          size="large"
          disabled={processing}
          sx={{ 
            py: 2, 
            px: 4, 
            fontSize: '1.1rem', 
            fontWeight: 600,
            borderRadius: 3,
            boxShadow: 3
          }}
        >
          Create New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              No projects yet. Create your first project to get started!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start by creating a project and adding jobs to track your progress and costs.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    <Chip 
                      label={project.status.replace('_', ' ')} 
                      size="medium" 
                      color={getStatusColor(project.status)}
                      sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                    />
                  </Box>
                  
                  {project.description && (
                    <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2, lineHeight: 1.5 }}>
                      {project.description}
                    </Typography>
                  )}

                  <Box mb={3}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                      Budget: {project.budget ? formatCurrency(project.budget) : 'Not set'}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                      Total Spent: {formatCurrency(project.totalSpent || 0)}
                    </Typography>
                    {project.budget && (
                      <Box mt={2}>
                        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                          Remaining: {formatCurrency(project.remainingBudget || 0)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(((project.totalSpent || 0) / project.budget) * 100, 100)}
                          color={(project.totalSpent || 0) > project.budget ? 'error' : 'primary'}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontWeight: 500 }}>
                          {((project.totalSpent || 0) / project.budget * 100).toFixed(1)}% used
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Jobs ({project.jobs?.length || 0})
                  </Typography>

                  {project.jobs && project.jobs.length > 0 ? (
                    <Box>
                      <Typography variant="body1" color="text.secondary" mb={2} sx={{ fontWeight: 500 }}>
                        {project.jobs.filter(job => job.status === 'COMPLETED').length} of {project.jobs.length} completed
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(project.jobs.filter(job => job.status === 'COMPLETED').length / project.jobs.length) * 100}
                        sx={{ height: 8, borderRadius: 4, mb: 3 }}
                      />
                      
                      {/* Job List */}
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                        {project.jobs.map((job) => (
                          <Box key={job.id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {job.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip 
                                  label={getStatusDisplayName(job.status)} 
                                  size="small" 
                                  color={getStatusColor(job.status)}
                                  icon={getStatusIcon(job.status)}
                                  onClick={(event) => handleStatusMenuOpen(event, { ...job, projectId: project.id })}
                                  sx={{ cursor: 'pointer' }}
                                />
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteJob(project.id, job.id)}
                                  disabled={processing}
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(job.estimatedCost || 0)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      No jobs yet
                    </Typography>
                  )}

                  <Box mt="auto" sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openCreateJobDialog(project)}
                      disabled={processing}
                      sx={{ flex: 1 }}
                    >
                      Add Job
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/project-management/${project.id}`)}
                      startIcon={<OpenInNewIcon />}
                      disabled={processing}
                      sx={{ flex: 1 }}
                    >
                      Details
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={processing}
                      color="error"
                      sx={{ 
                        border: '1px solid #d32f2f',
                        '&:hover': {
                          backgroundColor: '#d32f2f',
                          color: 'white'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog 
        open={createProjectDialog} 
        onClose={() => !processing && setCreateProjectDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <BusinessIcon />
            <Typography variant="h6">Create New Project</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Step {projectActiveStep + 1} of {projectSteps.length}: {projectSteps[projectActiveStep]}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={projectActiveStep} orientation="vertical" sx={{ mb: 2 }}>
            {projectSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <TextField
                        autoFocus
                        label="Project Name *"
                        fullWidth
                        variant="outlined"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        disabled={processing}
                        helperText="Enter a descriptive name for your project"
                      />
                      <TextField
                        label="Description"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        disabled={processing}
                        helperText="Provide details about the project scope and objectives"
                      />
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={newProject.status}
                          label="Status"
                          onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                          disabled={processing}
                        >
                          <MenuItem value="PLANNING">Planning</MenuItem>
                          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                          <MenuItem value="COMPLETED">Completed</MenuItem>
                          <MenuItem value="ON_HOLD">On Hold</MenuItem>
                          <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                  
                  {index === 1 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Timeline
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            variant="outlined"
                            value={newProject.startDate}
                            onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            disabled={processing}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            variant="outlined"
                            value={newProject.endDate}
                            onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            disabled={processing}
                          />
                        </Grid>
                      </Grid>
                      
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Budget
                      </Typography>
                      <TextField
                        label="Project Budget"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={newProject.budget}
                        onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        disabled={processing}
                        helperText="Set the total budget for this project"
                      />
                    </Stack>
                  )}
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === projectSteps.length - 1 ? handleCreateProject : () => setProjectActiveStep(projectActiveStep + 1)}
                      sx={{ mr: 1 }}
                      disabled={processing || (index === 0 && !newProject.name.trim())}
                    >
                      {index === projectSteps.length - 1 ? (processing ? <CircularProgress size={20} /> : 'Create Project') : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setProjectActiveStep(projectActiveStep - 1)}
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

      {/* Create Job Dialog */}
      <Dialog 
        open={createJobDialog} 
        onClose={() => !processing && setCreateJobDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <WorkIcon />
            <Typography variant="h6">Create New Job</Typography>
          </Stack>
          {selectedProject && (
            <Typography variant="body2" color="text.secondary">
              for {selectedProject.name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Step {jobActiveStep + 1} of {jobSteps.length}: {jobSteps[jobActiveStep]}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={jobActiveStep} orientation="vertical" sx={{ mb: 2 }}>
            {jobSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <TextField
                        autoFocus
                        label="Job Name *"
                        fullWidth
                        variant="outlined"
                        value={newJob.name}
                        onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                        disabled={processing}
                        helperText="Enter a descriptive name for this job"
                      />
                      <TextField
                        label="Description"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                        disabled={processing}
                        helperText="Provide details about the work to be done"
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={newJob.status}
                              label="Status"
                              onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                              disabled={processing}
                            >
                              <MenuItem value="PENDING">Pending</MenuItem>
                              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                              <MenuItem value="COMPLETED">Completed</MenuItem>
                              <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                              value={newJob.priority}
                              label="Priority"
                              onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                              disabled={processing}
                            >
                              <MenuItem value="LOW">Low</MenuItem>
                              <MenuItem value="MEDIUM">Medium</MenuItem>
                              <MenuItem value="HIGH">High</MenuItem>
                              <MenuItem value="URGENT">Urgent</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Stack>
                  )}
                  
                  {index === 1 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Cost Estimates
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Labor Cost"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={newJob.laborCost}
                            onChange={(e) => setNewJob({ ...newJob, laborCost: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            disabled={processing}
                            helperText="Estimated labor costs"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Material Cost"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={newJob.materialCost}
                            onChange={(e) => setNewJob({ ...newJob, materialCost: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            disabled={processing}
                            helperText="Estimated material costs"
                          />
                        </Grid>
                      </Grid>
                      
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Timeline
                      </Typography>
                      <TextField
                        label="Due Date"
                        type="date"
                        fullWidth
                        variant="outlined"
                        value={newJob.dueDate}
                        onChange={(e) => setNewJob({ ...newJob, dueDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        disabled={processing}
                        helperText="When this job should be completed"
                      />
                      
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Total Estimated Cost
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency((Number(newJob.laborCost) || 0) + (Number(newJob.materialCost) || 0))}
                        </Typography>
                      </Paper>
                    </Stack>
                  )}
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === jobSteps.length - 1 ? handleCreateJob : () => setJobActiveStep(jobActiveStep + 1)}
                      sx={{ mr: 1 }}
                      disabled={processing || (index === 0 && !newJob.name.trim())}
                    >
                      {index === jobSteps.length - 1 ? (processing ? <CircularProgress size={20} /> : 'Create Job') : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setJobActiveStep(jobActiveStep - 1)}
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

      {/* Create Cost Dialog */}
      <Dialog 
        open={createCostDialog} 
        onClose={() => !processing && setCreateCostDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ReceiptIcon />
            <Typography variant="h6">Add Cost</Typography>
          </Stack>
          {selectedProject && (
            <Typography variant="body2" color="text.secondary">
              for {selectedProject.name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Step {costActiveStep + 1} of {costSteps.length}: {costSteps[costActiveStep]}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={costActiveStep} orientation="vertical" sx={{ mb: 2 }}>
            {costSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <TextField
                        autoFocus
                        label="Cost Description *"
                        fullWidth
                        variant="outlined"
                        value={newCost.description}
                        onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                        disabled={processing}
                        helperText="Describe what this cost is for"
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Amount *"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={newCost.amount}
                            onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            disabled={processing}
                            helperText="Enter the cost amount"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={newCost.type}
                              label="Type"
                              onChange={(e) => setNewCost({ ...newCost, type: e.target.value })}
                              disabled={processing}
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
                      <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        variant="outlined"
                        value={newCost.date}
                        onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        disabled={processing}
                        helperText="When this cost was incurred"
                      />
                    </Stack>
                  )}
                  
                  {index === 1 && (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Job Assignment
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>Assign to Job (Optional)</InputLabel>
                        <Select
                          value={newCost.jobId || ''}
                          label="Assign to Job (Optional)"
                          onChange={(e) => setNewCost({ ...newCost, jobId: e.target.value || null })}
                          disabled={processing}
                        >
                          <MenuItem value="">Project Level Cost</MenuItem>
                          {selectedProject?.jobs?.map((job) => (
                            <MenuItem key={job.id} value={job.id}>
                              {job.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Additional Notes
                      </Typography>
                      <TextField
                        label="Notes"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={newCost.notes}
                        onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                        disabled={processing}
                        helperText="Any additional details about this cost"
                      />
                    </Stack>
                  )}
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === costSteps.length - 1 ? handleCreateCost : () => setCostActiveStep(costActiveStep + 1)}
                      sx={{ mr: 1 }}
                      disabled={processing || (index === 0 && (!newCost.description.trim() || !newCost.amount))}
                    >
                      {index === costSteps.length - 1 ? (processing ? <CircularProgress size={20} /> : 'Add Cost') : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setCostActiveStep(costActiveStep - 1)}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Job Status Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2
            }
          }
        }}
      >
        <MenuItem onClick={() => handleStatusChange('PENDING')}>
          <ListItemIcon>
            <PauseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Pending" 
            secondary="Job is waiting to be started"
          />
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
          <ListItemIcon>
            <PlayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="In Progress" 
            secondary="Work is currently being done"
          />
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('COMPLETED')}>
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Completed" 
            secondary="Job has been finished"
          />
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('CANCELLED')}>
          <ListItemIcon>
            <CancelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Cancelled" 
            secondary="Job has been cancelled"
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectManagement; 