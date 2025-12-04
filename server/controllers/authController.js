import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs"
import { generateJWT } from "../utils/jwtConfig.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage for profile images
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`Created uploads directory: ${uploadDir}`);
        }
        
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Create unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const newFilename = 'profile-' + uniqueSuffix + ext;
        console.log(`Generated filename: ${newFilename}`);
        cb(null, newFilename);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    console.log(`Processing uploaded file: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
    } else {
        console.log(`File rejected: ${file.originalname} (not an image)`);
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize the multer middleware with specified settings
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const signup = async (req,res)=>{

    try{
        const { email, name, password, phone, dateOfBirth, uniqueId } = req.body;
        if (!name || !email || !password || !phone){ 
            return res.status(400).json({ msg : "All fields are required"})
        };
        if (password.length < 6){ 
            return res.status(400).json( {
            msg : "Password length must be at least 6 characters or more"
        })
        };
        //check whether user exists or not
        const user = await User.findOne({email});
        if (user){ return res.status(400).json( {msg:"User already exists"} )};

        //hash pass
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        //create a new user and save it to mongo db
        const newUser = new User({
            email,
            name,
            password : hashedPassword,
            phone,
            dateOfBirth: dateOfBirth || null,
            uniqueId: uniqueId || null
        });

        if(newUser){
            // generate a jwt token and send it to the user in a cookie 
            generateJWT( newUser._id, res);
            await newUser.save();

            res.status(200).json({
                _id : newUser._id,
                email : newUser.email,
                name : newUser.name,
                role : newUser.role,
                uniqueId: newUser.uniqueId,
                dateOfBirth: newUser.dateOfBirth,
                profileImage: newUser.profileImage
            });
        } else{
            return res.status(400).json( {msg : "Invalid user data"})
        }
    }catch(err){
        console.log(`Sign up error : ${err.message}`);
        return res.status(500).json({ msg : "Internal server error"});
    }
};

export const login = async (req,res)=>{
    //fetch email and pass
    const {email, password} = req.body;
try{

    //check if credentials exist
    if(!email || !password){
        return res.status(400).json( {msg : "Invalid credentials"} );
    };
    //check if user exists
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json( {msg : "Account doesn't exist"} );
    };
    //check if its valid
    const isValidPass = await bcrypt.compare(password, user.password); 
    if(!isValidPass){
        return res.status(400).json( {msg : "Invalid credentials"} );
    };

    generateJWT(user._id,res);
    return res.status(200).json({
        _id : user._id,
        email : user.email,
        name : user.name,
        role : user.role,
        phone: user.phone,
        uniqueId: user.uniqueId,
        dateOfBirth: user.dateOfBirth,
        profileImage: user.profileImage
    });
}catch(err){
    console.log(`Login up error : ${err.message}`);
    return res.status(500).json({ msg : "internal server error"});
}
};

export const logout = async (req,res)=>{
    try {
        res.cookie("jwt","", { maxAge : 0 });
        return res.status(200).json( { msg : "Logged out successfully"});
    } catch (error) {
        console.log(`Logout error : ${error.message}`);
        return res.status(500).json({ msg : "Internal server error"});
    }
}

export const getUserProfile = (req,res)=>{
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        console.log(`getUserProfile error : ${error.message}`);
        return res.status(500).json({ msg : "Internal server error"});
    }
}

export const updateProfile = async (req, res) => {
    console.log('--------------- PROFILE UPDATE START ---------------');
    console.log('Auth User ID:', req.user?._id);
    console.log('Auth User:', JSON.stringify(req.user));
    console.log('Request Body:', JSON.stringify(req.body));
    console.log('Request File:', req.file);
    
    try {
        const userId = req.user._id; // Get from auth token
        const { name, password, phone, dateOfBirth, uniqueId } = req.body; 
        const updates = {};
        
        console.log('Processing fields:');
        console.log('- name:', name);
        console.log('- phone:', phone);
        console.log('- uniqueId:', uniqueId);
        console.log('- dateOfBirth:', dateOfBirth);
        
        if (name !== undefined && name.trim() !== '') updates.name = name;
        
        // Handle phone number - ensure it's treated as a number
        if (phone !== undefined) {
            const phoneNumber = Number(phone);
            if (!isNaN(phoneNumber)) {
                updates.phone = phoneNumber;
                console.log('Phone converted to number:', phoneNumber);
            } else {
                console.log('Invalid phone number format:', phone);
                return res.status(400).json({ msg: "Phone number must be numeric" });
            }
        }
        
        if (dateOfBirth) {
            try {
                updates.dateOfBirth = new Date(dateOfBirth);
                console.log('Date converted:', updates.dateOfBirth);
            } catch (dateError) {
                console.log('Date conversion error:', dateError);
                return res.status(400).json({ msg: "Invalid date format" });
            }
        }
        
        if (uniqueId !== undefined && uniqueId.trim() !== '') updates.uniqueId = uniqueId;
        
        // Handle profile image separately
        if (req.file) {
            console.log('Uploaded file details:', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                path: req.file.path
            });
            
            // Ensure uploads directory exists
            const uploadsDir = path.join(__dirname, '../uploads/profiles');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
                console.log('Created uploads directory:', uploadsDir);
            }
            
            // Get file extension and create a filename
            const fileExt = path.extname(req.file.originalname).toLowerCase();
            const timestamp = Date.now();
            const newFilename = `profile-${userId}-${timestamp}${fileExt}`;
            
            // Create relative path for database and full path for file operations
            const dbPath = `/uploads/profiles/${newFilename}`;
            const fullPath = path.join(__dirname, '..', dbPath);
            
            try {
                // Copy file from temp location to permanent location
                fs.copyFileSync(req.file.path, fullPath);
                console.log(`File saved successfully to ${fullPath}`);
                
                // If the copy was successful, add path to updates
                updates.profileImage = dbPath;
                
                // Delete the temporary file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                
                // Clean up old profile image if it exists
                const user = await User.findById(userId);
                if (user && user.profileImage && user.profileImage !== dbPath) {
                    const oldImagePath = path.join(__dirname, '..', user.profileImage);
                    console.log('Old image path:', oldImagePath);
                    
                    // Check if file exists before attempting to delete
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath);
                            console.log('Old profile image deleted successfully');
                        } catch (fileError) {
                            console.log('Error deleting old profile image:', fileError);
                            // Continue with the update even if file deletion fails
                        }
                    } else {
                        console.log('Old image file does not exist');
                    }
                }
            } catch (fileError) {
                console.error('Error handling profile image:', fileError);
                return res.status(500).json({ msg: "Failed to save profile image" });
            }
        }
        
        if (password) {
            if (password.length < 6){ 
                console.log('Password too short');
                return res.status(400).json({
                msg : "Password length must be at least 6 characters or more"
            });  
            } 
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password,salt);
            console.log('Password hashed successfully');
        };

        // Check if there are any updates to make
        console.log('Updates to apply:', JSON.stringify(updates));
        if (Object.keys(updates).length === 0) {
            console.log('No updates provided');
            return res.status(400).json({ msg: "No valid updates provided" });
        }

        console.log('Finding user to update with ID:', userId);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            console.log('User not found for update');
            return res.status(404).json({ msg: "User not found" });
        }

        console.log('User updated successfully:', updatedUser._id);
        console.log('--------------- PROFILE UPDATE END ---------------');
        
        return res.status(200).json({
            msg: "Update Successful",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profileImage: updatedUser.profileImage,
                uniqueId: updatedUser.uniqueId,
                dateOfBirth: updatedUser.dateOfBirth,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });
    } catch (error) {
        console.log("Update error", error.message);
        console.log("Error stack:", error.stack);
        
        if (error.name === 'ValidationError') {
            console.log('Validation error details:', error.errors);
            return res.status(400).json({ msg: "Validation error: " + error.message });
        } else if (error.name === 'CastError') {
            console.log('Cast error details:', error);
            return res.status(400).json({ msg: "Invalid data format" });
        } else if (error.code === 11000) {
            console.log('Duplicate key error:', error.keyValue);
            return res.status(400).json({ msg: "That unique ID is already taken" });
        }
        console.log('--------------- PROFILE UPDATE ERROR END ---------------');
        return res.status(500).json({ msg : "Internal server error" });
    }
}

// Upload profile image
export const uploadProfileImage = async (req, res) => {
    console.log('--- PROFILE IMAGE UPLOAD START ---');
    console.log('Request file:', req.file);
    
    try {
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ msg: "No file uploaded" });
        }

        console.log('File received:', {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        
        // Ensure the file is valid
        if (!req.file.filename) {
            console.log('File missing filename');
            return res.status(400).json({ msg: "Invalid file" });
        }
        
        // Create the file path for use in the database
        const filePath = `/uploads/profiles/${req.file.filename}`;
        console.log('File path for database:', filePath);
        
        // Check if file exists in the expected location
        const fullPath = path.join(__dirname, '..', filePath);
        const fileExists = fs.existsSync(fullPath);
        console.log(`File exists at ${fullPath}: ${fileExists}`);
        
        if (!fileExists) {
            console.log('File not found at expected path');
            return res.status(500).json({ msg: "File upload processing error" });
        }
        
        console.log('--- PROFILE IMAGE UPLOAD SUCCESS ---');
        
        return res.status(200).json({
            msg: "File uploaded successfully",
            filePath: filePath
        });
    } catch (error) {
        console.log("Upload error", error.message);
        console.log("Error stack:", error.stack);
        console.log('--- PROFILE IMAGE UPLOAD ERROR ---');
        
        return res.status(500).json({ msg: "Internal server error" });
    }
}

// Search for users by name or email
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { uniqueId: { $regex: query, $options: 'i' } }
      ]
    }).select('name email profileImage uniqueId');

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error.message
    });
  }
};


