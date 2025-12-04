import jwt from 'jsonwebtoken'
import dotenv from "dotenv"
dotenv.config()

export const generateJWT = (userId,res)=>{
    const token = jwt.sign({userId}, process.env.SECRET, { expiresIn: "3d"});
    // send token in cookie
    res.cookie("jwt", token, {
        maxAge : 60*60*24*1000*3,  // 3 day
        httpOnly : true,
        sameSite : "strict",
        secure : process.env.NODE_ENV !== "development"  
    })
    return token;
    
}

