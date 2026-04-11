import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
// import predictionRoute  from "./routes/predict.routes";
import cameraRoutes from './routes/camera.routes';
import crimeRoutes from './routes/crime.routes';
import alertRoutes  from './routes/alert.routes'; 
import { errorHandler } from './middleware/error.middleware';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());




app.use("/api", authRoutes);
// app.use("/api", predictionRoute);

app.use('/api/v1/cameras', cameraRoutes);
app.use('/api/v1/crimes',  crimeRoutes);
app.use('/api/v1/alerts',  alertRoutes); 


app.use(errorHandler);


export default app;