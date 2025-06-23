import * as v from 'valibot';
import { UserType } from 'libs/auth';

export const SignUpWithEmailAndPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
  fullName: v.pipe(v.string(), v.minLength(1)),
  username: v.pipe(v.string(), v.minLength(1)),
  country: v.pipe(v.string(), v.minLength(1)),
});

export type SignUpWithEmailAndPassword = v.InferInput<
  typeof SignUpWithEmailAndPasswordSchema
>;

export const LoginWithEmailAndPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
});
export type LoginWithEmailAndPassword = v.InferInput<
  typeof LoginWithEmailAndPasswordSchema
>;

export const SwitchProfileSchema = v.object({
  profile: v.pipe(v.enum(UserType)),
});
export type SwitchProfile = v.InferInput<typeof SwitchProfileSchema>;

export const VerifyEmailSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.minLength(4)),
});
export type VerifyEmail = v.InferInput<typeof VerifyEmailSchema>;

export const ResendOtpSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});
export type ResendOtp = v.InferInput<typeof ResendOtpSchema>;

export const ForgotPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});
export type ForgotPassword = v.InferInput<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.minLength(4)),
  newPassword: v.pipe(v.string(), v.minLength(6)),
});
export type ResetPassword = v.InferInput<typeof ResetPasswordSchema>;
