import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
  Shield,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useSecurity } from '@/contexts/SecurityContext';
import { useOffline } from '@/services/offlineService';

const SecurityDashboard: React.FC = () => {
  const {
    securityScore,
    isSecure,
    lastSecurityCheck,
    getSecurityEvents,
    getSecurityRecommendations,
    logSecurityEvent,
  } = useSecurity();
  
  const { isOffline } = useOffline();
  const [showDetails, setShowDetails] = useState(false);
  const [events, setEvents] = useState(getSecurityEvents());
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const updateData = () => {
      setEvents(getSecurityEvents());
      setRecommendations(getSecurityRecommendations());
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [getSecurityEvents, getSecurityRecommendations]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      case 'low':
        return <CheckCircle color="success" />;
      default:
        return <Info />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleRefresh = () => {
    setEvents(getSecurityEvents());
    setRecommendations(getSecurityRecommendations());
  };

  const handleTestSecurity = () => {
    logSecurityEvent({
      type: 'suspicious_activity',
      message: 'Test security event triggered',
      severity: 'low',
      metadata: { test: true },
    });
  };

  const recentEvents = events.slice(0, 10);
  const criticalEvents = events.filter(event => event.severity === 'critical');
  const highEvents = events.filter(event => event.severity === 'high');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          Security Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh security data">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Test security system">
            <IconButton onClick={handleTestSecurity} color="warning">
              <Shield />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Security Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Security Score
                  </Typography>
                  <Typography variant="h3" color={`${getScoreColor(securityScore)}.main`}>
                    {securityScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getScoreLabel(securityScore)}
                  </Typography>
                </Box>
                <Box sx={{ width: 100, height: 100 }}>
                  <LinearProgress
                    variant="determinate"
                    value={securityScore}
                    color={getScoreColor(securityScore)}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    {securityScore}/100
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Security Status
                  </Typography>
                  <Chip
                    icon={isSecure ? <CheckCircle /> : <Error />}
                    label={isSecure ? 'Secure' : 'At Risk'}
                    color={isSecure ? 'success' : 'error'}
                    variant="filled"
                  />
                </Box>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Offline Mode
                  </Typography>
                  <Chip
                    icon={isOffline ? <Lock /> : <CheckCircle />}
                    label={isOffline ? 'Offline' : 'Online'}
                    color={isOffline ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Security Events
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Chip
                  icon={<Error />}
                  label={`${criticalEvents.length} Critical`}
                  color="error"
                  size="small"
                />
                <Chip
                  icon={<Warning />}
                  label={`${highEvents.length} High`}
                  color="warning"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total: {events.length} events
              </Typography>
              {lastSecurityCheck && (
                <Typography variant="caption" color="text.secondary">
                  Last check: {lastSecurityCheck.toLocaleTimeString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Security Recommendations
            </Typography>
            <List dense>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Recent Security Events
            </Typography>
            <IconButton
              onClick={() => setShowDetails(!showDetails)}
              color="primary"
            >
              {showDetails ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>

          {recentEvents.length === 0 ? (
            <Alert severity="success">
              No security events in the last 24 hours. Your system is secure!
            </Alert>
          ) : (
            <List>
              {recentEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getSeverityIcon(event.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {event.message}
                          </Typography>
                          <Chip
                            label={event.severity}
                            color={getSeverityColor(event.severity)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {event.timestamp.toLocaleString()}
                          </Typography>
                          {showDetails && event.metadata && (
                            <Typography variant="caption" color="text.secondary">
                              {JSON.stringify(event.metadata, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecurityDashboard;
