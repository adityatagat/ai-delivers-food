import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { api } from '../services/api';
import { socketService } from '../services/socketService';

interface OrderStatus {
  status: string;
  items: any[];
  totalAmount: number;
  deliveryAddress: string;
  tracking?: {
    currentLocation?: {
      lat: number;
      lng: number;
      address: string;
    };
    estimatedArrival?: string;
  };
  createdAt: string;
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

const steps = [
  'Order Placed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Different colors for restaurant and customer markers
const restaurantIcon = {
  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
};

const customerIcon = {
  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
};

function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState<Location | null>(null);

  useEffect(() => {
    // Debug orderId
    console.log('OrderTracking - orderId:', orderId);
    
    // Ensure orderId is a string and not undefined
    if (!orderId) {
      setError('Order ID is missing');
      setLoading(false);
      return;
    }

    const fetchOrderStatus = async () => {
      try {
        console.log(`Fetching order status from: /api/orders/${orderId}`);
        // Use the correct endpoint - just get the order details rather than a specific status endpoint
        const response = await api.get<OrderStatus>(`/api/orders/${orderId}`);
        console.log('Order status response:', response.data);
        setOrderStatus(response.data);
        
        // Fetch restaurant location
        try {
          const restaurantRes = await api.get<Location>('/api/restaurant/location');
          setRestaurantLocation(restaurantRes.data);
        } catch (restaurantErr) {
          console.error('Error fetching restaurant location:', restaurantErr);
        }
      } catch (err: any) {
        console.error('Error fetching order status:', err);
        setError(err.response?.data?.message || 'Failed to load order status');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();

    // Subscribe to real-time updates
    socketService.subscribeToOrder(orderId, (status) => {
      setOrderStatus(status);
    });

    return () => {
      socketService.unsubscribeFromOrder(orderId);
    };
  }, [orderId]);

  const getActiveStep = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  // Calculate the center of the map based on both locations
  const calculateMapCenter = (location1: Location | null | undefined, location2: Location | null | undefined) => {
    if (location1 && location2) {
      return {
        lat: (location1.lat + location2.lat) / 2,
        lng: (location1.lng + location2.lng) / 2
      };
    }
    return location1 || location2 || { lat: 40.7128, lng: -74.0060 }; // Default to NYC if no locations
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!orderStatus) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Order not found
        </Alert>
      </Container>
    );
  }

  // Extract location from tracking object if available
  const deliveryLocation = orderStatus.tracking?.currentLocation;
  const estimatedArrival = orderStatus.tracking?.estimatedArrival;

  // Calculate map center based on both locations
  const mapCenter = calculateMapCenter(restaurantLocation, deliveryLocation);

  // Calculate appropriate zoom level based on distance between points
  let zoomLevel = 15;
  if (restaurantLocation && deliveryLocation) {
    const distance = Math.sqrt(
      Math.pow(restaurantLocation.lat - deliveryLocation.lat, 2) + 
      Math.pow(restaurantLocation.lng - deliveryLocation.lng, 2)
    );
    zoomLevel = distance > 0.05 ? 12 : 15;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Track Your Order
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stepper activeStep={getActiveStep(orderStatus.status)}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Status
              </Typography>
              <Typography variant="body1" gutterBottom>
                Current Status: {orderStatus.status.replace(/_/g, ' ').toUpperCase()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Order Date: {new Date(orderStatus.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Delivery Address: {orderStatus.deliveryAddress}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Total Amount: ${orderStatus.totalAmount.toFixed(2)}
              </Typography>
              {estimatedArrival && (
                <Typography variant="body1" gutterBottom>
                  Estimated Arrival: {new Date(estimatedArrival).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        {(deliveryLocation || restaurantLocation) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Tracking
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {restaurantLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'blue', mr: 1 }} />
                      <Typography variant="body2">Restaurant Location</Typography>
                    </Box>
                  )}
                  {deliveryLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'red', mr: 1 }} />
                      <Typography variant="body2">Delivery Location</Typography>
                    </Box>
                  )}
                </Box>
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={zoomLevel}
                  >
                    {restaurantLocation && (
                      <Marker 
                        position={restaurantLocation} 
                        icon={restaurantIcon}
                        title="Restaurant Location"
                      />
                    )}
                    {deliveryLocation && (
                      <Marker 
                        position={deliveryLocation} 
                        icon={customerIcon}
                        title="Current Delivery Location"
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default OrderTracking; 