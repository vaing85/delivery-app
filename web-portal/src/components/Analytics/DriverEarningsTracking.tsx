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
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DriverEarningsTrackingProps {
  driverId: string;
}

interface EarningsData {
  date: string;
  earnings: number;
  deliveries: number;
  tips: number;
  bonuses: number;
}

interface PaymentMethod {
  id: string;
  type: 'bank' | 'card' | 'cash';
  name: string;
  isDefault: boolean;
  lastUsed: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'delivery' | 'tip' | 'bonus' | 'adjustment';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

const DriverEarningsTracking: React.FC<DriverEarningsTrackingProps> = ({ driverId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Mock data
  const earningsData: EarningsData[] = [
    { date: '2024-01-01', earnings: 120, deliveries: 8, tips: 25, bonuses: 10 },
    { date: '2024-01-02', earnings: 95, deliveries: 6, tips: 18, bonuses: 5 },
    { date: '2024-01-03', earnings: 140, deliveries: 9, tips: 32, bonuses: 15 },
    { date: '2024-01-04', earnings: 110, deliveries: 7, tips: 22, bonuses: 8 },
    { date: '2024-01-05', earnings: 160, deliveries: 10, tips: 35, bonuses: 20 },
    { date: '2024-01-06', earnings: 130, deliveries: 8, tips: 28, bonuses: 12 },
    { date: '2024-01-07', earnings: 145, deliveries: 9, tips: 30, bonuses: 18 },
  ];

  const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'bank', name: 'Chase Bank ****1234', isDefault: true, lastUsed: '2024-01-07' },
    { id: '2', type: 'card', name: 'Visa ****5678', isDefault: false, lastUsed: '2024-01-05' },
  ];

  const transactions: Transaction[] = [
    { id: '1', date: '2024-01-07', type: 'delivery', amount: 45, description: 'Delivery #12345', status: 'completed' },
    { id: '2', date: '2024-01-07', type: 'tip', amount: 8, description: 'Tip from customer', status: 'completed' },
    { id: '3', date: '2024-01-06', type: 'bonus', amount: 15, description: 'Weekend bonus', status: 'completed' },
    { id: '4', date: '2024-01-06', type: 'delivery', amount: 38, description: 'Delivery #12344', status: 'completed' },
    { id: '5', date: '2024-01-05', type: 'tip', amount: 12, description: 'Tip from customer', status: 'completed' },
  ];

  const earningsSummary = {
    totalEarnings: 2450,
    thisWeek: 890,
    lastWeek: 780,
    averagePerDelivery: 15.6,
    totalTips: 180,
    totalBonuses: 95,
    pendingAmount: 120,
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <DeliveryIcon color="primary" />;
      case 'tip': return <StarIcon color="warning" />;
      case 'bonus': return <TrendingUpIcon color="success" />;
      case 'adjustment': return <ReceiptIcon color="info" />;
      default: return <MoneyIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Earnings & Payments
        </Typography>
        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Transactions" />
        <Tab label="Payment Methods" />
        <Tab label="Analytics" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Earnings Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Total Earnings</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  ${earningsSummary.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">This Week</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  ${earningsSummary.thisWeek}
                </Typography>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +14% vs last week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <StarIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Total Tips</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  ${earningsSummary.totalTips}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This {timeRange}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Pending</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  ${earningsSummary.pendingAmount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next payout
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Earnings Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="#8884d8" name="Earnings" />
                    <Line type="monotone" dataKey="tips" stroke="#82ca9d" name="Tips" />
                    <Line type="monotone" dataKey="bonuses" stroke="#ffc658" name="Bonuses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <DeliveryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average per Delivery"
                      secondary={`$${earningsSummary.averagePerDelivery}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tip Rate"
                      secondary="73% of deliveries"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Bonuses"
                      secondary={`$${earningsSummary.totalBonuses}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Next Payout"
                      secondary="Monday, Jan 8"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Recent Transactions</Typography>
                  <Button variant="outlined" startIcon={<PrintIcon />}>
                    Print Statement
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getTransactionIcon(transaction.type)}
                              <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                                {transaction.type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="success.main">
                              +${transaction.amount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.status} 
                              color={getStatusColor(transaction.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <ReceiptIcon />
                            </IconButton>
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

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Payment Methods</Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Add Payment Method
                  </Button>
                </Box>
                <List>
                  {paymentMethods.map((method, index) => (
                    <React.Fragment key={method.id}>
                      <ListItem>
                        <ListItemIcon>
                          {method.type === 'bank' ? <BankIcon color="primary" /> : <CardIcon color="primary" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={method.name}
                          secondary={`Last used: ${method.lastUsed}`}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          {method.isDefault && (
                            <Chip label="Default" color="primary" size="small" />
                          )}
                          <Button size="small" variant="outlined">
                            Edit
                          </Button>
                        </Box>
                      </ListItem>
                      {index < paymentMethods.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payout Schedule
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Weekly Payouts"
                      secondary="Every Monday"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Minimum Payout"
                      secondary="$25"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Processing Time"
                      secondary="1-2 business days"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Earnings by Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Deliveries', value: 85, color: '#8884d8' },
                        { name: 'Tips', value: 10, color: '#82ca9d' },
                        { name: 'Bonuses', value: 5, color: '#ffc658' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Deliveries', value: 85, color: '#8884d8' },
                        { name: 'Tips', value: 10, color: '#82ca9d' },
                        { name: 'Bonuses', value: 5, color: '#ffc658' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Account Name"
            margin="normal"
            placeholder="Enter account holder name"
          />
          <TextField
            fullWidth
            label="Account Number"
            margin="normal"
            placeholder="Enter account number"
          />
          <TextField
            fullWidth
            label="Routing Number"
            margin="normal"
            placeholder="Enter routing number"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Account Type</InputLabel>
            <Select label="Account Type">
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Payment Method</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DriverEarningsTracking;
