import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import { preditionCrime } from "./controllers/predict.controller";
import cameraRoutes from './routes/camera.routes';
import { errorHandler } from './middleware/error.middleware';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());




app.use("/api", authRoutes);
app.use("/api", preditionCrime);

app.use('/api/v1/cameras', cameraRoutes);


app.use(errorHandler);


export default app;