import * as React from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Menu, 
  MenuItem,
  Chip,
  Avatar,
  Grid,
  LinearProgress,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import AddPropertyForm from './AddPropertyForm';

function PropertyList({ refreshProperties }) {
  const [properties, setProperties] = React.useState([]);
  const [tenants, setTenants] = React.useState([]);
  const [rentData, setRentData] = React.useState([]);
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
    fetchIntegratedData();
  }, [refresh, navigate]);

  const fetchIntegratedData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
      
      // Fetch all data in parallel
      const [propertiesRes, tenantsRes, rentTrackingRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/properties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/rent-tracking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (propertiesRes.ok && tenantsRes.ok && rentTrackingRes.ok) {
        const [propertiesData, tenantsData, rentData] = await Promise.all([
          propertiesRes.json(),
          tenantsRes.json(),
          rentTrackingRes.json()
        ]);

        console.log('Integrated data fetched:', { 
          properties: propertiesData.length, 
          tenants: tenantsData.length, 
          rentData: rentData.length 
        });

        setProperties(propertiesData);
        setTenants(tenantsData);
        setRentData(rentData);
      } else {
        throw new Error('Failed to fetch integrated data');
      }
    } catch (err) {
      console.error('Error fetching integrated data:', err);
      setError(err.message || 'Could not fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000';
    } else {
      return `http://${hostname}:5000`;
    }
  };

  // Get integrated property data with tenant and rent information
  const getIntegratedPropertyData = (property) => {
    const propertyTenants = tenants.filter(tenant => 
      tenant.tenantUnits?.some(tu => tu.propertyId === property.id)
    );
    
    const propertyRentData = rentData.filter(rent => 
      rent.propertyId === property.id
    );

    const totalRent = propertyRentData.reduce((sum, rent) => sum + (rent.rent || 0), 0);
    const totalCollected = propertyRentData.reduce((sum, rent) => sum + (rent.totalRentCollected || 0), 0);
    const totalOutstanding = propertyRentData.reduce((sum, rent) => sum + (rent.outstandingBalance || 0), 0);
    
    const activeTenants = propertyTenants.filter(tenant => 
      tenant.status === 'ACTIVE' || tenant.assignments?.length > 0
    ).length;

    const overdueTenants = propertyRentData.filter(rent => 
      rent.overduePayments > 0
    ).length;

    return {
      ...property,
      tenantCount: activeTenants,
      totalRent,
      totalCollected,
      totalOutstanding,
      overdueTenants,
      occupancyRate: property.units?.length > 0 
        ? (activeTenants / property.units.length * 100).toFixed(1)
        : activeTenants > 0 ? '100' : '0'
    };
  };

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

  const handleQuickEdit = (property) => {
    setSelectedProperty(property);
    setEditDialogOpen(true);
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
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/properties/${selectedProperty.id}`, {
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

  const getPropertyStatus = (property) => {
    const integratedData = getIntegratedPropertyData(property);
    
    if (integratedData.overdueTenants > 0) return 'overdue';
    if (integratedData.occupancyRate === '0') return 'vacant';
    if (integratedData.occupancyRate === '100') return 'full';
    return 'partial';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'vacant': return 'warning';
      case 'full': return 'success';
      case 'partial': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'overdue': return 'Overdue Payments';
      case 'vacant': return 'Vacant';
      case 'full': return 'Fully Occupied';
      case 'partial': return 'Partially Occupied';
      default: return 'Unknown';
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
      {dialogOpen && (
        <AddPropertyForm onPropertyAdded={handlePropertyAdded} onCancel={handleCloseDialog} />
      )}
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && !error && properties.length === 0 && (
        <Typography>No properties found.</Typography>
      )}
      {!loading && !error && properties.length > 0 && (
        <Grid container spacing={2}>
          {properties.map((property) => {
            const integratedData = getIntegratedPropertyData(property);
            const status = getPropertyStatus(property);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={property.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <IconButton
                    aria-label="more"
                    onClick={(e) => handleMenuOpen(e, property)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
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
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      {/* Property Header */}
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {property.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {property.address}
                        </Typography>
                        <Chip 
                          label={getStatusLabel(status)}
                          color={getStatusColor(status)}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>

                      <Divider />

                      {/* Financial Summary */}
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Financial Summary
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Monthly Rent:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              ${integratedData.totalRent.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="success.main">Collected:</Typography>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              ${integratedData.totalCollected.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="error.main">Outstanding:</Typography>
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                              ${integratedData.totalOutstanding.toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Occupancy & Tenants */}
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Occupancy & Tenants
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center">
                              <PeopleIcon sx={{ fontSize: 16, mr: 1 }} />
                              <Typography variant="body2">Active Tenants:</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="bold">
                              {integratedData.tenantCount}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center">
                              <HomeIcon sx={{ fontSize: 16, mr: 1 }} />
                              <Typography variant="body2">Units:</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="bold">
                              {property.units?.length || 1}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center">
                              <CheckCircleIcon sx={{ fontSize: 16, mr: 1 }} />
                              <Typography variant="body2">Occupancy:</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="bold">
                              {integratedData.occupancyRate}%
                            </Typography>
                          </Box>
                          {integratedData.overdueTenants > 0 && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box display="flex" alignItems="center">
                                <WarningIcon sx={{ fontSize: 16, mr: 1, color: 'error.main' }} />
                                <Typography variant="body2" color="error.main">Overdue:</Typography>
                              </Box>
                              <Typography variant="body2" color="error.main" fontWeight="bold">
                                {integratedData.overdueTenants}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>

                      {/* Property Type & Valuation */}
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Property Details
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Type:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {property.type === 'single-family' ? 'Single Family' : 'Multi-Family'}
                            </Typography>
                          </Box>
                          {property.valuation && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2">Valuation:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                ${property.valuation.toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                  
                  <CardActions sx={{ gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleQuickEdit(property)}
                      sx={{ flex: 1 }}
                    >
                      Quick Edit
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => navigate(`/properties/${property.id}`)}
                      sx={{ flex: 1 }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Edit Property Dialog */}
      {editDialogOpen && selectedProperty && (
        <AddPropertyForm
          onPropertyAdded={handlePropertyEdited}
          onCancel={handleEditDialogClose}
          initialData={selectedProperty}
          isEdit
        />
      )}
      
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