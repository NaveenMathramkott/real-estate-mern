import { v2 as cloudinary } from "cloudinary";

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Uploads a media asset to Cloudinary, or returns null when unconfigured.
export const uploadMedia = async (file, folder = "property-media") => {
  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary is not configured");
  }

  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

// Eager transform generating the blurhash placeholder for image uploads.
export const IMAGE_TRANSFORM = {
  width: 400,
  crop: "limit",
  quality: "auto",
  fetch_format: "auto",
};

export const hasCloudinary = hasCloudinaryConfig;

export default cloudinary;
