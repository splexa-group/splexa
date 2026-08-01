import { env } from "@/config/env";

import { EmailProvider } from "./email-interface";
import { ResendAdapter } from "./resend-adapter";

function createEmailProvider(): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    default:
      return new ResendAdapter();
  }
}

export const emailProvider = createEmailProvider();
