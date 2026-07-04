import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DB } from '../services/db.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devvault-super-secret-jwt-signing-key-12345';

// Helper to generate JWT token
const generateToken = (payload: { id: string; username: string; email: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Register a new developer
 */
export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Please provide username, email and password' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ message: 'Username must be at least 3 characters long' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const emailExists = await DB.findUserByEmail(email);
    if (emailExists) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const usernameExists = await DB.findUserByUsername(username);
    if (usernameExists) {
      res.status(400).json({ message: 'Username already taken' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await DB.createUser({
      username,
      email,
      passwordHash,
      theme: 'dark' // default theme
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    });

    res.status(211).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        theme: newUser.theme,
        createdAt: newUser.createdAt
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during registration' });
  }
}

/**
 * Login developer
 */
export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const user = await DB.findUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        developerBio: user.developerBio,
        portfolioUrl: user.portfolioUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        resumeUrl: user.resumeUrl,
        profileImage: user.profileImage,
        theme: user.theme,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during login' });
  }
}

/**
 * Get current developer profile
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await DB.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      developerBio: user.developerBio,
      portfolioUrl: user.portfolioUrl,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      resumeUrl: user.resumeUrl,
      profileImage: user.profileImage,
      theme: user.theme,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get profile' });
  }
}

/**
 * Update developer profile
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const {
      developerBio,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      resumeUrl,
      profileImage,
      theme
    } = req.body;

    const updatedUser = await DB.updateUser(req.user.id, {
      developerBio,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      resumeUrl,
      profileImage,
      theme
    });

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      developerBio: updatedUser.developerBio,
      portfolioUrl: updatedUser.portfolioUrl,
      githubUrl: updatedUser.githubUrl,
      linkedinUrl: updatedUser.linkedinUrl,
      resumeUrl: updatedUser.resumeUrl,
      profileImage: updatedUser.profileImage,
      theme: updatedUser.theme,
      createdAt: updatedUser.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
}

/**
 * Change user password
 */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Please provide current and new password' });
      return;
    }

    const user = await DB.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect current password' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await DB.updateUser(req.user.id, { passwordHash });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to change password' });
  }
}

/**
 * Forgot password (dummy implementation)
 */
export async function forgotPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Please provide email' });
      return;
    }

    const user = await DB.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: 'No developer account found with this email' });
      return;
    }

    // Generate a secure temp password
    const tempPass = Math.random().toString(36).substring(2, 10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPass, salt);

    // Update password
    await DB.updateUser(user.id, { passwordHash });

    res.status(200).json({
      message: 'Password reset successful! A temporary password has been generated.',
      tempPassword: tempPass,
      instructions: 'Please log in with this temporary password and change it immediately from Settings.'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to request reset password' });
  }
}

/**
 * Delete account and all associated projects
 */
export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const success = await DB.deleteUser(req.user.id);
    if (!success) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Account and all associated projects deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete account' });
  }
}
