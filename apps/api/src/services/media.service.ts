import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { appConfig } from '@neara/config';
import { badRequest } from '../lib/errors.js';

/**
 * Cloudinary media service.
 * Property media is uploaded to Cloudinary — never stored on the local server.
 * Credentials are only ever read server-side from environment configuration.
 */
class MediaService {
  private configured: boolean;

  constructor() {
    this.configured = Boolean(
      appConfig.cloudinary.cloudName && appConfig.cloudinary.apiKey && appConfig.cloudinary.apiSecret,
    );
    if (this.configured) {
      cloudinary.config({
        cloud_name: appConfig.cloudinary.cloudName,
        api_key: appConfig.cloudinary.apiKey,
        api_secret: appConfig.cloudinary.apiSecret,
        secure: true,
      });
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /** Generate a signed upload signature for direct browser/mobile uploads. */
  signUpload(folder: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    if (!this.configured) {
      throw badRequest('Cloudinary is not configured for uploads.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { folder, resource_type: resourceType, timestamp };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      appConfig.cloudinary.apiSecret,
    );
    return {
      signature,
      timestamp,
      apiKey: appConfig.cloudinary.apiKey,
      cloudName: appConfig.cloudinary.cloudName,
      resourceType,
      folder,
    };
  }

  /** Transform an existing URL into an optimized/resized version. */
  optimize(url: string, options: { width?: number; height?: number; quality?: number | string } = {}) {
    if (!url.includes('cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    const transforms = [
      options.width ? `w_${options.width}` : null,
      options.height ? `h_${options.height}` : null,
      `q_${options.quality ?? 'auto'}`,
      'f_auto',
      'c_limit',
    ]
      .filter(Boolean)
      .join(',');
    return `${parts[0]}/upload/${transforms}/${parts[1]}`;
  }

  thumbnail(url: string, width = 400): string {
    return this.optimize(url, { width, height: width, quality: 'auto' });
  }

  /** Delete media by public id (used when landlords remove images). */
  async delete(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    if (!this.configured) return null;
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  }

  /** Server-side upload (for documents that must not be exposed). */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<UploadApiResponse> {
    if (!this.configured) {
      throw badRequest('Cloudinary is not configured for uploads.');
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType, unique_filename: true },
        (err, result) => {
          if (err) return reject(err);
          resolve(result as UploadApiResponse);
        },
      );
      stream.end(buffer);
    });
  }
}

export const mediaService = new MediaService();
