import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Avatar,
  Badge,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  PhotoCamera as CameraIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface DriverDeliveryHistoryProps {
  driverId: string;
}

interface DeliveryRecord {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'completed' | 'cancelled' | 'failed';
  rating: number;
  tip: number;
  earnings: number;
  distance: number;
  duration: number;
  notes: string;
  photos: string[];
  customerFeedback: string;
}

interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  totalEarnings: number;
  totalTips: number;
  averageDeliveryTime: number;
  totalDistance: number;
}

const DriverDeliveryHistory: React.FC<DriverDeliveryHistoryProps> = ({ driverId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const deliveryHistory: DeliveryRecord[] = [
    {
      id: '1',
      orderNumber: 'ORD-001234',
      date: '2024-01-07',
      time: '14:30',
      customerName: 'John Smith',
      customerPhone: '+1 (555) 123-4567',
      pickupAddress: '123 Main St, Downtown',
      deliveryAddress: '456 Oak Ave, Uptown',
      status: 'completed',
      rating: 5,
      tip: 8,
      earnings: 15,
      distance: 3.2,
      duration: 25,
      notes: 'Delivered to front door, customer was home',
      photos: ['photo1.jpg', 'photo2.jpg'],
      customerFeedback: 'Excellent service, very professional!'
    },
    {
      id: '2',
      orderNumber: 'ORD-001235',
      date: '2024-01-07',
      time: '16:45',
      customerName: 'Sarah Johnson',
      customerPhone: '+1 (555) 234-5678',
      pickupAddress: '789 Pine St, Midtown',
      deliveryAddress: '321 Elm St, Eastside',
      status: 'completed',
      rating: 4,
      tip: 5,
      earnings: 12,
      distance: 2.8,
      duration: 22,
      notes: 'Left at door as requested',
      photos: ['photo3.jpg'],
      customerFeedback: 'Good delivery, arrived on time'
    },
    {
      id: '3',
      orderNumber: 'ORD-001236',
      date: '2024-01-06',
      time: '12:15',
      customerName: 'Mike Wilson',
      customerPhone: '+1 (555) 345-6789',
      pickupAddress: '555 Broadway, Westside',
      deliveryAddress: '777 Sunset Blvd, Beachside',
      status: 'completed',
      rating: 5,
      tip: 12,
      earnings: 18,
      distance: 4.5,
      duration: 35,
      notes: 'Customer met at door, very friendly',
      photos: ['photo4.jpg', 'photo5.jpg'],
      customerFeedback: 'Amazing service! Will definitely order again.'
    },
    {
      id: '4',
      orderNumber: 'ORD-001237',
      date: '2024-01-06',
      time: '18:20',
      customerName: 'Lisa Brown',
      customerPhone: '+1 (555) 456-7890',
      pickupAddress: '999 Market St, Downtown',
      deliveryAddress: '111 Park Ave, Northside',
      status: 'cancelled',
      rating: 0,
      tip: 0,
      earnings: 0,
      distance: 2.1,
      duration: 0,
      notes: 'Customer cancelled order before pickup',
      photos: [],
      customerFeedback: ''
    },
    {
      id: '5',
      orderNumber: 'ORD-001238',
      date: '2024-01-05',
      time: '15:30',
      customerName: 'David Lee',
      customerPhone: '+1 (555) 567-8901',
      pickupAddress: '333 First St, Southside',
      deliveryAddress: '666 Second St, Southside',
      status: 'completed',
      rating: 3,
      tip: 3,
      earnings: 10,
      distance: 1.5,
      duration: 18,
      notes: 'Delivery completed successfully',
      photos: ['photo6.jpg'],
      customerFeedback: 'Delivery was okay, could be faster'
    }
  ];

  const deliveryStats: DeliveryStats = {
    totalDeliveries: 156,
    completedDeliveries: 148,
    cancelledDeliveries: 8,
    averageRating: 4.7,
    totalEarnings: 2450,
    totalTips: 180,
    averageDeliveryTime: 28,
    totalDistance: 450
  };

  const filteredDeliveries = deliveryHistory.filter(delivery => {
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || 
      (ratingFilter === '5' && delivery.rating === 5) ||
      (ratingFilter === '4+' && delivery.rating >= 4) ||
      (ratingFilter === '3-' && delivery.rating <= 3);
    const matchesSearch = searchTerm === '' || 
      delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesRating && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'failed': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'cancelled': return <CancelIcon color="error" />;
      case 'failed': return <WarningIcon color="warning" />;
      default: return <ScheduleIcon />;
    }
  };

  const handleViewDetails = (delivery: DeliveryRecord) => {
    setSelectedDelivery(delivery);
    setShowDetailsDialog(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Delivery History
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Deliveries" />
        <Tab label="Statistics" />
        <Tab label="Customer Reviews" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="Search orders or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ minWidth: 250 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Rating</InputLabel>
                    <Select
                      value={ratingFilter}
                      label="Rating"
                      onChange={(e) => setRatingFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Ratings</MenuItem>
                      <MenuItem value="5">5 Stars</MenuItem>
                      <MenuItem value="4+">4+ Stars</MenuItem>
                      <MenuItem value="3-">3- Stars</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Delivery List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Deliveries ({filteredDeliveries.length})
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Earnings</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDeliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {delivery.orderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {delivery.customerName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {delivery.customerName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {delivery.customerPhone}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {delivery.date}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {delivery.time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getStatusIcon(delivery.status)}
                              label={delivery.status}
                              color={getStatusColor(delivery.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {delivery.rating > 0 ? (
                              <Box display="flex" alignItems="center">
                                <Rating value={delivery.rating} readOnly size="small" />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {delivery.rating}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No rating
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main">
                              ${delivery.earnings}
                            </Typography>
                            {delivery.tip > 0 && (
                              <Typography variant="caption" color="warning.main">
                                +${delivery.tip} tip
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewDetails(delivery)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <DeliveryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Total Deliveries</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {deliveryStats.totalDeliveries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deliveryStats.completedDeliveries} completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <StarIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Average Rating</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {deliveryStats.averageRating}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of 5.0
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TimeIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Avg. Time</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {deliveryStats.averageDeliveryTime}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per delivery
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Total Distance</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {deliveryStats.totalDistance}km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All deliveries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Reviews & Feedback
                </Typography>
                <List>
                  {deliveryHistory
                    .filter(delivery => delivery.customerFeedback)
                    .map((delivery, index) => (
                    <React.Fragment key={delivery.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {delivery.customerName.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {delivery.customerName}
                              </Typography>
                              <Rating value={delivery.rating} readOnly size="small" />
                              <Chip label={delivery.orderNumber} size="small" />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {delivery.customerFeedback}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {delivery.date} at {delivery.time}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < deliveryHistory.filter(d => d.customerFeedback).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Delivery Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Delivery Details - {selectedDelivery?.orderNumber}
            </Typography>
            <Chip 
              icon={selectedDelivery ? getStatusIcon(selectedDelivery.status) : undefined}
              label={selectedDelivery?.status}
              color={selectedDelivery ? getStatusColor(selectedDelivery.status) as any : 'default'}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">{selectedDelivery.customerName}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">{selectedDelivery.customerPhone}</Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                  Delivery Information
                </Typography>
                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="medium">Pickup:</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 3, mb: 1 }}>
                    {selectedDelivery.pickupAddress}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="medium">Delivery:</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 3 }}>
                    {selectedDelivery.deliveryAddress}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Delivery Metrics
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Distance:</Typography>
                    <Typography variant="body2">{selectedDelivery.distance} km</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Duration:</Typography>
                    <Typography variant="body2">{selectedDelivery.duration} minutes</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Earnings:</Typography>
                    <Typography variant="body2" color="success.main">${selectedDelivery.earnings}</Typography>
                  </Box>
                  {selectedDelivery.tip > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Tip:</Typography>
                      <Typography variant="body2" color="warning.main">${selectedDelivery.tip}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Rating:</Typography>
                    <Rating value={selectedDelivery.rating} readOnly size="small" />
                  </Box>
                </Box>

                {selectedDelivery.notes && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {selectedDelivery.notes}
                    </Typography>
                  </>
                )}

                {selectedDelivery.customerFeedback && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Customer Feedback
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDelivery.customerFeedback}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DriverDeliveryHistory;
