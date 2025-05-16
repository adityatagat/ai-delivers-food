import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import OrderTracking from '../OrderTracking';
import { api } from '../../services/api';
import { socketService } from '../../services/socketService';
import { act } from 'react-dom/test-utils';

// Mock the API and socket service
jest.mock('../../services/api');
jest.mock('../../services/socketService');

const mockStore = configureStore([]);

describe('OrderTracking Component', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({});
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/tracking/123']}>
          <Routes>
            <Route path="/tracking/:orderId" element={<OrderTracking />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders order status when data is loaded', async () => {
    const mockOrderStatus = {
      status: 'PREPARING',
      estimatedDelivery: '2024-03-20T17:30:00.000Z',
      currentLocation: { lat: 0, lng: 0 }
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOrderStatus });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/tracking/123']}>
            <Routes>
              <Route path="/tracking/:orderId" element={<OrderTracking />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Current Status:/)).toBeInTheDocument();
      expect(screen.getByText(/PREPARING/)).toBeInTheDocument();
      expect(screen.getByText(/Estimated Delivery:/)).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/tracking/123']}>
            <Routes>
              <Route path="/tracking/:orderId" element={<OrderTracking />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load order status')).toBeInTheDocument();
    });
  });

  it('subscribes to socket updates when component mounts', async () => {
    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/tracking/123']}>
            <Routes>
              <Route path="/tracking/:orderId" element={<OrderTracking />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });

    expect(socketService.subscribeToOrder).toHaveBeenCalledWith('123', expect.any(Function));
  });

  it('unsubscribes from socket updates when component unmounts', async () => {
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/tracking/123']}>
          <Routes>
            <Route path="/tracking/:orderId" element={<OrderTracking />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    unmount();

    expect(socketService.unsubscribeFromOrder).toHaveBeenCalledWith('123');
  });
}); 