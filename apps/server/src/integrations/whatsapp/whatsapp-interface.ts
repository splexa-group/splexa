export interface WhatsAppProvider {
  sendTemplateMessage(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<void>;
}
