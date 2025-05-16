import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { addItem } from '../store/slices/cartSlice';
import { fetchMenus, Menu, FoodItem } from '../store/slices/menuSlice';
import { RootState } from '../store';

function MenuPage() {
  const dispatch = useDispatch();
  const { menus, loading, error } = useSelector((state: RootState) => state.menu);

  useEffect(() => {
    dispatch(fetchMenus() as any);
  }, [dispatch]);

  // Flatten all menu items (if you want to show all items from all menus)
  const items: FoodItem[] = menus?.flatMap((menu: Menu) => menu.items) || [];

  const handleAddToCart = (item: FoodItem) => {
    dispatch(addItem({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
      quantity: 1,
    }));
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

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Our Menu
      </Typography>
      <Grid container spacing={4}>
        {items.map((item: FoodItem) => (
          <Grid item key={item._id} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.imageUrl}
                alt={item.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${item.price.toFixed(2)}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default MenuPage; 