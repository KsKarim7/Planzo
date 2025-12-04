import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './utils/dbConfig.js';
import { authRouter } from './routes/authRoutes.js';
import { teamRouter } from './routes/teamRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import kanbanRouter from './routes/kanbanRoutes.js';
import activityLogRouter from './routes/activityLogRoutes.js';
import reportRouter from './routes/reportRoutes.js';
// import { chatRouter } from './routes/chatRoutes.js'; - Removed
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log CORS requests and errors
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Configure CORS with broader settings
app.use(cors({
    origin: true, // Allow all origins temporarily for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth",authRouter);
app.use("/api/teams",teamRouter);
app.use("/api/projects", projectRouter);
app.use("/api", taskRouter);
app.use("/api/kanban", kanbanRouter);
app.use("/api/activity", activityLogRouter);
app.use("/api", reportRouter);
// app.use("/api/chat", chatRouter); - Removed

app.listen( port, ()=>{
    console.log("Server started on port", port);
    connectDB();
});