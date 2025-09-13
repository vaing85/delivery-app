import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ordersAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
      return 'info';
    case 'ASSIGNED':
      return 'primary';
    case 'PICKED_UP':
      return 'secondary';
    case 'IN_TRANSIT':
      return 'info';
    case 'OUT_FOR_DELIVERY':
      return 'primary';
    case 'DELIVERED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'CANCELLED':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    driverId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Fetch orders
  const { data: ordersData, isLoading, error, refetch } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, limit, filters],
    queryFn: async () => {
      // Filter out empty string values to prevent API validation errors
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      // For customers, automatically filter by their customer ID
      const queryParams = {
        page,
        limit,
        ...cleanFilters
      };
      
      // If user is a customer, only show their orders
      if (user?.role === 'CUSTOMER') {
        queryParams.customerId = user.id;
      }
      
      const response = await ordersAPI.getOrders(queryParams);
      return response;
    },
    keepPreviousData: true,
    enabled: isAuthenticated
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await ordersAPI.deleteOrder(orderId);
    },
    onSuccess: () => {
      toast.success('Order deleted successfully');
      queryClient.invalidateQueries(['orders']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  });

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await deleteOrderMutation.mutateAsync(orderId);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
      try {
        await Promise.all(selectedOrders.map(id => deleteOrderMutation.mutateAsync(id)));
        setSelectedOrders([]);
      } catch (error) {
        toast.error('Failed to delete some orders');
      }
    }
  };

  // Handle order selection
  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedOrders.length === ordersData?.data.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(ordersData?.data.map(order => order.id) || []);
    }
  };

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load orders. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Main Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Orders
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          {/* Only show Refresh and New Order buttons for non-customer users */}
          {user?.role !== 'CUSTOMER' && (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/orders/create')}
              >
                New Order
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Customer-specific Order Summary */}
      {user?.role === 'CUSTOMER' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {ordersData?.data.filter(o => o.status === 'PENDING').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Orders
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {ordersData?.data.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivered
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {ordersData?.data.filter(o => o.status === 'CANCELLED').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cancelled
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" mb={2}>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={user?.role === 'CUSTOMER' ? "Order Number" : "Search"}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={user?.role === 'CUSTOMER' ? "Order number..." : "Order number, customer..."}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="ASSIGNED">Assigned</MenuItem>
                  <MenuItem value="PICKED_UP">Picked Up</MenuItem>
                  <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                  <MenuItem value="OUT_FOR_DELIVERY">Out for Delivery</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>
              {selectedOrders.length} order(s) selected
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              disabled={deleteOrderMutation.isLoading}
            >
              Delete Selected
            </Button>
          </Box>
        </Paper>
      )}

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === ordersData?.data.length && ordersData.data.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pickup Address</TableCell>
                <TableCell>Delivery Address</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : ordersData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ordersData?.data.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleOrderSelection(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customer.firstName} {order.customer.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items.length} item(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${order.total.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal: ${order.subtotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap maxWidth={150}>
                        {order.pickupAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap maxWidth={150}>
                        {order.deliveryAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Order">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Order">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/orders/${order.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Order">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleteOrderMutation.isLoading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {ordersData?.pagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={ordersData.pagination.pages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4">
                {ordersData?.pagination.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {ordersData?.data.filter(o => o.status === 'PENDING').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="info.main">
                {ordersData?.data.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrdersPage;
