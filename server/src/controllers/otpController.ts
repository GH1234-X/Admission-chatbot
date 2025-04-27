import { db } from '../db';
import { otpTable } from '../models/otpModel';
import { eq, and, gt } from 'drizzle-orm';
import { mailSender } from '../utils/mailSender';
import { generateOTP } from '../utils/otpGenerator';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export const sendOTP = async (email: string) => {
  try {
    const auth = getAuth();
    const firestore = getFirestore();
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Firestore
    const otpRef = collection(firestore, 'otpVerifications');
    await addDoc(otpRef, {
      email,
      otp,
      createdAt: Timestamp.now(),
      verified: false
    });

    // Send verification email
    await mailSender({
      email,
      title: "Verification Email",
      body: `
        <h1>Please confirm your OTP</h1>
        <p>Here is your OTP code: ${otp}</p>
        <p>This OTP will expire in 5 minutes.</p>
      `
    });

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const firestore = getFirestore();
    const otpRef = collection(firestore, 'otpVerifications');
    
    // Find the most recent OTP for the email
    const q = query(
      otpRef,
      where('email', '==', email),
      where('otp', '==', otp),
      where('createdAt', '>', Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))),
      where('verified', '==', false)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as verified and delete it
    const otpDoc = querySnapshot.docs[0];
    await deleteDoc(doc(firestore, 'otpVerifications', otpDoc.id));

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}; 