import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/videos/'),
  filename: (req, file, cb) =>
    cb(null, `vid_${Date.now()}${path.extname(file.originalname)}`)
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.avi', '.mkv'];
    allowed.includes(path.extname(file.originalname))
      ? cb(null, true)
      : cb(new Error('Invalid file type'));
  }
});