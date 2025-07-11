import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    return `http://${hostname}:5000`;
  }
};

const ProjectJobsDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/standalone-projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'ON_HOLD': return 'warning';
      case 'CANCELLED': return 'error';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Flatten all jobs with project info
  const allJobs = projects.flatMap(project =>
    (project.jobs || []).map(job => ({
      ...job,
      projectName: project.name,
      projectId: project.id,
      projectStatus: project.status
    }))
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Project Jobs Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        View all jobs across your projects. Filter, sort, and jump to project details.
      </Typography>
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Job Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No jobs found.</TableCell>
                </TableRow>
              ) : (
                allJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Button variant="text" onClick={() => navigate(`/project-management/${job.projectId}`)}>
                        {job.projectName}
                      </Button>
                    </TableCell>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>
                      <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                    </TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>{job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/project-management/${job.projectId}`)}
                        >
                          View Project
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ProjectJobsDashboard; 