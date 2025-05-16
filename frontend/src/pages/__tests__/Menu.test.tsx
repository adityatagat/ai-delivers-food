import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Menu from '../Menu';
import { api } from '../../services/api';

// Mock the api module
jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn()
  }
}));

const mockStore = configureStore([]);

describe('Menu Component', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({});
    store.dispatch = jest.fn();
  });

  it('renders loading state initially', () => {
    render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders menu items when data is loaded', async () => {
    const mockMenuItems = [
      {
        id: '1',
        name: 'Test Item',
        description: 'Test Description',
        price: 10.99,
        image: 'test.jpg',
        category: 'test'
      }
    ];

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockMenuItems });

    render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('$10.99')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items')).toBeInTheDocument();
    });
  });

  it('dispatches addItem when Add to Cart button is clicked', async () => {
    const mockMenuItems = [
      {
        id: '1',
        name: 'Test Item',
        description: 'Test Description',
        price: 10.99,
        image: 'test.jpg',
        category: 'test'
      }
    ];

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockMenuItems });

    render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    await waitFor(() => {
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);
    });

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'cart/addItem',
      payload: {
        id: '1',
        name: 'Test Item',
        description: 'Test Description',
        price: 10.99,
        image: 'test.jpg',
        category: 'test',
        quantity: 1
      }
    });
  });
}); 