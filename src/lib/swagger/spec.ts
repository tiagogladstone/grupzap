import type { OpenAPIV3 } from './types'

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Grupzap API',
    description: 'API interna do Grupzap — SaaS de gestão de grupos WhatsApp.',
    version: '1.0.0',
    contact: {
      name: 'Grupzap',
      url: 'https://grupzap.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticação e onboarding' },
    { name: 'Instances', description: 'Gestão de instâncias WhatsApp' },
    { name: 'Groups', description: 'Gestão de grupos' },
    { name: 'Messages', description: 'Agendamento de mensagens' },
    { name: 'Templates', description: 'Templates de mensagem' },
    { name: 'Webhooks', description: 'Recepção de eventos externos' },
    { name: 'Billing', description: 'Cobrança e assinaturas' },
    { name: 'Cron', description: 'Processamento agendado' },
  ],
  paths: {
    '/instances': {
      get: {
        tags: ['Instances'],
        summary: 'Listar instâncias',
        description: 'Retorna todas as instâncias WhatsApp da organização do usuário.',
        responses: {
          '200': {
            description: 'Lista de instâncias',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/WhatsAppInstance' } } } } } },
          },
          '401': { description: 'Não autenticado' },
        },
      },
      post: {
        tags: ['Instances'],
        summary: 'Criar instância',
        description: 'Cria uma nova instância WhatsApp. Verifica limite do plano.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['instanceName', 'instanceId', 'apiToken'],
                properties: {
                  instanceName: { type: 'string', description: 'Nome da instância' },
                  instanceId: { type: 'string', description: 'ID da instância na UAZAPI' },
                  apiToken: { type: 'string', description: 'Token da API da instância' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Instância criada' },
          '400': { description: 'Dados inválidos' },
          '403': { description: 'Limite de instâncias atingido' },
        },
      },
    },
    '/instances/{id}': {
      get: { tags: ['Instances'], summary: 'Detalhe da instância', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Instância encontrada' }, '404': { description: 'Não encontrada' } } },
      patch: { tags: ['Instances'], summary: 'Atualizar instância', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Atualizada' } } },
      delete: { tags: ['Instances'], summary: 'Remover instância', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Removida' } } },
    },
    '/instances/{id}/connect': {
      post: { tags: ['Instances'], summary: 'Conectar instância', description: 'Inicia conexão e retorna QR code se necessário.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Status de conexão com QR code' } } },
    },
    '/instances/{id}/status': {
      get: { tags: ['Instances'], summary: 'Status da instância', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Status atual' } } },
    },
    '/groups': {
      get: {
        tags: ['Groups'],
        summary: 'Listar grupos',
        parameters: [
          { name: 'instance_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por instância' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por nome' },
        ],
        responses: { '200': { description: 'Lista de grupos' } },
      },
    },
    '/groups/sync': {
      post: { tags: ['Groups'], summary: 'Sincronizar grupos', description: 'Sincroniza grupos de uma instância UAZAPI com o banco local.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['instanceId'], properties: { instanceId: { type: 'string', format: 'uuid' } } } } } }, responses: { '200': { description: 'Resultado da sincronização' } } },
    },
    '/groups/{id}': {
      get: { tags: ['Groups'], summary: 'Detalhe do grupo', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Grupo encontrado' } } },
      patch: { tags: ['Groups'], summary: 'Atualizar grupo', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Atualizado' } } },
    },
    '/groups/{id}/members': {
      get: { tags: ['Groups'], summary: 'Membros do grupo', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Lista de membros' } } },
    },
    '/messages': {
      get: { tags: ['Messages'], summary: 'Listar mensagens agendadas', parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'sent', 'failed', 'cancelled'] } }, { name: 'instance_id', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Lista de mensagens' } } },
      post: { tags: ['Messages'], summary: 'Agendar mensagem', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['instanceId', 'targetJid', 'targetType', 'messageType', 'scheduledFor'], properties: { instanceId: { type: 'string' }, targetJid: { type: 'string' }, targetType: { type: 'string', enum: ['group', 'individual'] }, messageType: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'document'] }, content: { type: 'string' }, scheduledFor: { type: 'string', format: 'date-time' }, recurrence: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly'] } } } } } }, responses: { '201': { description: 'Mensagem agendada' } } },
    },
    '/messages/{id}': {
      get: { tags: ['Messages'], summary: 'Detalhe da mensagem', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Mensagem encontrada' } } },
      patch: { tags: ['Messages'], summary: 'Editar mensagem', description: 'Apenas mensagens pendentes podem ser editadas.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Atualizada' }, '400': { description: 'Mensagem não está pendente' } } },
      delete: { tags: ['Messages'], summary: 'Cancelar mensagem', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Cancelada' } } },
    },
    '/templates': {
      get: { tags: ['Templates'], summary: 'Listar templates', parameters: [{ name: 'category', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Lista de templates' } } },
      post: { tags: ['Templates'], summary: 'Criar template', responses: { '201': { description: 'Template criado' } } },
    },
    '/templates/{id}': {
      get: { tags: ['Templates'], summary: 'Detalhe do template', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Template encontrado' } } },
      patch: { tags: ['Templates'], summary: 'Atualizar template', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Atualizado' } } },
      delete: { tags: ['Templates'], summary: 'Remover template', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Removido' } } },
    },
    '/webhooks/uazapi': {
      post: { tags: ['Webhooks'], summary: 'Receber evento UAZAPI', description: 'Endpoint que recebe webhooks da UAZAPI. Autenticado via HMAC SHA256.', responses: { '200': { description: 'Evento recebido' } } },
    },
    '/webhooks/stripe': {
      post: { tags: ['Webhooks'], summary: 'Receber evento Stripe', description: 'Endpoint que recebe webhooks do Stripe (a implementar).', responses: { '200': { description: 'Evento recebido' } } },
    },
    '/cron/process-messages': {
      get: { tags: ['Cron'], summary: 'Processar mensagens agendadas', description: 'Chamado pelo Cloud Scheduler a cada minuto. Autenticado via CRON_SECRET.', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Resultado do processamento' }, '401': { description: 'Não autorizado' } } },
    },
  },
  components: {
    schemas: {
      WhatsAppInstance: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          instance_name: { type: 'string' },
          instance_id: { type: 'string' },
          phone_number: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['connected', 'disconnected', 'connecting', 'qr_code', 'banned', 'error'] },
          health_status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy', 'unknown'] },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      WhatsAppGroup: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          group_jid: { type: 'string' },
          participant_count: { type: 'integer' },
          health_score: { type: 'integer', minimum: 0, maximum: 100 },
          activity_level: { type: 'string', enum: ['high', 'normal', 'low', 'inactive'] },
          is_monitored: { type: 'boolean' },
        },
      },
      ScheduledMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          target_jid: { type: 'string' },
          message_type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact'] },
          content: { type: 'string', nullable: true },
          scheduled_for: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Token de autenticação (CRON_SECRET para endpoints de cron)',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Session cookie do Supabase Auth',
      },
    },
  },
}
