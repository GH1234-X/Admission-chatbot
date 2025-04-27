import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const otpTable = pgTable('otp', {
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type OTP = typeof otpTable.$inferSelect;
export type NewOTP = typeof otpTable.$inferInsert; 