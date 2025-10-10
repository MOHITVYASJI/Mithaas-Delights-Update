/**
 * Centralized Image Configuration
 * 
 * Yeh file saari static image paths ko ek jagah manage karti hai.
 * Agar kabhi public folder structure change ho, toh sirf yahan update karna padega.
 */

// Base path for images (PUBLIC folder ke andar)
const PUBLIC_PATH = process.env.PUBLIC_URL || '';

// Logo Images
export const LOGOS = {
  main: `${PUBLIC_PATH}/mithaas-logo.png`,
  favicon: `${PUBLIC_PATH}/favicon.png`,
  gif: `${PUBLIC_PATH}/animated-logo.mp4`
};

// Product Category Images
export const PRODUCT_IMAGES = {
  traditional: `${PUBLIC_PATH}/Traditional_mithaai.png`,
  premium: `${PUBLIC_PATH}/Premium_sweets.png`,
  handSweets: `${PUBLIC_PATH}/hand_sweets.png`,
  foodSafety: `${PUBLIC_PATH}/food_safty.png`
};

// Hero Section Videos/Animations
export const HERO_MEDIA = {
  animation: `${PUBLIC_PATH}/hero-animation.mp4`,
  logo: `${PUBLIC_PATH}/animated-logo.mp4`
};

// Certificate Images
export const CERTIFICATES = {
  fssai: `${PUBLIC_PATH}/fssai-certificate.jpg`,
  msme: `${PUBLIC_PATH}/msme-certificate.jpg`
};

// Fallback Image (agar koi image load na ho)
export const FALLBACK_IMAGE = `${PUBLIC_PATH}/mithaas_delights.png`;

/**
 * Helper function to get image with fallback
 * Usage: getImage(LOGOS.main, FALLBACK_IMAGE)
 */
export const getImage = (imagePath, fallback = FALLBACK_IMAGE) => {
  return imagePath || fallback;
};

/**
 * Helper function to check if image exists
 */
export const checkImageExists = async (imagePath) => {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Image check failed:', error);
    return false;
  }
};

export default {
  LOGOS,
  PRODUCT_IMAGES,
  HERO_MEDIA,
  CERTIFICATES,
  FALLBACK_IMAGE,
  getImage,
  checkImageExists
};
