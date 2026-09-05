const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folderName - Cloudinary folder name
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadFromBuffer = (buffer, folderName = 'photoday') => {
  // If in test environment or using default placeholder keys, return mock upload details
  if (
    process.env.NODE_ENV === 'test' ||
    !process.env.CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_API_KEY === 'your_api_key'
  ) {
    return Promise.resolve({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1570725334/sample.jpg',
      public_id: `mock_public_id_${Date.now()}`,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Deletes a file from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public ID of the resource
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteFromCloudinary = (publicId) => {
  // If in test environment or using default placeholder keys, mock deletion response
  if (
    process.env.NODE_ENV === 'test' ||
    !process.env.CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_API_KEY === 'your_api_key'
  ) {
    return Promise.resolve({ result: 'ok' });
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

module.exports = {
  cloudinary,
  uploadFromBuffer,
  deleteFromCloudinary,
};
