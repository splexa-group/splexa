import { Resend } from "resend";

import { env } from "@/config/env";
import { OTP_TTL_MINUTES } from "@/config/constants";

import type { EmailProvider } from "./email-interface";

export class ResendAdapter implements EmailProvider {
  private client = new Resend(env.RESEND_API_KEY);

  async sendOtp(to: string, otp: string): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Your Splexa verification code",
      text: `Your code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.\nDo not share this code with anyone.`,
    });

    if (error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}
