export interface EmailProvider {
  sendOtp(to: string, otp: string): Promise<void>;
}
