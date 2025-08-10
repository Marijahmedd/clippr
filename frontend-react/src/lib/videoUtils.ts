//CREATE CLOUDFRONT URL FROM KEY
const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL;

export const buildVideoUrl = (key: string): string => {
  if (!key) return '';

  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  return `${CLOUDFRONT_URL}/${cleanKey}`;
};

export const extractKeyFromUrl = (url: string): string => {
  if (!url) return '';

  const cloudfrontUrlPattern = new RegExp(`^${CLOUDFRONT_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+)$`);
  const match = url.match(cloudfrontUrlPattern);

  return match ? match[1] : url;
};

export const isCloudFrontUrl = (url: string): boolean => {
  return url.startsWith(CLOUDFRONT_URL);
};
