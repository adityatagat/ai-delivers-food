import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { removeItem, updateQuantity } from '../../store/slices/cartSlice';
import Cart from '../Cart';
import { RootState } from '../../store';

jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn()
  }
}));

function makeStore(preloadedState: Partial<RootState>) {
  return configureStore({
    reducer: { cart: cartReducer },
    preloadedState,
  });
}

describe('Cart Component', () => {
  it('renders empty cart message when cart is empty', () => {
    const store = makeStore({ cart: { items: [], total: 0 } });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('renders cart items when cart has items', () => {
    const store = makeStore({
      cart: {
        items: [
          { id: '1', name: 'Test Item', price: 10.99, quantity: 2, image: 'test.jpg' }
        ],
        total: 21.98
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('removes item when delete button is clicked', () => {
    const store = makeStore({
      cart: {
        items: [
          { id: '1', name: 'Test Item', price: 10.99, quantity: 2, image: 'test.jpg' }
        ],
        total: 21.98
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Check state after dispatch
    const state = store.getState();
    expect(state.cart.items).toHaveLength(0);
  });

  it('updates quantity when add button is clicked', () => {
    const store = makeStore({
      cart: {
        items: [
          { id: '1', name: 'Test Item', price: 10.99, quantity: 2, image: 'test.jpg' }
        ],
        total: 21.98
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    // Check state after dispatch
    const state = store.getState();
    expect(state.cart.items[0].quantity).toBe(3);
  });

  it('shows error message when checkout fails', async () => {
    const store = makeStore({
      cart: {
        items: [
          { id: '1', name: 'Test Item', price: 10.99, quantity: 2, image: 'test.jpg' }
        ],
        total: 21.98
      }
    });

    const mockApi = require('../../services/api').api;
    mockApi.post.mockRejectedValue(new Error('Checkout failed'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );

    const checkoutButton = screen.getByText('Proceed to Checkout');
    fireEvent.click(checkoutButton);

    expect(await screen.findByText('Failed to create order. Please try again.')).toBeInTheDocument();
  });
}); 