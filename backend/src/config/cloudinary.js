const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Initialize Cloudinary if credentials are provided
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Service Configured');
} else {
  console.log('Cloudinary credentials missing. Uploads will fall back to local disk storage.');
}

/**
 * Uploads a file to Cloudinary or saves it locally if Cloudinary is not configured.
 * @param {Object} file - The file object from Multer
 * @returns {Promise<string>} - The file URL
 */
const uploadImage = async (file) => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'eventsphere',
      });
      // Delete temporary file after upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error, falling back to local path:', error);
      // Fallback to local url if upload fails
    }
  }

  // Local static file upload fallback
  // The file is already stored in backend/public/uploads/ by Multer diskStorage
  const filename = path.basename(file.path);
  return `/uploads/${filename}`;
};

module.exports = {
  cloudinary,
  uploadImage,
  isCloudinaryConfigured
};
