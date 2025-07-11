import * as React from 'react';
import { Box, Typography, Stack, Card, CardContent, CardActions, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function MarketListings() {
  // Mock data
  const listings = [
    {
      id: 1,
      title: 'Modern Condo Downtown',
      price: '$2,100/mo',
      address: '101 City Center Ave',
      url: 'https://example.com/listing/1',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      title: 'Spacious Suburban Home',
      price: '$3,500/mo',
      address: '202 Maple St',
      url: 'https://example.com/listing/2',
      image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      title: 'Luxury High-Rise Apartment',
      price: '$4,800/mo',
      address: '303 Skyline Blvd',
      url: 'https://example.com/listing/3',
      image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80',
    },
  ];
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Market Listings</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {listings.map(listing => (
          <Card key={listing.id} sx={{ minWidth: 300, maxWidth: 340, m: 1 }}>
            <img src={listing.image} alt={listing.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            <CardContent>
              <Typography variant="h6">{listing.title}</Typography>
              <Typography variant="body2" color="text.secondary">{listing.address}</Typography>
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>{listing.price}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href={listing.url} target="_blank" endIcon={<OpenInNewIcon />}>View Listing</Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

export default MarketListings; 