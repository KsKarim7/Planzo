import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { User } from "../models/userModel.js";
dotenv.config();

export const authenticate = async ( req , res , next ) => {
    console.log('-------- AUTH MIDDLEWARE START --------');
    console.log('Request URL:', req.originalUrl);
    console.log('Request Method:', req.method);
    
    try {
        const token = req.cookies.jwt;
        console.log('JWT Cookie present:', !!token);
        
        if(!token) {
            console.log('No token provided');
            return res.status(401).json( { msg : "Unauthorized - No token given"});
        }
        
        // decode token
        console.log('Verifying token...');
        const decodedToken = jwt.verify(token, process.env.SECRET);
        console.log('Token verified, userId:', decodedToken.userId);
        
        if(!decodedToken) {
            console.log('Token verification failed');
            return res.status(401).json( { msg : "Invalid token"});
        }
        
        // check db 
        console.log('Finding user in database...');
        const user = await User.findById(decodedToken.userId).select("-password");
        
        if(!user) {
            console.log('User not found in database');
            return res.status(404).json( { msg : "Invalid user"});
        }
        
        console.log('User authenticated:', user._id);
        req.user = user;
        console.log('-------- AUTH MIDDLEWARE END --------');
        next();
    } catch (error) {
        console.log("Authentication error", error.message);
        console.log("Error stack:", error.stack);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: "Invalid token format" });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: "Token has expired" });
        }
        
        console.log('-------- AUTH MIDDLEWARE ERROR END --------');
        return res.status(500).json( {msg : "Internal server error"});
    }
};

// Add verifyToken as an alias for authenticate
export const verifyToken = authenticate;