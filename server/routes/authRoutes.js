import express from 'express';
import { signup, login, logout, getUserProfile, updateProfile, searchUsers, upload, uploadProfileImage } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
export const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/logout", logout);
authRouter.post("/login", login);
authRouter.get("/me", verifyToken, getUserProfile); 
authRouter.put("/profile", verifyToken, upload.single('profileImage'), updateProfile);
authRouter.post("/profile/upload-image", verifyToken, upload.single('profileImage'), uploadProfileImage);
authRouter.get("/users/search", verifyToken, searchUsers);