import { env } from "@/config/env";

import { WhatsAppProvider } from "./whatsapp-interface";

export class InteraktAdapter implements WhatsAppProvider {
  async sendTemplateMessage(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<void> {
    const response = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${env.INTERAKT_API_KEY}`,
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: to,
        callbackData: templateName,
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          bodyValues: params,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `WhatsApp delivery failed: ${response.statusText}`,
      );
    }
  }
}
