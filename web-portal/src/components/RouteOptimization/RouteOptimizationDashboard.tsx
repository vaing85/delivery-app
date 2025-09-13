import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Paper,
} from '@mui/material';
import {
  Route as RouteIcon,
  LocationOn,
  Schedule,
  AttachMoney,
  Speed,
  Timeline,
  Refresh,
  PlayArrow,
  Stop,
  Info,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  type: 'pickup' | 'delivery';
  orderId?: string;
  priority?: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  estimatedDuration?: number;
}

interface Route {
  id: string;
  driverId: string;
  locations: Location[];
  totalDistance: number;
  totalDuration: number;
  estimatedEarnings: number;
  optimized: boolean;
  algorithm: string;
  createdAt: string;
}

interface OptimizationResult {
  success: boolean;
  routes: Route[];
  totalDistance: number;
  totalDuration: number;
  totalEarnings: number;
  optimizationTime: number;
  algorithm: string;
  improvements?: {
    distanceReduction: number;
    timeReduction: number;
    earningsIncrease: number;
  };
}

interface Algorithm {
  id: string;
  name: string;
  description: string;
  complexity: string;
  bestFor: string;
  pros: string[];
  cons: string[];
}

const RouteOptimizationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hybrid');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlgorithmDialog, setShowAlgorithmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  // Optimization options
  const [maxRoutes, setMaxRoutes] = useState(5);
  const [maxStopsPerRoute, setMaxStopsPerRoute] = useState(15);
  const [considerTraffic, setConsiderTraffic] = useState(false);
  const [considerTimeWindows, setConsiderTimeWindows] = useState(true);
  const [weightDistance, setWeightDistance] = useState(40);
  const [weightTime, setWeightTime] = useState(30);
  const [weightEarnings, setWeightEarnings] = useState(30);

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const fetchAlgorithms = async () => {
    try {
      const response = await api.get('/route-optimization/algorithms');
      if (response.data.success) {
        setAlgorithms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    }
  };

  const handleOptimizeRoutes = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      // For demo purposes, we'll use sample locations
      const sampleLocations: Location[] = [
        {
          id: 'loc1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY',
          type: 'pickup',
          priority: 1,
          estimatedDuration: 15
        },
        {
          id: 'loc2',
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Times Square, NY',
          type: 'delivery',
          priority: 2,
          estimatedDuration: 10
        },
        {
          id: 'loc3',
          latitude: 40.7505,
          longitude: -73.9934,
          address: 'Madison Square Garden, NY',
          type: 'pickup',
          priority: 1,
          estimatedDuration: 15
        },
        {
          id: 'loc4',
          latitude: 40.7614,
          longitude: -73.9776,
          address: 'Central Park, NY',
          type: 'delivery',
          priority: 3,
          estimatedDuration: 10
        },
        {
          id: 'loc5',
          latitude: 40.6892,
          longitude: -74.0445,
          address: 'Statue of Liberty, NY',
          type: 'delivery',
          priority: 2,
          estimatedDuration: 10
        }
      ];

      const options = {
        algorithm: selectedAlgorithm,
        maxRoutes,
        maxStopsPerRoute,
        considerTraffic,
        considerTimeWindows,
        weightDistance: weightDistance / 100,
        weightTime: weightTime / 100,
        weightEarnings: weightEarnings / 100
      };

      const response = await api.post('/route-optimization/optimize', {
        locations: sampleLocations,
        options
      });

      if (response.data.success) {
        setOptimizationResult(response.data.data);
        setShowResultDialog(true);
      } else {
        setError(response.data.message || 'Optimization failed');
      }
    } catch (error: any) {
      console.error('Error optimizing routes:', error);
      setError(error.response?.data?.message || 'Failed to optimize routes');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOptimizeActiveDeliveries = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const response = await api.post('/route-optimization/optimize-active-deliveries');
      
      if (response.data.success) {
        setOptimizationResult(response.data.data);
        setShowResultDialog(true);
      } else {
        setError(response.data.message || 'Optimization failed');
      }
    } catch (error: any) {
      console.error('Error optimizing active deliveries:', error);
      setError(error.response?.data?.message || 'Failed to optimize active deliveries');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getAlgorithmInfo = () => {
    return algorithms.find(algo => algo.id === selectedAlgorithm);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Route Optimization
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Algorithm Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Algorithm
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Algorithm</InputLabel>
                <Select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  label="Algorithm"
                >
                  {algorithms.map((algorithm) => (
                    <MenuItem key={algorithm.id} value={algorithm.id}>
                      {algorithm.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {getAlgorithmInfo() && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {getAlgorithmInfo()?.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip 
                      label={`Complexity: ${getAlgorithmInfo()?.complexity}`} 
                      size="small" 
                      color="primary" 
                    />
                    <Chip 
                      label={`Best for: ${getAlgorithmInfo()?.bestFor}`} 
                      size="small" 
                      color="secondary" 
                    />
                  </Box>

                  <Button
                    size="small"
                    startIcon={<Info />}
                    onClick={() => setShowAlgorithmDialog(true)}
                  >
                    View Details
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Options
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Max Routes</InputLabel>
                    <Select
                      value={maxRoutes}
                      onChange={(e) => setMaxRoutes(Number(e.target.value))}
                      label="Max Routes"
                    >
                      {[1, 2, 3, 4, 5, 10, 15, 20].map((num) => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Max Stops per Route</InputLabel>
                    <Select
                      value={maxStopsPerRoute}
                      onChange={(e) => setMaxStopsPerRoute(Number(e.target.value))}
                      label="Max Stops per Route"
                    >
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={considerTraffic}
                        onChange={(e) => setConsiderTraffic(e.target.checked)}
                      />
                    }
                    label="Consider Traffic"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={considerTimeWindows}
                        onChange={(e) => setConsiderTimeWindows(e.target.checked)}
                      />
                    }
                    label="Consider Time Windows"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weight Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Weights
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Distance Weight: {weightDistance}%</Typography>
                  <Slider
                    value={weightDistance}
                    onChange={(_, value) => setWeightDistance(value as number)}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Time Weight: {weightTime}%</Typography>
                  <Slider
                    value={weightTime}
                    onChange={(_, value) => setWeightTime(value as number)}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Earnings Weight: {weightEarnings}%</Typography>
                  <Slider
                    value={weightEarnings}
                    onChange={(_, value) => setWeightEarnings(value as number)}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimize Routes
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleOptimizeRoutes}
                  disabled={isOptimizing}
                  size="large"
                >
                  Optimize Sample Routes
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RouteIcon />}
                  onClick={handleOptimizeActiveDeliveries}
                  disabled={isOptimizing}
                  size="large"
                >
                  Optimize Active Deliveries
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<Refresh />}
                  onClick={() => {
                    setOptimizationResult(null);
                    setError(null);
                  }}
                  disabled={isOptimizing}
                >
                  Reset
                </Button>
              </Box>

              {isOptimizing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Optimizing routes... This may take a few moments.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Summary */}
        {optimizationResult && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Results
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <RouteIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {optimizationResult.routes.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Routes Created
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <LocationOn color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {formatDistance(optimizationResult.totalDistance)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Distance
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Schedule color="warning" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="warning.main">
                        {formatTime(optimizationResult.totalDuration)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Duration
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <AttachMoney color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        ${optimizationResult.totalEarnings.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Earnings
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Algorithm: ${optimizationResult.algorithm}`} 
                    color="primary" 
                  />
                  <Chip 
                    label={`Optimization Time: ${optimizationResult.optimizationTime}ms`} 
                    color="secondary" 
                  />
                  {optimizationResult.improvements && (
                    <>
                      <Chip 
                        label={`Distance Reduction: ${optimizationResult.improvements.distanceReduction.toFixed(1)}%`} 
                        color="success" 
                      />
                      <Chip 
                        label={`Time Reduction: ${optimizationResult.improvements.timeReduction.toFixed(1)}%`} 
                        color="warning" 
                      />
                    </>
                  )}
                </Box>

                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => setShowResultDialog(true)}
                >
                  View Detailed Results
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Algorithm Details Dialog */}
      <Dialog 
        open={showAlgorithmDialog} 
        onClose={() => setShowAlgorithmDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {getAlgorithmInfo()?.name} - Algorithm Details
        </DialogTitle>
        <DialogContent>
          {getAlgorithmInfo() && (
            <Box>
              <Typography variant="body1" paragraph>
                {getAlgorithmInfo()?.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Complexity: {getAlgorithmInfo()?.complexity}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Best For: {getAlgorithmInfo()?.bestFor}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Advantages:
              </Typography>
              <List dense>
                {getAlgorithmInfo()?.pros.map((pro, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={pro} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="h6" gutterBottom>
                Limitations:
              </Typography>
              <List dense>
                {getAlgorithmInfo()?.cons.map((con, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={con} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlgorithmDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Results Details Dialog */}
      <Dialog 
        open={showResultDialog} 
        onClose={() => setShowResultDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detailed Optimization Results
        </DialogTitle>
        <DialogContent>
          {optimizationResult && (
            <Box>
              {optimizationResult.routes.map((route, index) => (
                <Card key={route.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Route {index + 1}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Distance: {formatDistance(route.totalDistance)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatTime(route.totalDuration)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Earnings: ${route.estimatedEarnings.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Stops ({route.locations.length}):
                    </Typography>
                    <List dense>
                      {route.locations.map((location, locIndex) => (
                        <ListItem key={location.id}>
                          <ListItemIcon>
                            {location.type === 'pickup' ? (
                              <LocationOn color="primary" />
                            ) : (
                              <LocationOn color="success" />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${locIndex + 1}. ${location.address}`}
                            secondary={`${location.type} • Priority: ${location.priority || 1}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteOptimizationDashboard;
