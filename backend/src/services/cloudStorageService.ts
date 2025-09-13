import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  generateThumbnail?: boolean;
  thumbnailSize?: {
    width: number;
    height: number;
  };
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

export class CloudStorageService {
  private bucketName: string;
  private useCloudStorage: boolean;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'delivery-app-uploads';
    this.useCloudStorage = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }

  // Upload file to cloud storage
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const folder = options.folder || 'uploads';
      const key = `${folder}/${fileName}`;

      let processedFile = file;
      let thumbnailBuffer: Buffer | null = null;

      // Process image if it's an image file
      if (this.isImageFile(file.mimetype)) {
        processedFile = await this.processImage(file, options);
        
        // Generate thumbnail if requested
        if (options.generateThumbnail) {
          thumbnailBuffer = await this.generateThumbnail(file, options.thumbnailSize);
        }
      }

      if (this.useCloudStorage) {
        return await this.uploadToS3(processedFile, key, thumbnailBuffer, options);
      } else {
        return await this.uploadLocally(processedFile, key, thumbnailBuffer, options);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload to AWS S3
  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
    thumbnailBuffer: Buffer | null,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Upload main file
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' as const,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      const result: UploadResult = {
        url: uploadResult.Location,
        key: key,
        size: file.size,
        mimeType: file.mimetype
      };

      // Upload thumbnail if exists
      if (thumbnailBuffer) {
        const thumbnailKey = `${path.dirname(key)}/thumbnails/${path.basename(key)}`;
        const thumbnailUploadParams = {
          Bucket: this.bucketName,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read' as const
        };

        const thumbnailResult = await s3.upload(thumbnailUploadParams).promise();
        result.thumbnailUrl = thumbnailResult.Location;
        result.thumbnailKey = thumbnailKey;
      }

      return result;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  // Upload locally
  private async uploadLocally(
    file: Express.Multer.File,
    key: string,
    thumbnailBuffer: Buffer | null,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, key);
      const fileDir = path.dirname(filePath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Write main file
      fs.writeFileSync(filePath, file.buffer);

      const result: UploadResult = {
        url: `/uploads/${key}`,
        key: key,
        size: file.size,
        mimeType: file.mimetype
      };

      // Write thumbnail if exists
      if (thumbnailBuffer) {
        const thumbnailKey = `${path.dirname(key)}/thumbnails/${path.basename(key)}`;
        const thumbnailPath = path.join(uploadDir, thumbnailKey);
        const thumbnailDir = path.dirname(thumbnailPath);

        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        fs.writeFileSync(thumbnailPath, thumbnailBuffer);
        result.thumbnailUrl = `/uploads/${thumbnailKey}`;
        result.thumbnailKey = thumbnailKey;
      }

      return result;
    } catch (error) {
      console.error('Error uploading locally:', error);
      throw error;
    }
  }

  // Process image (resize, optimize)
  private async processImage(
    file: Express.Multer.File,
    options: UploadOptions
  ): Promise<Express.Multer.File> {
    try {
      if (!options.resize) {
        return file;
      }

      let sharpInstance = sharp(file.buffer);

      // Resize if specified
      if (options.resize.width || options.resize.height) {
        sharpInstance = sharpInstance.resize(
          options.resize.width,
          options.resize.height,
          {
            fit: 'inside',
            withoutEnlargement: true
          }
        );
      }

      // Set quality for JPEG
      if (file.mimetype === 'image/jpeg' && options.resize.quality) {
        sharpInstance = sharpInstance.jpeg({ quality: options.resize.quality });
      }

      // Set quality for WebP
      if (file.mimetype === 'image/webp' && options.resize.quality) {
        sharpInstance = sharpInstance.webp({ quality: options.resize.quality });
      }

      const processedBuffer = await sharpInstance.toBuffer();

      return {
        ...file,
        buffer: processedBuffer,
        size: processedBuffer.length
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return file; // Return original file if processing fails
    }
  }

  // Generate thumbnail
  private async generateThumbnail(
    file: Express.Multer.File,
    thumbnailSize: { width: number; height: number } = { width: 200, height: 200 }
  ): Promise<Buffer> {
    try {
      return await sharp(file.buffer)
        .resize(thumbnailSize.width, thumbnailSize.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  // Delete file from cloud storage
  async deleteFile(key: string, thumbnailKey?: string): Promise<void> {
    try {
      if (this.useCloudStorage) {
        await this.deleteFromS3(key, thumbnailKey);
      } else {
        await this.deleteLocally(key, thumbnailKey);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Delete from S3
  private async deleteFromS3(key: string, thumbnailKey?: string): Promise<void> {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();

      if (thumbnailKey) {
        const thumbnailDeleteParams = {
          Bucket: this.bucketName,
          Key: thumbnailKey
        };
        await s3.deleteObject(thumbnailDeleteParams).promise();
      }
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw error;
    }
  }

  // Delete locally
  private async deleteLocally(key: string, thumbnailKey?: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (thumbnailKey) {
        const thumbnailPath = path.join(process.cwd(), 'uploads', thumbnailKey);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    } catch (error) {
      console.error('Error deleting locally:', error);
      throw error;
    }
  }

  // Get file URL
  getFileUrl(key: string): string {
    if (this.useCloudStorage) {
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } else {
      return `/uploads/${key}`;
    }
  }

  // Check if file is an image
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Get file info
  async getFileInfo(key: string): Promise<{
    exists: boolean;
    size?: number;
    lastModified?: Date;
    contentType?: string;
  }> {
    try {
      if (this.useCloudStorage) {
        const params = {
          Bucket: this.bucketName,
          Key: key
        };

        const result = await s3.headObject(params).promise();
        return {
          exists: true,
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType
        };
      } else {
        const filePath = path.join(process.cwd(), 'uploads', key);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          return {
            exists: true,
            size: stats.size,
            lastModified: stats.mtime
          };
        }
        return { exists: false };
      }
    } catch (error) {
      return { exists: false };
    }
  }

  // List files in folder
  async listFiles(folder: string, maxKeys: number = 1000): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    url: string;
  }>> {
    try {
      if (this.useCloudStorage) {
        const params = {
          Bucket: this.bucketName,
          Prefix: folder,
          MaxKeys: maxKeys
        };

        const result = await s3.listObjectsV2(params).promise();
        return (result.Contents || []).map(obj => ({
          key: obj.Key!,
          size: obj.Size!,
          lastModified: obj.LastModified!,
          url: this.getFileUrl(obj.Key!)
        }));
      } else {
        const folderPath = path.join(process.cwd(), 'uploads', folder);
        if (!fs.existsSync(folderPath)) {
          return [];
        }

        const files = fs.readdirSync(folderPath);
        return files.map(fileName => {
          const filePath = path.join(folderPath, fileName);
          const stats = fs.statSync(filePath);
          return {
            key: `${folder}/${fileName}`,
            size: stats.size,
            lastModified: stats.mtime,
            url: `/uploads/${folder}/${fileName}`
          };
        });
      }
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}

// Export singleton instance
let cloudStorageService: CloudStorageService;

export const getCloudStorageService = () => {
  if (!cloudStorageService) {
    cloudStorageService = new CloudStorageService();
  }
  return cloudStorageService;
};

// Multer configuration for file uploads
export const createUploadMiddleware = (options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  destination?: string;
}) => {
  const storage = multer.memoryStorage();

  const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    limits: {
      fileSize: options.maxFileSize || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter
  });
};
