import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { api } from '../services/api';

// Define backend response types
interface OrderItem {
  foodItem: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
  price: number;
  _id: string;
}

interface BackendOrder {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: BackendOrder[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

function Orders() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders...');
        const response = await api.get<OrdersResponse>(`/api/orders?page=${page}&limit=10`);
        console.log('Orders response:', response.data);
        setOrderData(response.data);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'out_for_delivery':
      case 'ready':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
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

  // Orders array is now properly accessed from the response
  const orders = orderData?.orders || [];

  if (orders.length === 0) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" gutterBottom>
            No orders found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/menu')}
          >
            Order Now
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Orders
      </Typography>
      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order._id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6" gutterBottom>
                      Order #{order._id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {order.items.map((item) => (
                        <Typography key={item._id} variant="body2">
                          {item.quantity}x {item.foodItem.name} - ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Chip
                        label={order.status.replace(/_/g, ' ').toUpperCase()}
                        color={getStatusColor(order.status)}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="h6" gutterBottom>
                        Total: ${order.totalAmount.toFixed(2)}
                      </Typography>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/tracking/${order._id}`)}
                        >
                          Track Order
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Add pagination if there are multiple pages */}
      {orderData && orderData.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={orderData.pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
}

export default Orders; 