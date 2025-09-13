import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress } from '@mui/material';
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
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'CUSTOMER',
    status: 'active',
    phone: '+1-555-0123',
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    role: 'DRIVER',
    status: 'active',
    phone: '+1-555-0456',
    createdAt: '2024-01-12'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@email.com',
    role: 'ADMIN',
    status: 'active',
    phone: '+1-555-0789',
    createdAt: '2024-01-08'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@email.com',
    role: 'DISPATCHER',
    status: 'inactive',
    phone: '+1-555-0321',
    createdAt: '2024-01-05'
  }
];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'error';
    case 'DRIVER':
      return 'primary';
    case 'DISPATCHER':
      return 'warning';
    case 'CUSTOMER':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusColor = (status: string) => {
  return status === 'active' ? 'success' : 'error';
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Create new user')}
        >
          New User
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>
                    <Tooltip title="View User">
                      <IconButton size="small" onClick={() => navigate(`/users/${user.id}`)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit User">
                      <IconButton size="small" onClick={() => console.log('Edit user', user.id)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton size="small" onClick={() => console.log('Delete user', user.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default UsersPage;
