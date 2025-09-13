import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../../App';

// Mock the auth store
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN'
    },
    initializeAuth: jest.fn(),
    validateTokens: jest.fn(),
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock the websocket service
jest.mock('../../services/websocketService', () => ({
  useWebSocket: () => ({
    socket: null,
    isConnected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  })
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  ordersAPI: {
    getOrders: jest.fn().mockResolvedValue({ data: [] }),
    getOrder: jest.fn().mockResolvedValue({ data: {} }),
    createOrder: jest.fn().mockResolvedValue({ data: {} }),
    updateOrder: jest.fn().mockResolvedValue({ data: {} }),
    deleteOrder: jest.fn().mockResolvedValue({ data: {} })
  },
  deliveriesAPI: {
    getDeliveries: jest.fn().mockResolvedValue({ data: [] }),
    getDelivery: jest.fn().mockResolvedValue({ data: {} }),
    createDelivery: jest.fn().mockResolvedValue({ data: {} }),
    updateDelivery: jest.fn().mockResolvedValue({ data: {} }),
    deleteDelivery: jest.fn().mockResolvedValue({ data: {} })
  },
  usersAPI: {
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
    getUser: jest.fn().mockResolvedValue({ data: {} }),
    createUser: jest.fn().mockResolvedValue({ data: {} }),
    updateUser: jest.fn().mockResolvedValue({ data: {} }),
    deleteUser: jest.fn().mockResolvedValue({ data: {} })
  },
  notificationsAPI: {
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    getUnreadCount: jest.fn().mockResolvedValue({ data: { unreadCount: 0 } }),
    markAsRead: jest.fn().mockResolvedValue({ data: {} }),
    deleteNotification: jest.fn().mockResolvedValue({ data: {} })
  }
}));

const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main app without crashing', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Delivery App')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard by default', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows navigation menu items', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Deliveries')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('displays user information in header', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('shows admin-specific menu items for admin users', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });
  });
});
