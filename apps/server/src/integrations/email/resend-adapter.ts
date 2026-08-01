import { Resend } from "resend";

import { env } from "@/config/env";
import { OTP_TTL_MS } from "@/constants/auth";
import { msToMinutes } from "@/utils/date-time";

import { EmailProvider } from "./email-interface";

export class ResendAdapter implements EmailProvider {
  private client = new Resend(env.RESEND_API_KEY);

  async sendOtp(to: string, otp: string): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Your Splexa verification code",
      text: `Your code is ${otp}. It expires in ${msToMinutes(OTP_TTL_MS)} minutes.\nDo not share this code with anyone.`,
    });

    if (error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}
