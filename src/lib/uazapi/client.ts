/**
 * UAZAPI Client
 * Cliente TypeScript completo para integração com UAZAPI
 */

import type {
  UazapiConfig,
  ApiResponse,
  ApiError,
  LogLevel,
  LogEntry,
} from './types';

import { createInstanceEndpoints, type InstanceEndpoints } from './endpoints/instance';
import { createMessagesEndpoints, type MessagesEndpoints } from './endpoints/messages';
import { createGroupsEndpoints, type GroupsEndpoints } from './endpoints/groups';
import { createWebhooksEndpoints, type WebhooksEndpoints } from './endpoints/webhooks';

/**
 * Erro customizado para respostas da API
 */
export class UazapiError extends Error {
  public readonly code: number;
  public readonly details?: string;
  public readonly response?: Response;

  constructor(message: string, code: number, details?: string, response?: Response) {
    super(message);
    this.name = 'UazapiError';
    this.code = code;
    this.details = details;
    this.response = response;
  }
}

/**
 * Logger estruturado para o cliente
 */
class Logger {
  private debugEnabled: boolean;
  private prefix = '[UAZAPI]';

  constructor(debugEnabled: boolean = false) {
    this.debugEnabled = debugEnabled;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level === 'debug' && !this.debugEnabled) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formatted = `${this.prefix} [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'error':
        console.error(formatted, context || '');
        break;
      case 'warn':
        console.warn(formatted, context || '');
        break;
      case 'debug':
        console.debug(formatted, context || '');
        break;
      default:
        console.log(formatted, context || '');
    }
  }

  debugLog(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }
}

/**
 * Cliente principal UAZAPI
 */
export class UazapiClient {
  private config: Required<UazapiConfig>;
  private logger: Logger;

  // Endpoints organizados por categoria
  public readonly instance: InstanceEndpoints;
  public readonly messages: MessagesEndpoints;
  public readonly groups: GroupsEndpoints;
  public readonly webhooks: WebhooksEndpoints;

  constructor(config: UazapiConfig) {
    // Config com defaults
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      token: config.token,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? false,
    };

    this.logger = new Logger(this.config.debug);
    
    // Bind do método request para passar aos endpoints
    const boundRequest = this.request.bind(this);

    // Inicializa endpoints
    this.instance = createInstanceEndpoints(boundRequest);
    this.messages = createMessagesEndpoints(boundRequest);
    this.groups = createGroupsEndpoints(boundRequest);
    this.webhooks = createWebhooksEndpoints(boundRequest);

    this.logger.info('Client initialized', { baseUrl: this.config.baseUrl });
  }

  /**
   * Método central de requisição com retry e error handling
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: object
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.debugLog(`Request attempt ${attempt}`, { method, endpoint, body });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': this.config.token,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json().catch(() => ({}));

        // Handle error responses
        if (!response.ok) {
          const errorMessage = data.message || data.error || response.statusText;
          
          // Retry em erros 5xx ou 429 (rate limit)
          if ((response.status >= 500 || response.status === 429) && attempt < this.config.maxRetries) {
            const delay = this.calculateRetryDelay(attempt, response.status === 429);
            this.logger.warn(`Request failed, retrying in ${delay}ms`, {
              status: response.status,
              attempt,
            });
            await this.sleep(delay);
            continue;
          }

          throw new UazapiError(
            errorMessage,
            response.status,
            JSON.stringify(data),
            response
          );
        }

        this.logger.debugLog('Request successful', { endpoint, status: response.status });

        // Retorna no formato padrão da API
        return {
          code: response.status,
          data: data.data ?? data,
          success: true,
        };

      } catch (error) {
        lastError = error as Error;

        // Abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          this.logger.error('Request timeout', { endpoint, timeout: this.config.timeout });
          
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateRetryDelay(attempt, false);
            await this.sleep(delay);
            continue;
          }
          
          throw new UazapiError('Request timeout', 408, 'The request timed out');
        }

        // Network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          this.logger.error('Network error', { endpoint, error: error.message });
          
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateRetryDelay(attempt, false);
            await this.sleep(delay);
            continue;
          }
        }

        // Re-throw UazapiError
        if (error instanceof UazapiError) {
          throw error;
        }

        // Generic error
        throw new UazapiError(
          (error as Error).message || 'Unknown error',
          0,
          undefined
        );
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new UazapiError('All retry attempts failed', 0);
  }

  /**
   * Calcula delay para retry com exponential backoff
   */
  private calculateRetryDelay(attempt: number, isRateLimit: boolean): number {
    const baseDelay = isRateLimit ? this.config.retryDelay * 2 : this.config.retryDelay;
    const delay = baseDelay * Math.pow(2, attempt - 1);
    // Adiciona jitter de até 20%
    const jitter = delay * 0.2 * Math.random();
    return Math.min(delay + jitter, 30000); // Max 30 segundos
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== MÉTODOS DE CONVENIÊNCIA ====================

  /**
   * Verifica se está conectado e logado
   */
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.instance.getStatus();
      return status.data.Connected && status.data.LoggedIn;
    } catch {
      return false;
    }
  }

  /**
   * Aguarda conexão com polling
   */
  async waitForConnection(
    timeoutMs: number = 60000,
    pollIntervalMs: number = 2000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await this.isConnected()) {
        return true;
      }
      await this.sleep(pollIntervalMs);
    }
    
    return false;
  }

  /**
   * Conecta e retorna QR Code se necessário
   */
  async connectAndGetQR(): Promise<{ connected: boolean; qrCode?: string }> {
    // Verifica se já está conectado
    if (await this.isConnected()) {
      return { connected: true };
    }

    // Tenta conectar
    await this.instance.connect();

    // Verifica novamente
    if (await this.isConnected()) {
      return { connected: true };
    }

    // Obtém QR Code
    try {
      const qr = await this.instance.getQRCode();
      return { connected: false, qrCode: qr.data.QRCode };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Envia mensagem de texto simples (atalho)
   */
  async send(phone: string, message: string): Promise<ApiResponse<any>> {
    return this.messages.sendText({ phone, message });
  }

  /**
   * Indica "digitando..." antes de enviar mensagem
   */
  async sendWithTyping(
    phone: string,
    message: string,
    typingDurationMs: number = 2000
  ): Promise<ApiResponse<any>> {
    await this.messages.sendPresence({ phone, state: 'composing' });
    await this.sleep(typingDurationMs);
    await this.messages.sendPresence({ phone, state: 'paused' });
    return this.messages.sendText({ phone, message });
  }
}
