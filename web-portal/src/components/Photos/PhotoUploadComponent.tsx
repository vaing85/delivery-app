import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { photosAPI } from '../../services/api';

interface PhotoUploadComponentProps {
  orderId: string;
  onPhotoUploaded?: (photo: any) => void;
  onClose?: () => void;
}

interface UploadedPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  photoType: string;
  description?: string;
  uploadedAt: string;
}

const PhotoUploadComponent: React.FC<PhotoUploadComponentProps> = ({
  orderId,
  onPhotoUploaded,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string>('DELIVERY');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoTypes = [
    { value: 'PICKUP', label: 'Pickup Photo' },
    { value: 'DELIVERY', label: 'Delivery Photo' },
    { value: 'DAMAGE', label: 'Damage Report' },
    { value: 'ISSUE', label: 'Issue Documentation' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file.',
          severity: 'error'
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size must be less than 10MB.',
          severity: 'error'
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: 'Please select a file to upload.',
        severity: 'warning'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('orderId', orderId);
      formData.append('photoType', photoType);
      formData.append('description', description);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await photosAPI.uploadPhoto(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const newPhoto: UploadedPhoto = {
          id: response.data.photo.id,
          url: response.data.photo.photoUrl,
          thumbnailUrl: response.data.photo.thumbnailUrl,
          photoType: response.data.photo.photoType,
          description: response.data.photo.description,
          uploadedAt: response.data.photo.createdAt
        };

        setUploadedPhotos(prev => [newPhoto, ...prev]);
        onPhotoUploaded?.(newPhoto);

        setSnackbar({
          open: true,
          message: 'Photo uploaded successfully!',
          severity: 'success'
        });

        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload photo. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await photosAPI.deletePhoto(photoId);
      if (response.success) {
        setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
        setSnackbar({
          open: true,
          message: 'Photo deleted successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete photo.',
        severity: 'error'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'PICKUP': return 'primary';
      case 'DELIVERY': return 'success';
      case 'DAMAGE': return 'error';
      case 'ISSUE': return 'warning';
      default: return 'default';
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Delivery Photo
          </Typography>

          {/* File Selection */}
          <Box mb={3}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<CameraIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ mb: 2 }}
            >
              Select Photo
            </Button>

            {selectedFile && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    {previewUrl && (
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="Preview"
                        sx={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="subtitle2" gutterBottom>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Size: {formatFileSize(selectedFile.size)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedFile.type}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>

          {/* Photo Type Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Photo Type</InputLabel>
            <Select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
              label="Photo Type"
            >
              {photoTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            fullWidth
            label="Description (Optional)"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any notes about this photo..."
            sx={{ mb: 3 }}
          />

          {/* Upload Progress */}
          {isUploading && (
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Upload Button */}
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            fullWidth
            sx={{ mb: 3 }}
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>

          {/* Uploaded Photos */}
          {uploadedPhotos.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Uploaded Photos ({uploadedPhotos.length})
              </Typography>
              <Grid container spacing={2}>
                {uploadedPhotos.map((photo) => (
                  <Grid item xs={12} sm={6} md={4} key={photo.id}>
                    <Card>
                      <Box
                        component="img"
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.photoType}
                        sx={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover'
                        }}
                      />
                      <CardContent sx={{ p: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Chip
                            label={photo.photoType}
                            color={getPhotoTypeColor(photo.photoType) as any}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePhoto(photo.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        {photo.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {photo.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(photo.uploadedAt).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PhotoUploadComponent;
