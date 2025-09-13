import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

export const photoUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// Save photo metadata to database
export const savePhotoMetadata = async (photoData: {
  orderId: string;
  userId: string;
  photoUrl: string;
  photoType: 'PICKUP' | 'DELIVERY' | 'DAMAGE' | 'ISSUE';
  description?: string;
  metadata?: any;
}) => {
  try {
    const photo = await prisma.photo.create({
      data: {
        orderId: photoData.orderId,
        userId: photoData.userId,
        photoUrl: photoData.photoUrl,
        photoType: photoData.photoType,
        description: photoData.description,
        metadata: photoData.metadata
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return photo;
  } catch (error) {
    console.error('Error saving photo metadata:', error);
    throw error;
  }
};

// Get photos for an order
export const getOrderPhotos = async (orderId: string) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { orderId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return photos;
  } catch (error) {
    console.error('Error getting order photos:', error);
    throw error;
  }
};

// Delete photo
export const deletePhoto = async (photoId: string, userId: string) => {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId }
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Check if user has permission to delete (owner or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (photo.userId !== userId && user?.role !== 'ADMIN') {
      throw new Error('Unauthorized to delete this photo');
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), photo.photoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

// Get photo statistics
export const getPhotoStats = async (userId: string, period: string = '30d') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const photos = await prisma.photo.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        photoType: true,
        createdAt: true
      }
    });

    const stats = {
      total: photos.length,
      byType: {
        PICKUP: photos.filter(p => p.photoType === 'PICKUP').length,
        DELIVERY: photos.filter(p => p.photoType === 'DELIVERY').length,
        DAMAGE: photos.filter(p => p.photoType === 'DAMAGE').length,
        ISSUE: photos.filter(p => p.photoType === 'ISSUE').length
      },
      period
    };

    return stats;
  } catch (error) {
    console.error('Error getting photo stats:', error);
    throw error;
  }
};
