import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RealTimeAnalytics from '../RealTimeAnalytics';

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

describe('RealTimeAnalytics', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Real-Time Analytics')).toBeInTheDocument();
  });

  it('displays live metrics', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Active Orders')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Online Drivers')).toBeInTheDocument();
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
  });

  it('shows order activity chart', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Order Activity (Last 24 Hours)')).toBeInTheDocument();
  });

  it('displays status distribution chart', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Order Status Distribution')).toBeInTheDocument();
  });

  it('shows live events feed', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Live Events Feed')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('displays metric values', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    // Check that metric values are displayed
    expect(screen.getByText('24')).toBeInTheDocument(); // Active Orders
    expect(screen.getByText('8')).toBeInTheDocument(); // In Transit
    expect(screen.getByText('15')).toBeInTheDocument(); // Online Drivers
    expect(screen.getByText('2847')).toBeInTheDocument(); // Today's Revenue
  });

  it('shows trend indicators', () => {
    renderWithProviders(<RealTimeAnalytics onRefresh={mockOnRefresh} />);
    
    // Check for percentage changes
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
    expect(screen.getByText('+8.3%')).toBeInTheDocument();
    expect(screen.getByText('+15.7%')).toBeInTheDocument();
  });
});
