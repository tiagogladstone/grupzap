/**
 * UAZAPI Instance/Session Endpoints
 * Gerenciamento de conexão e sessão WhatsApp
 */

import type {
  ApiResponse,
  ConnectOptions,
  ConnectResponse,
  ConnectionStatus,
  QRCodeResponse,
  DisconnectResponse,
  WebhookEvent,
} from '../types';

export interface InstanceEndpoints {
  /**
   * Conecta ao WhatsApp. Se não houver sessão, gera QR Code.
   * @param options - Opções de conexão (eventos para inscrição)
   */
  connect(options?: ConnectOptions): Promise<ApiResponse<ConnectResponse>>;

  /**
   * Desconecta do WhatsApp mantendo a sessão (reconecta sem QR).
   */
  disconnect(): Promise<ApiResponse<DisconnectResponse>>;

  /**
   * Desconecta e remove a sessão completamente (requer novo QR Code).
   */
  logout(): Promise<ApiResponse<DisconnectResponse>>;

  /**
   * Verifica status da conexão.
   */
  getStatus(): Promise<ApiResponse<ConnectionStatus>>;

  /**
   * Obtém QR Code em base64 para escanear.
   */
  getQRCode(): Promise<ApiResponse<QRCodeResponse>>;
}

type RequestFn = <T>(method: string, endpoint: string, body?: object) => Promise<ApiResponse<T>>;

export function createInstanceEndpoints(request: RequestFn): InstanceEndpoints {
  return {
    async connect(options: ConnectOptions = {}): Promise<ApiResponse<ConnectResponse>> {
      const subscribe = options.subscribe || ['Message'];
      return request<ConnectResponse>('POST', '/session/connect', {
        Subscribe: subscribe,
        Immediate: options.immediate ?? false,
      });
    },

    async disconnect(): Promise<ApiResponse<DisconnectResponse>> {
      return request<DisconnectResponse>('POST', '/session/disconnect');
    },

    async logout(): Promise<ApiResponse<DisconnectResponse>> {
      return request<DisconnectResponse>('POST', '/session/logout');
    },

    async getStatus(): Promise<ApiResponse<ConnectionStatus>> {
      return request<ConnectionStatus>('GET', '/session/status');
    },

    async getQRCode(): Promise<ApiResponse<QRCodeResponse>> {
      return request<QRCodeResponse>('GET', '/session/qr');
    },
  };
}
