// Cloudinary Configuration
// Only the values needed for unsigned uploads from the browser.
// The API secret must NEVER be exposed in client-side code.
const cloudinaryConfig = {
    cloudName: 'dxrbvgr1o',
    uploadPreset: 'tuzona_uploads',
    folder: 'tuzona-uploads'
};

// Make it globally available
window.cloudinaryConfig = cloudinaryConfig;
