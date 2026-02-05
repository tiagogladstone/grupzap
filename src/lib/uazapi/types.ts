/**
 * UAZAPI TypeScript Types
 * Tipos completos para integração com a API UAZAPI
 */

// ==================== CONFIG ====================

export interface UazapiConfig {
  /** URL base da instância UAZAPI (ex: https://seu-servidor.uazapi.dev) */
  baseUrl: string;
  /** Token de autenticação da instância */
  token: string;
  /** Timeout em ms para requisições (default: 30000) */
  timeout?: number;
  /** Número máximo de retries (default: 3) */
  maxRetries?: number;
  /** Delay base para retry exponencial em ms (default: 1000) */
  retryDelay?: number;
  /** Habilitar logs de debug */
  debug?: boolean;
}

// ==================== RESPONSE BASE ====================

export interface ApiResponse<T> {
  code: number;
  data: T;
  success: boolean;
}

export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

// ==================== INSTANCE/SESSION ====================

export interface ConnectOptions {
  /** Eventos para se inscrever */
  subscribe?: WebhookEvent[];
  /** Conexão imediata */
  immediate?: boolean;
}

export interface ConnectionStatus {
  Connected: boolean;
  LoggedIn: boolean;
}

export interface ConnectResponse {
  details: string;
  events: string;
  jid: string;
  webhook: string;
}

export interface QRCodeResponse {
  QRCode: string;
}

export interface DisconnectResponse {
  Details: string;
}

// ==================== MESSAGES ====================

export interface MessageOptions {
  /** Delay em ms antes de enviar */
  delay?: number;
  /** ID da mensagem para responder */
  replyTo?: string;
  /** JID do participante (para grupos) */
  replyParticipant?: string;
  /** Mostrar preview de links */
  linkPreview?: boolean;
  /** ID customizado da mensagem */
  messageId?: string;
}

export interface SendTextParams {
  phone: string;
  message: string;
  options?: MessageOptions;
}

export interface SendMediaParams {
  phone: string;
  /** Base64 data URL ou URL da mídia */
  media: string;
  caption?: string;
  filename?: string;
  options?: MessageOptions;
}

export interface SendAudioParams {
  phone: string;
  /** Base64 data URL do áudio (formato OGG/Opus) */
  audio: string;
  options?: MessageOptions;
}

export interface SendLocationParams {
  phone: string;
  latitude: number;
  longitude: number;
  name?: string;
  options?: MessageOptions;
}

export interface SendContactParams {
  phone: string;
  contactName: string;
  vcard: string;
  options?: MessageOptions;
}

export interface SendStickerParams {
  phone: string;
  /** Base64 data URL do sticker (WebP ou MP4 animado) */
  sticker: string;
  packId?: string;
  packName?: string;
  packPublisher?: string;
  emojis?: string[];
  options?: MessageOptions;
}

export type ButtonType = 'quickreply' | 'url' | 'call';

export interface Button {
  DisplayText: string;
  Type: ButtonType;
  Url?: string;
  PhoneNumber?: string;
}

export interface SendButtonsParams {
  phone: string;
  content: string;
  buttons: Button[];
  footer?: string;
  options?: MessageOptions;
}

export interface SendMessageResponse {
  Details: string;
  Id: string;
  Timestamp: string;
}

export interface PresenceState {
  phone: string;
  state: 'composing' | 'paused';
  media?: 'audio';
}

export interface ReactParams {
  phone: string;
  messageId: string;
  emoji: string;
}

export interface MarkReadParams {
  messageIds: string[];
  chatPhone: string;
  senderPhone: string;
}

// ==================== GROUPS ====================

export interface GroupParticipant {
  JID: string;
  IsAdmin: boolean;
  IsSuperAdmin: boolean;
}

export interface Group {
  JID: string;
  Name: string;
  Topic?: string;
  OwnerJID: string;
  GroupCreated: string;
  IsAnnounce: boolean;
  IsLocked: boolean;
  IsEphemeral?: boolean;
  DisappearingTimer?: number;
  Participants: GroupParticipant[];
}

export interface GroupListResponse {
  Groups: Group[];
}

export interface CreateGroupParams {
  name: string;
  participants: string[];
}

export interface CreateGroupResponse {
  JID: string;
  Name: string;
  OwnerJID: string;
  GroupCreated: string;
  Participants: GroupParticipant[];
}

export type ParticipantAction = 'add' | 'remove' | 'promote' | 'demote';

export interface ModifyParticipantParams {
  groupJid: string;
  action: ParticipantAction;
  participantJid: string;
}

export interface InviteLinkResponse {
  InviteLink: string;
}

export type DisappearingDuration = '24h' | '7d' | '90d' | 'off';

export interface GroupSettingsParams {
  groupJid: string;
}

// ==================== WEBHOOKS ====================

export type WebhookEvent = 
  | 'Message'
  | 'ReadReceipt'
  | 'HistorySync'
  | 'ChatPresence'
  | 'group_participant';

export interface WebhookConfig {
  webhook: string;
  subscribe?: WebhookEvent[];
}

export interface SetWebhookParams {
  url: string;
  events?: WebhookEvent[];
}

export interface WebhookResponse {
  webhook: string;
  subscribe: WebhookEvent[];
}

// ==================== WEBHOOK PAYLOADS ====================

export interface WebhookMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

export interface WebhookTextMessage {
  conversation?: string;
  extendedTextMessage?: {
    text: string;
    contextInfo?: {
      quotedMessage?: unknown;
      stanzaId?: string;
      participant?: string;
    };
  };
}

export interface WebhookImageMessage {
  url: string;
  mimetype: string;
  caption?: string;
  fileSha256: string;
  fileLength: number;
  mediaKey: string;
}

export interface WebhookVideoMessage {
  url: string;
  mimetype: string;
  caption?: string;
  fileSha256: string;
  fileLength: number;
  mediaKey: string;
  seconds?: number;
}

export interface WebhookAudioMessage {
  url: string;
  mimetype: string;
  fileSha256: string;
  fileLength: number;
  mediaKey: string;
  seconds?: number;
  ptt?: boolean;
}

export interface WebhookDocumentMessage {
  url: string;
  mimetype: string;
  fileName: string;
  fileSha256: string;
  fileLength: number;
  mediaKey: string;
}

export interface WebhookMessage {
  key: WebhookMessageKey;
  message: WebhookTextMessage & {
    imageMessage?: WebhookImageMessage;
    videoMessage?: WebhookVideoMessage;
    audioMessage?: WebhookAudioMessage;
    documentMessage?: WebhookDocumentMessage;
    stickerMessage?: unknown;
    locationMessage?: unknown;
    contactMessage?: unknown;
  };
  messageTimestamp: number;
  pushName: string;
}

export interface WebhookMessageUpsert {
  event: 'messages.upsert';
  timestamp: number;
  data: {
    messages: WebhookMessage;
  };
}

export interface WebhookGroupParticipant {
  event: 'group_participant';
  data: {
    groupJid: string;
    participantJid: string;
    action: ParticipantAction;
  };
}

export interface WebhookConnection {
  details: string;
  events: string;
  jid: string;
  webhook: string;
}

export type WebhookPayload = 
  | WebhookMessageUpsert 
  | WebhookGroupParticipant 
  | WebhookConnection;

// ==================== USER ====================

export interface CheckNumberResponse {
  exists: boolean;
  jid?: string;
}

export interface UserInfo {
  jid: string;
  name?: string;
  status?: string;
  picture?: string;
}

export interface AvatarResponse {
  url: string;
  id?: string;
}

// ==================== ADMIN ====================

export interface AdminInstance {
  id: number;
  name: string;
  token: string;
  webhook: string;
  jid?: string;
  connected: boolean;
  events: string;
}

export interface CreateInstanceParams {
  name: string;
  token: string;
  webhook?: string;
  events?: string;
}

// ==================== LOGGER ====================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}
