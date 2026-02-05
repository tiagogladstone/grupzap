/**
 * UAZAPI Webhooks Endpoints
 * Configuração e gerenciamento de webhooks
 */

import type {
  ApiResponse,
  SetWebhookParams,
  WebhookResponse,
  WebhookEvent,
} from '../types';

/** Resposta genérica para operações de webhook */
interface WebhookOperationResponse {
  success?: boolean;
  message?: string;
}

export interface WebhooksEndpoints {
  /**
   * Configura URL do webhook para receber eventos.
   */
  configure(params: SetWebhookParams): Promise<ApiResponse<{ webhook: string }>>;

  /**
   * Obtém configuração atual do webhook.
   */
  get(): Promise<ApiResponse<WebhookResponse>>;

  /**
   * Configura chave HMAC para assinatura de webhooks.
   */
  setHmacKey(key: string): Promise<ApiResponse<WebhookOperationResponse>>;

  /**
   * Atualiza eventos inscritos no webhook.
   */
  setEvents(events: WebhookEvent[]): Promise<ApiResponse<{ webhook: string }>>;
}

/**
 * Todos os eventos disponíveis para inscrição
 */
export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'Message',
  'ReadReceipt',
  'HistorySync',
  'ChatPresence',
  'group_participant',
];

type RequestFn = <T>(method: string, endpoint: string, body?: object) => Promise<ApiResponse<T>>;

export function createWebhooksEndpoints(request: RequestFn): WebhooksEndpoints {
  return {
    async configure(params: SetWebhookParams): Promise<ApiResponse<{ webhook: string }>> {
      return request<{ webhook: string }>('POST', '/webhook', {
        webhookURL: params.url,
        ...(params.events && { events: params.events.join(',') }),
      });
    },

    async get(): Promise<ApiResponse<WebhookResponse>> {
      return request<WebhookResponse>('GET', '/webhook');
    },

    async setHmacKey(key: string): Promise<ApiResponse<WebhookOperationResponse>> {
      if (key.length < 32) {
        throw new Error('HMAC key must be at least 32 characters');
      }
      return request<WebhookOperationResponse>('POST', '/session/hmac/config', {
        hmac_key: key,
      });
    },

    async setEvents(events: WebhookEvent[]): Promise<ApiResponse<{ webhook: string }>> {
      // Re-configura webhook com novos eventos
      const current = await this.get();
      return this.configure({
        url: current.data.webhook,
        events,
      });
    },
  };
}
