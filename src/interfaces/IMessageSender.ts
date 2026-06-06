/** Channel over which the message is sent. */
export type MessageChannel = 'email' | 'whatsapp';

/** Input parameters for sending a message, channel-agnostic. */
export type SendMessageParams = {
  channel: MessageChannel;
  /** Recipient address: email address or E.164 phone number. */
  to: string;
  subject?: string;
  body: string;
};

/** Result returned after a send attempt. */
export type SendMessageResult = {
  success: boolean;
  /** Provider-assigned message identifier, present on success. */
  messageId?: string;
  /** ISO 8601 timestamp of the send attempt. */
  timestamp: string;
  /** Error detail when success is false. */
  error?: string;
};

/**
 * Channel-agnostic contract for outbound messaging.
 * Implementations cover Resend (email), Twilio (WhatsApp/SMS), and Meta (WhatsApp).
 */
export interface IMessageSender {
  send(params: SendMessageParams): Promise<SendMessageResult>;
}
