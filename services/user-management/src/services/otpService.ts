import crypto from 'crypto';
import { logger } from '../utils/logger';

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  try {
    // TODO: Integrate with actual email service (SendGrid, SES, etc.)
    logger.info(`Sending OTP via email to ${email}: ${otp}`);
    
    // Mock email sending for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 OTP Email to ${email}: ${otp}`);
      return;
    }
    
    // In production, integrate with your email service
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: 'noreply@jewelryshop.com',
      subject: 'Your OTP for Jewelry Shop',
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`
    };
    
    await sgMail.send(msg);
    */
    
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export const sendOTPSMS = async (phone: string, otp: string): Promise<void> => {
  try {
    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
    logger.info(`Sending OTP via SMS to ${phone}: ${otp}`);
    
    // Mock SMS sending for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP SMS to ${phone}: ${otp}`);
      return;
    }
    
    // In production, integrate with your SMS service
    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Your Jewelry Shop OTP is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    */
    
  } catch (error) {
    logger.error('Failed to send OTP SMS:', error);
    throw new Error('Failed to send OTP SMS');
  }
};