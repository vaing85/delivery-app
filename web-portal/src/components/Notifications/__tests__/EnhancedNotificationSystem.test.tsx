import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EnhancedNotificationSystem from '../EnhancedNotificationSystem';

// Mock the websocket service
jest.mock('../../../services/websocketService', () => ({
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
jest.mock('../../../services/api', () => ({
  notificationsAPI: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getUnreadCount: jest.fn()
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
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('EnhancedNotificationSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays notification count badge', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    // Should show unread count badge
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 unread notifications
  });

  it('shows filter controls', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notifications...')).toBeInTheDocument();
  });

  it('displays notification items', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Delivery In Progress')).toBeInTheDocument();
    expect(screen.getByText('Payment Processed')).toBeInTheDocument();
    expect(screen.getByText('System Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Special Promotion')).toBeInTheDocument();
  });

  it('shows notification types as chips', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    expect(screen.getByText('ORDER UPDATE')).toBeInTheDocument();
    expect(screen.getByText('DELIVERY STATUS')).toBeInTheDocument();
    expect(screen.getByText('PAYMENT')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
    expect(screen.getByText('PROMOTION')).toBeInTheDocument();
  });

  it('opens settings dialog when settings button is clicked', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  it('opens compose dialog when compose button is clicked', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const composeButton = screen.getByRole('button', { name: /compose/i });
    fireEvent.click(composeButton);
    
    expect(screen.getByText('Compose Notification')).toBeInTheDocument();
  });

  it('filters notifications by status', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const unreadOption = screen.getByText('Unread');
    fireEvent.click(unreadOption);
    
    // Should only show unread notifications
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Delivery In Progress')).toBeInTheDocument();
    expect(screen.getByText('Special Promotion')).toBeInTheDocument();
    
    // Read notifications should not be visible
    expect(screen.queryByText('Payment Processed')).not.toBeInTheDocument();
    expect(screen.queryByText('System Maintenance')).not.toBeInTheDocument();
  });

  it('filters notifications by type', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);
    
    const orderUpdateOption = screen.getByText('Order Updates');
    fireEvent.click(orderUpdateOption);
    
    // Should only show order update notifications
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    
    // Other types should not be visible
    expect(screen.queryByText('Delivery In Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Processed')).not.toBeInTheDocument();
  });

  it('searches notifications by text', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const searchInput = screen.getByPlaceholderText('Search notifications...');
    fireEvent.change(searchInput, { target: { value: 'order' } });
    
    // Should only show notifications containing "order"
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    
    // Other notifications should not be visible
    expect(screen.queryByText('Delivery In Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Processed')).not.toBeInTheDocument();
  });

  it('marks all notifications as read', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    const markAllReadButton = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllReadButton);
    
    // Should show success message
    expect(screen.getByText('All notifications marked as read')).toBeInTheDocument();
  });

  it('shows notification timestamps', () => {
    renderWithProviders(<EnhancedNotificationSystem />);
    
    // Should show relative timestamps
    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('15m ago')).toBeInTheDocument();
    expect(screen.getByText('30m ago')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });
});
