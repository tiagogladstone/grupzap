/**
 * UAZAPI Messages Endpoints
 * Envio de mensagens de texto, mídia, áudio, etc.
 */

import type {
  ApiResponse,
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
} from '../types';

export interface MessagesEndpoints {
  /**
   * Envia mensagem de texto.
   */
  sendText(params: SendTextParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia imagem com caption opcional.
   */
  sendImage(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia vídeo com caption opcional.
   */
  sendVideo(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia áudio/mensagem de voz (formato OGG/Opus).
   */
  sendAudio(params: SendAudioParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia documento/arquivo.
   */
  sendDocument(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia sticker (WebP estático ou MP4 animado).
   */
  sendSticker(params: SendStickerParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia localização.
   */
  sendLocation(params: SendLocationParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia contato (vCard).
   */
  sendContact(params: SendContactParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia mensagem com botões interativos.
   */
  sendButtons(params: SendButtonsParams): Promise<ApiResponse<SendMessageResponse>>;

  /**
   * Envia indicador de presença (digitando/gravando).
   */
  sendPresence(params: PresenceState): Promise<ApiResponse<any>>;

  /**
   * Reage a uma mensagem com emoji.
   */
  react(params: ReactParams): Promise<ApiResponse<any>>;

  /**
   * Marca mensagens como lidas.
   */
  markAsRead(params: MarkReadParams): Promise<ApiResponse<any>>;
}

type RequestFn = <T>(method: string, endpoint: string, body?: object) => Promise<ApiResponse<T>>;

export function createMessagesEndpoints(request: RequestFn): MessagesEndpoints {
  // Helper para construir ContextInfo de reply
  const buildContextInfo = (options?: { replyTo?: string; replyParticipant?: string }) => {
    if (!options?.replyTo) return undefined;
    return {
      StanzaId: options.replyTo,
      ...(options.replyParticipant && { Participant: options.replyParticipant }),
    };
  };

  return {
    async sendText(params: SendTextParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/text', {
        Phone: params.phone,
        Body: params.message,
        ...(params.options?.linkPreview !== undefined && { LinkPreview: params.options.linkPreview }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendImage(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/image', {
        Phone: params.phone,
        Image: params.media,
        ...(params.caption && { Caption: params.caption }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendVideo(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/video', {
        Phone: params.phone,
        Video: params.media,
        ...(params.caption && { Caption: params.caption }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendAudio(params: SendAudioParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/audio', {
        Phone: params.phone,
        Audio: params.audio,
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendDocument(params: SendMediaParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/document', {
        Phone: params.phone,
        Document: params.media,
        FileName: params.filename || 'document',
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendSticker(params: SendStickerParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/sticker', {
        Phone: params.phone,
        Sticker: params.sticker,
        ...(params.packId && { PackId: params.packId }),
        ...(params.packName && { PackName: params.packName }),
        ...(params.packPublisher && { PackPublisher: params.packPublisher }),
        ...(params.emojis && { Emojis: params.emojis }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendLocation(params: SendLocationParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/location', {
        Phone: params.phone,
        Latitude: params.latitude,
        Longitude: params.longitude,
        ...(params.name && { Name: params.name }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendContact(params: SendContactParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/contact', {
        Phone: params.phone,
        Name: params.contactName,
        Vcard: params.vcard,
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendButtons(params: SendButtonsParams): Promise<ApiResponse<SendMessageResponse>> {
      const contextInfo = buildContextInfo(params.options);
      return request<SendMessageResponse>('POST', '/chat/send/template', {
        Phone: params.phone,
        Content: params.content,
        Buttons: params.buttons,
        ...(params.footer && { Footer: params.footer }),
        ...(params.options?.messageId && { Id: params.options.messageId }),
        ...(contextInfo && { ContextInfo: contextInfo }),
      });
    },

    async sendPresence(params: PresenceState): Promise<ApiResponse<any>> {
      return request<any>('POST', '/chat/presence', {
        Phone: params.phone,
        State: params.state,
        Media: params.media || '',
      });
    },

    async react(params: ReactParams): Promise<ApiResponse<any>> {
      return request<any>('POST', '/chat/react', {
        Phone: params.phone,
        Id: params.messageId,
        Body: params.emoji,
      });
    },

    async markAsRead(params: MarkReadParams): Promise<ApiResponse<any>> {
      return request<any>('POST', '/chat/markread', {
        Id: params.messageIds,
        ChatPhone: params.chatPhone,
        SenderPhone: params.senderPhone,
      });
    },
  };
}
