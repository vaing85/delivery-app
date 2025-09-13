import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  ShoppingCart as CartIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ordersAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// Form validation schema
const orderSchema = z.object({
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  scheduledPickup: z.string().optional(),
  scheduledDelivery: z.string().optional(),
  instructions: z.string().optional(),
  isFragile: z.boolean().default(false),
  requiresSignature: z.boolean().default(true),
  requiresPhoto: z.boolean().default(true)
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  dimensions: string;
}

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      isFragile: false,
      requiresSignature: true,
      requiresPhoto: true
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const orderData = {
        ...data,
        items: items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight,
          dimensions: item.dimensions
        }))
      };
      
      return await ordersAPI.createOrder(orderData);
    },
    onSuccess: (data) => {
      toast.success('Order created successfully!');
      queryClient.invalidateQueries(['orders']);
      navigate(`/orders/${data.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    }
  });

  // Handle form submission
  const onSubmit = (data: OrderFormData) => {
    if (items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }
    
    createOrderMutation.mutate(data);
  };

  // Item management
  const addItem = (item: Omit<OrderItem, 'id'>) => {
    const newItem: OrderItem = {
      ...item,
      id: Date.now().toString()
    };
    setItems(prev => [...prev, newItem]);
    setShowItemDialog(false);
  };

  const updateItem = (item: OrderItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
    setShowItemDialog(false);
  };

  const deleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const editItem = (item: OrderItem) => {
    setEditingItem(item);
    setShowItemDialog(true);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.1; // 10% tax
  const deliveryFee = 5.0; // Fixed delivery fee
  const total = subtotal + tax + deliveryFee;

  // Steps
  const steps = [
    {
      label: 'Order Details',
      description: 'Basic order information and addresses'
    },
    {
      label: 'Items',
      description: 'Add items to be delivered'
    },
    {
      label: 'Options & Instructions',
      description: 'Special requirements and scheduling'
    },
    {
      label: 'Review & Submit',
      description: 'Review order details and submit'
    }
  ];

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
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

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Create New Order
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/orders')}
        >
          Cancel
        </Button>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="horizontal">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Order Details */}
        {activeStep === 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={3} display="flex" alignItems="center">
              <LocationIcon sx={{ mr: 1 }} />
              Order Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="pickupAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Pickup Address"
                      multiline
                      rows={3}
                      error={!!errors.pickupAddress}
                      helperText={errors.pickupAddress?.message}
                      required
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="deliveryAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Delivery Address"
                      multiline
                      rows={3}
                      error={!!errors.deliveryAddress}
                      helperText={errors.deliveryAddress?.message}
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="scheduledPickup"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Scheduled Pickup"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="scheduledDelivery"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Scheduled Delivery"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Step 2: Items */}
        {activeStep === 1 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" display="flex" alignItems="center">
                <CartIcon sx={{ mr: 1 }} />
                Order Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowItemDialog(true)}
              >
                Add Item
              </Button>
            </Box>

            {items.length === 0 ? (
              <Alert severity="info">
                No items added yet. Click "Add Item" to get started.
              </Alert>
            ) : (
              <List>
                {items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={item.name}
                        secondary={item.description}
                      />
                      <Box display="flex" gap={2} ml={2}>
                        <Chip label={`Qty: ${item.quantity}`} size="small" />
                        <Chip label={`$${item.unitPrice.toFixed(2)} each`} size="small" />
                        <Chip label={`Total: $${(item.quantity * item.unitPrice).toFixed(2)}`} size="small" color="primary" />
                      </Box>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => editItem(item)} sx={{ mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => deleteItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < items.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Order Summary */}
            {items.length > 0 && (
              <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Order Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Subtotal:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Tax (10%):</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">${tax.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Delivery Fee:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">${deliveryFee.toFixed(2)}</Typography>
                    </Grid>
                    <Divider sx={{ my: 1, width: '100%' }} />
                    <Grid item xs={6}>
                      <Typography variant="h6">Total:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="primary">${total.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Paper>
        )}

        {/* Step 3: Options & Instructions */}
        {activeStep === 2 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={3} display="flex" alignItems="center">
              <DescriptionIcon sx={{ mr: 1 }} />
              Options & Instructions
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="instructions"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Special Instructions"
                      multiline
                      rows={4}
                      placeholder="Any special handling instructions, delivery notes, or customer preferences..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Controller
                    name="isFragile"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Fragile Items"
                      />
                    )}
                  />

                  <Controller
                    name="requiresSignature"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Requires Signature"
                      />
                    )}
                  />

                  <Controller
                    name="requiresPhoto"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Requires Photo Proof"
                      />
                    )}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Step 4: Review & Submit */}
        {activeStep === 3 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={3}>Review Order</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Pickup Address</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {watch('pickupAddress')}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>Delivery Address</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {watch('deliveryAddress')}
                </Typography>

                {watch('instructions') && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>Special Instructions</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {watch('instructions')}
                    </Typography>
                  </>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Order Items ({items.length})</Typography>
                <List dense>
                  {items.map(item => (
                    <ListItem key={item.id}>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">${total.toFixed(2)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                type="submit"
                startIcon={<SaveIcon />}
                disabled={!isValid || items.length === 0 || createOrderMutation.isLoading}
              >
                {createOrderMutation.isLoading ? <CircularProgress size={20} /> : 'Create Order'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 1 && items.length === 0}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </form>

      {/* Customer-specific Features */}
      {user?.role === 'CUSTOMER' && (
        <>
          {/* Saved Addresses */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Saved Addresses
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Home Address
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          123 Main Street, Apt 4B<br />
                          New York, NY 10001
                        </Typography>
                      </Box>
                      <Chip label="Default" size="small" color="primary" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => setValue('pickupAddress', '123 Main Street, Apt 4B, New York, NY 10001')}>
                      Use as Pickup
                    </Button>
                    <Button size="small" onClick={() => setValue('deliveryAddress', '123 Main Street, Apt 4B, New York, NY 10001')}>
                      Use as Delivery
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Work Address
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      456 Business Ave, Suite 200<br />
                      New York, NY 10002
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => setValue('pickupAddress', '456 Business Ave, Suite 200, New York, NY 10002')}>
                      Use as Pickup
                    </Button>
                    <Button size="small" onClick={() => setValue('deliveryAddress', '456 Business Ave, Suite 200, New York, NY 10002')}>
                      Use as Delivery
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Delivery Preferences */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Delivery Time</InputLabel>
                  <Select
                    value="anytime"
                    label="Preferred Delivery Time"
                    onChange={() => {}}
                  >
                    <MenuItem value="anytime">Any Time</MenuItem>
                    <MenuItem value="morning">Morning (8 AM - 12 PM)</MenuItem>
                    <MenuItem value="afternoon">Afternoon (12 PM - 5 PM)</MenuItem>
                    <MenuItem value="evening">Evening (5 PM - 9 PM)</MenuItem>
                    <MenuItem value="night">Night (9 PM - 12 AM)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Contact Method</InputLabel>
                  <Select
                    value="both"
                    label="Contact Method"
                    onChange={() => {}}
                  >
                    <MenuItem value="email">Email Only</MenuItem>
                    <MenuItem value="sms">SMS Only</MenuItem>
                    <MenuItem value="both">Both Email & SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Special Instructions"
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="e.g., Leave at front door, Call before delivery, etc."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Loyalty Benefits */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Loyalty Benefits
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Free Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orders over $50
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Priority Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Faster response times
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Exclusive Offers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Member-only discounts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Birthday Rewards
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Special birthday offers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* Item Dialog */}
      <ItemDialog
        open={showItemDialog}
        onClose={() => {
          setShowItemDialog(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? updateItem : addItem}
        item={editingItem}
      />
    </Box>
  );
};

// Item Dialog Component
interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Omit<OrderItem, 'id'>) => void;
  item: OrderItem | null;
}

const ItemDialog: React.FC<ItemDialogProps> = ({ open, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    quantity: item?.quantity || 1,
    unitPrice: item?.unitPrice || 0,
    weight: item?.weight || 0,
    dimensions: item?.dimensions || ''
  });

  const handleSave = () => {
    if (!formData.name || formData.quantity <= 0 || formData.unitPrice <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave(formData);
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      weight: 0,
      dimensions: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {item ? 'Edit Item' : 'Add New Item'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              required
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Unit Price ($)"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Dimensions"
              value={formData.dimensions}
              onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
              placeholder="L x W x H"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {item ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderPage;
