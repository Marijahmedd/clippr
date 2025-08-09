/**
 * Utility functions for handling video URLs and CloudFront distribution
 */

const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL || 'https://d2qnlrtqmwyd0p.cloudfront.net';

/**
 * Build CloudFront URL from S3 key
 * @param key - The S3 object key (e.g., "uploads/video-id.mp4")
 * @returns Full CloudFront URL
 */
export const buildVideoUrl = (key: string): string => {
  if (!key) return '';
  
  // Remove leading slash if present
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  
  return `${CLOUDFRONT_URL}/${cleanKey}`;
};

/**
 * Extract S3 key from CloudFront URL
 * @param url - Full CloudFront URL
 * @returns S3 key
 */
export const extractKeyFromUrl = (url: string): string => {
  if (!url) return '';
  
  const cloudfrontUrlPattern = new RegExp(`^${CLOUDFRONT_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+)$`);
  const match = url.match(cloudfrontUrlPattern);
  
  return match ? match[1] : url;
};

/**
 * Check if URL is a CloudFront URL
 * @param url - URL to check
 * @returns boolean
 */
export const isCloudFrontUrl = (url: string): boolean => {
  return url.startsWith(CLOUDFRONT_URL);
};
