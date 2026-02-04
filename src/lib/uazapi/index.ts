/**
 * UAZAPI TypeScript Client
 * 
 * Cliente completo para integração com UAZAPI (WhatsApp API)
 * 
 * @example
 * ```typescript
 * import { UazapiClient } from '@/lib/uazapi';
 * 
 * const client = new UazapiClient({
 *   baseUrl: 'https://seu-servidor.uazapi.dev',
 *   token: 'seu_token',
 * });
 * 
 * // Verificar conexão
 * const connected = await client.isConnected();
 * 
 * // Enviar mensagem
 * await client.send('5511999999999', 'Olá!');
 * 
 * // Usar endpoints específicos
 * await client.messages.sendImage({
 *   phone: '5511999999999',
 *   media: 'data:image/jpeg;base64,...',
 *   caption: 'Foto legal!'
 * });
 * 
 * // Grupos
 * const groups = await client.groups.list();
 * await client.groups.addParticipant('120363...@g.us', '5511888888888');
 * ```
 */

// Client principal
export { UazapiClient, UazapiError } from './client';

// Types
export type {
  // Config
  UazapiConfig,
  
  // Responses
  ApiResponse,
  ApiError,
  
  // Instance
  ConnectOptions,
  ConnectionStatus,
  ConnectResponse,
  QRCodeResponse,
  DisconnectResponse,
  
  // Messages
  MessageOptions,
  SendTextParams,
  SendMediaParams,
  SendAudioParams,
  SendLocationParams,
  SendContactParams,
  SendStickerParams,
  SendButtonsParams,
  SendMessageResponse,
  PresenceState,
  ReactParams,
  MarkReadParams,
  Button,
  ButtonType,
  
  // Groups
  Group,
  GroupParticipant,
  GroupListResponse,
  CreateGroupParams,
  CreateGroupResponse,
  ModifyParticipantParams,
  InviteLinkResponse,
  ParticipantAction,
  DisappearingDuration,
  
  // Webhooks
  WebhookEvent,
  WebhookConfig,
  SetWebhookParams,
  WebhookResponse,
  
  // Webhook Payloads
  WebhookMessageKey,
  WebhookTextMessage,
  WebhookImageMessage,
  WebhookVideoMessage,
  WebhookAudioMessage,
  WebhookDocumentMessage,
  WebhookMessage,
  WebhookMessageUpsert,
  WebhookGroupParticipant,
  WebhookConnection,
  WebhookPayload,
  
  // User
  CheckNumberResponse,
  UserInfo,
  AvatarResponse,
  
  // Admin
  AdminInstance,
  CreateInstanceParams,
  
  // Logger
  LogLevel,
  LogEntry,
} from './types';

// Endpoint types
export type { InstanceEndpoints } from './endpoints/instance';
export type { MessagesEndpoints } from './endpoints/messages';
export type { GroupsEndpoints } from './endpoints/groups';
export type { WebhooksEndpoints } from './endpoints/webhooks';

// Constants
export { WEBHOOK_EVENTS } from './endpoints/webhooks';

// ==================== FACTORY HELPERS ====================

import { UazapiClient } from './client';
import type { UazapiConfig } from './types';

/**
 * Cria cliente UAZAPI com configuração do ambiente
 */
export function createUazapiClient(config?: Partial<UazapiConfig>): UazapiClient {
  const baseUrl = config?.baseUrl || process.env.UAZAPI_BASE_URL;
  const token = config?.token || process.env.UAZAPI_TOKEN;

  if (!baseUrl) {
    throw new Error('UAZAPI_BASE_URL is required (env or config)');
  }

  if (!token) {
    throw new Error('UAZAPI_TOKEN is required (env or config)');
  }

  return new UazapiClient({
    baseUrl,
    token,
    debug: config?.debug ?? process.env.NODE_ENV === 'development',
    timeout: config?.timeout,
    maxRetries: config?.maxRetries,
    retryDelay: config?.retryDelay,
  });
}

// ==================== WEBHOOK HELPERS ====================

import * as crypto from 'crypto';
import type { WebhookPayload, WebhookMessageUpsert, WebhookGroupParticipant } from './types';

/**
 * Verifica assinatura HMAC do webhook
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Type guard para mensagem recebida
 */
export function isMessageUpsert(payload: WebhookPayload): payload is WebhookMessageUpsert {
  return 'event' in payload && payload.event === 'messages.upsert';
}

/**
 * Type guard para evento de grupo
 */
export function isGroupParticipant(payload: WebhookPayload): payload is WebhookGroupParticipant {
  return 'event' in payload && payload.event === 'group_participant';
}

/**
 * Extrai texto de uma mensagem do webhook
 */
export function extractMessageText(message: WebhookMessageUpsert): string | null {
  const msg = message.data.messages.message;
  return msg.conversation || msg.extendedTextMessage?.text || null;
}

/**
 * Verifica se mensagem é de grupo
 */
export function isGroupMessage(message: WebhookMessageUpsert): boolean {
  return message.data.messages.key.remoteJid.endsWith('@g.us');
}

/**
 * Extrai número do remetente (sem @s.whatsapp.net)
 */
export function extractSenderPhone(message: WebhookMessageUpsert): string {
  const jid = message.data.messages.key.remoteJid;
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
}

// ==================== PHONE UTILS ====================

/**
 * Normaliza número de telefone para formato E.164 (sem +)
 */
export function normalizePhone(phone: string): string {
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '');
  
  // Se começar com 0, remove
  if (digits.startsWith('0')) {
    return digits.slice(1);
  }
  
  return digits;
}

/**
 * Converte telefone para JID do WhatsApp
 */
export function phoneToJid(phone: string): string {
  if (phone.includes('@')) return phone;
  return `${normalizePhone(phone)}@s.whatsapp.net`;
}

/**
 * Extrai telefone de um JID
 */
export function jidToPhone(jid: string): string {
  return jid.split('@')[0];
}

/**
 * Verifica se é JID de grupo
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
}
