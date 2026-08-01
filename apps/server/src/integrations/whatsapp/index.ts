import { env } from "@/config/env";

import { InteraktAdapter } from "./interakt-adapter";
import { WhatsAppProvider } from "./whatsapp-interface";

function createWhatsAppProvider(): WhatsAppProvider {
  switch (env.WHATSAPP_PROVIDER) {
    case "interakt":
    default:
      return new InteraktAdapter();
  }
}

export const whatsAppProvider = createWhatsAppProvider();
