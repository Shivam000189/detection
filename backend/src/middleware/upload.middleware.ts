import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "crime-videos",
    resource_type: "video",
  } as any,
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});