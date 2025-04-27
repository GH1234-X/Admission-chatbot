import { db } from '../db';
import { userTable } from '../models/userModel';
import { verifyOTP } from './otpController';
import { hash } from 'bcryptjs';

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  otp: string;
}) => {
  try {
    const { username, email, password, otp } = userData;

    // Verify OTP first
    const otpVerification = await verifyOTP(email, otp);
    if (!otpVerification.success) {
      return { success: false, message: otpVerification.message };
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const [newUser] = await db.insert(userTable)
      .values({
        username,
        email,
        password: hashedPassword,
        role: 'Student'
      })
      .returning();

    return { 
      success: true, 
      message: 'User registered successfully',
      user: newUser
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}; 