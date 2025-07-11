import * as React from 'react';
import { Box, Typography, Stack, Card, CardContent, CardActions, Button, Dialog, DialogTitle, DialogContent, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import AddPropertyForm from './AddPropertyForm';

function PropertyList({ refreshProperties }) {
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refresh, setRefresh] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedProperty, setSelectedProperty] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch('/api/properties', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setTimeout(() => navigate('/'), 100); // Redirect to login
          throw new Error('Session expired, please log in again.');
        }
        return res.json();
      })
      .then(data => {
        console.log('Properties fetched:', data);
        setProperties(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not fetch properties');
        setLoading(false);
      });
  }, [refresh, navigate]);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);
  const handlePropertyAdded = () => {
    setRefresh((r) => r + 1);
    setDialogOpen(false);
    // Refresh the dashboard properties
    if (refreshProperties) {
      refreshProperties();
    }
  };
  const handleMenuOpen = (event, property) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedProperty(null);
  };
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedProperty(null);
  };
  const handlePropertyEdited = () => {
    console.log('Property edited, refreshing...');
    setRefresh((r) => r + 1);
    handleEditDialogClose();
    // Refresh the dashboard properties
    if (refreshProperties) {
      refreshProperties();
    }
  };
  const handlePropertyDeleted = async () => {
    if (!selectedProperty) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/properties/${selectedProperty.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setRefresh((r) => r + 1);
        handleDeleteDialogClose();
        // Refresh the dashboard properties
        if (refreshProperties) {
          refreshProperties();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete property');
      }
    } catch (error) {
      setError('Network error while deleting property');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        My Properties
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ mb: 2 }}
        onClick={handleOpenDialog}
      >
        Add Property
      </Button>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Property</DialogTitle>
        <DialogContent>
          <AddPropertyForm onPropertyAdded={handlePropertyAdded} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
      {loading && <Typography>Loading properties...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && properties.length === 0 && (
        <Typography>No properties found.</Typography>
      )}
      {!loading && !error && properties.length > 0 && (
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {properties.map((property) => (
            <Card key={property.id} sx={{ minWidth: 250, m: 1, position: 'relative' }}>
              <IconButton
                aria-label="more"
                onClick={(e) => handleMenuOpen(e, property)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl) && selectedProperty?.id === property.id}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
              </Menu>
              <CardContent>
                <Typography variant="h6">{property.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {property.address}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/properties/${property.id}`)}>
                  View Details
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
      {/* Edit Property Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Property</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <AddPropertyForm
              onPropertyAdded={handlePropertyEdited}
              onCancel={handleEditDialogClose}
              initialData={selectedProperty}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Property</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this property?</Typography>
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ p: 2 }}>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button color="error" onClick={handlePropertyDeleted}>Delete</Button>
        </Stack>
      </Dialog>
    </Box>
  );
}

export default PropertyList; 