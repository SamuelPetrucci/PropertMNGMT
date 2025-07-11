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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createProjectDialog, setCreateProjectDialog] = useState(false);
  const [createJobDialog, setCreateJobDialog] = useState(false);
  const [createCostDialog, setCreateCostDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
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

  // Fetch standalone projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/standalone-projects', {
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
    try {
      const response = await fetch('/api/standalone-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      setNewProject({ name: '', description: '', status: 'PLANNING', startDate: '', endDate: '', budget: '' });
      setCreateProjectDialog(false);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    }
  };

  // Create new job
  const handleCreateJob = async () => {
    try {
      const response = await fetch(`/api/standalone-projects/${selectedProject.id}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newJob)
      });
      
      if (!response.ok) throw new Error('Failed to create job');
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      setNewJob({ name: '', description: '', status: 'PENDING', priority: 'MEDIUM', laborCost: '', materialCost: '', dueDate: '' });
      setCreateJobDialog(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error creating job:', error);
      setError('Failed to create job');
    }
  };

  // Update job status
  const handleUpdateJobStatus = async (projectId, jobId, newStatus) => {
    try {
      const response = await fetch(`/api/standalone-projects/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update job');
      
      // Refresh projects to update progress bars
      await fetchProjects();
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job status');
    }
  };

  // Delete job
  const handleDeleteJob = async (projectId, jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/standalone-projects/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete job');
      
      // Refresh projects to update progress bars
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    }
  };

  // Create new cost
  const handleCreateCost = async () => {
    try {
      const costData = {
        ...newCost,
        projectId: selectedProject.id,
      };

      const response = await fetch(`/api/standalone-projects/${selectedProject.id}/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      });
      
      if (!response.ok) throw new Error('Failed to create cost');
      
      // Refresh projects
      await fetchProjects();
      
      // Reset form and close dialog
      setNewCost({ description: '', amount: '', type: 'MATERIAL', date: new Date().toISOString().split('T')[0], notes: '', jobId: null });
      setCreateCostDialog(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error creating cost:', error);
      setError('Failed to create cost');
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
      const response = await fetch(`/api/standalone-projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      
      // Refresh projects list
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
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

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchProjects}>Retry</Button>
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

      <Box mb={4}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateProjectDialog(true)}
          size="large"
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
                      Total Cost: {formatCurrency(project.totalCost || 0)}
                    </Typography>
                    {project.budget && (
                      <Box mt={2}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(project.budgetUtilization || 0, 100)}
                          color={(project.totalCost || 0) > project.budget ? 'error' : 'primary'}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontWeight: 500 }}>
                          {(project.budgetUtilization || 0).toFixed(1)}% used
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
                              <Chip 
                                label={job.status} 
                                size="small" 
                                color={getStatusColor(job.status)}
                                onClick={() => {
                                  const newStatus = job.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
                                  handleUpdateJobStatus(project.id, job.id, newStatus);
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(job.estimatedCost || 0)}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteJob(project.id, job.id)}
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                      sx={{ flex: 1 }}
                    >
                      Add Job
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/project-management/${project.id}`)}
                      startIcon={<OpenInNewIcon />}
                      sx={{ flex: 1 }}
                    >
                      Details
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProject(project.id)}
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
        onClose={() => setCreateProjectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Project
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 3 }}
            InputProps={{ style: { fontSize: '1rem' } }}
            InputLabelProps={{ style: { fontSize: '1rem' } }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ mb: 3 }}
            InputProps={{ style: { fontSize: '1rem' } }}
            InputLabelProps={{ style: { fontSize: '1rem' } }}
          />
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newProject.status}
              label="Status"
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              sx={{ fontSize: '1rem' }}
            >
              <MenuItem value="PLANNING">Planning</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Start Date"
                type="date"
                fullWidth
                variant="outlined"
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                InputLabelProps={{ shrink: true, style: { fontSize: '1rem' } }}
                InputProps={{ style: { fontSize: '1rem' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="End Date"
                type="date"
                fullWidth
                variant="outlined"
                value={newProject.endDate}
                onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                InputLabelProps={{ shrink: true, style: { fontSize: '1rem' } }}
                InputProps={{ style: { fontSize: '1rem' } }}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Budget"
            type="number"
            fullWidth
            variant="outlined"
            value={newProject.budget}
            onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
            InputProps={{
              startAdornment: <Typography variant="body1" sx={{ mr: 1 }}>$</Typography>,
              style: { fontSize: '1rem' }
            }}
            InputLabelProps={{ style: { fontSize: '1rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setCreateProjectDialog(false)}
            sx={{ fontSize: '1rem', px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained"
            disabled={!newProject.name.trim()}
            sx={{ fontSize: '1rem', px: 3, py: 1 }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog 
        open={createJobDialog} 
        onClose={() => setCreateJobDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Job
          {selectedProject && (
            <Typography variant="body2" color="text.secondary">
              for {selectedProject.name}
            </Typography>
          )}
        </DialogTitle>
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
          {selectedProject && (
            <Typography variant="body2" color="text.secondary">
              for {selectedProject.name}
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assign to Job (Optional)</InputLabel>
            <Select
              value={newCost.jobId || ''}
              label="Assign to Job (Optional)"
              onChange={(e) => setNewCost({ ...newCost, jobId: e.target.value || null })}
            >
              <MenuItem value="">Project Level Cost</MenuItem>
              {selectedProject?.jobs?.map((job) => (
                <MenuItem key={job.id} value={job.id}>
                  {job.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
    </Box>
  );
};

export default ProjectManagement; 