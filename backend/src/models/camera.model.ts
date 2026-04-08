import mongoose, { Schema, Document } from 'mongoose';

export interface ICamera extends Document {
  cameraId: string;
  location: string;
  ipAddress: string;
  status: 'active' | 'inactive';
  installationDate: Date;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CameraSchema = new Schema<ICamera>(
  {
    cameraId: {
      type: String,
      required: [true, 'Camera ID is required'],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP Address is required'],
      trim: true,
      validate: {
        validator: (v: string) =>
          /^(\d{1,3}\.){3}\d{1,3}$/.test(v),
        message: 'Invalid IP address format',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    installationDate: {
      type: Date,
      required: [true, 'Installation date is required'],
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<ICamera>('Camera', CameraSchema);