import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateToken } from "../utils/generateToken";

// Register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role)
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error"});
  }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString(), user.role)
    res.json({
      success:true,
      token:token,
      expiresIn:'7d',
      user:{
        _id: user._id,
        name: user.name,
        role: user.role,
      }
      });
    
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Users (Admin Only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// get me 
export const getUser = async function (req, res) {
    try{
      const user = await User.findById(req.user.userId).select("-password");

      if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
      return res.status(200).json({
          success: true,
          data: {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
          },
        });
    }catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
}

// user by Id
export const getUserById = async function (req, res) {
    try{
      const { id } = req.params;
      
      const user = await User.findById(id).select("-password");

      if(!user) return res.status(404).json({ success:false, msg:"User not Found"});

      res.status(200).json({
        success:true,
        data: user
      })
    }catch(error){
        res.status(500).json({msg:"Server error"})
    }
}

// Update User 
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedUpdates = ["name", "role"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated",
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// delete User by admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.userId === id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

    // const user = await User.findByIdAndDelete(id);
    const user = await User.findByIdAndUpdate(id, { isDeleted: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};