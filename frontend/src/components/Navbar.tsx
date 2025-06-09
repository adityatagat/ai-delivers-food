import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const drawer = (
    <Box 
      sx={{ 
        width: 250,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
      }} 
      role="presentation" 
      onClick={handleDrawerToggle}
    >
      <List>
        <ListItem button component={RouterLink} to="/menu">
          <ListItemText primary="Menu" />
        </ListItem>
        <ListItem button component={RouterLink} to="/cart">
          <ListItemIcon>
            <Badge badgeContent={items.length} color="secondary">
              <CartIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Cart" />
        </ListItem>
        {isAuthenticated ? (
          <>
            <ListItem button component={RouterLink} to="/orders">
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="My Orders" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={RouterLink} to="/login">
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button component={RouterLink} to="/register">
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
      <Box>
        <Divider />
        {isAuthenticated && (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
        <ListItem>
          <ThemeToggle />
          <ListItemText primary={isMobile ? 'Toggle Theme' : ''} sx={{ ml: 1 }} />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            AI Delivers Food!
          </Typography>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                component={RouterLink}
                to="/menu"
              >
                Menu
              </Button>

              <IconButton
                color="inherit"
                component={RouterLink}
                to="/cart"
              >
                <Badge badgeContent={items.length} color="secondary">
                  <CartIcon />
                </Badge>
              </IconButton>

              {isAuthenticated ? (
                <>
                  <IconButton
                    color="inherit"
                    component={RouterLink}
                    to="/orders"
                  >
                    <PersonIcon />
                  </IconButton>
                  <IconButton
                    color="inherit"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogoutIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                  >
                    Login
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  >
                    Register
                  </Button>
                </>
              )}
              <ThemeToggle />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/cart"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={items.length} color="secondary">
                  <CartIcon />
                </Badge>
              </IconButton>
              <ThemeToggle />
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 250,
              mt: '64px' // Height of the AppBar
            },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Box>
  );
};

export default Navbar; 