import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";  // This package connects Multer with Cloudinary.
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({  // Configuring Cloudinary storage for Multer.
  cloudinary, // Using the Cloudinary instance configured in the cloudinary.js file.
  params: {
    folder: "products_img",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage,  // Setting up Multer with the Cloudinary storage configuration.
    limits:{
        fileSize: 5 * 1024 * 1024, // 5MB
    }
 });

export default upload;  // Exporting the configured Multer instance for use in routes.