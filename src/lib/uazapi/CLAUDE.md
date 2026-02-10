# uazapi — Client UAZAPI (WhatsApp API)

Wrapper TypeScript para a API UAZAPI de automação WhatsApp.

## Arquivos

- `client.ts` — Client base com configuração de fetch (baseURL, token, headers)
- `types.ts` — Tipos TypeScript da API UAZAPI
- `index.ts` — Re-export do client configurado
- `endpoints/`
  - `groups.ts` — CRUD de grupos WhatsApp
  - `instance.ts` — Gerenciamento de instâncias (conectar, desconectar, QR code)
  - `messages.ts` — Envio de mensagens (texto, mídia, etc.)
  - `webhooks.ts` — Configuração de webhooks

## Uso

O client usa as variáveis:
- `UAZAPI_BASE_URL` — URL base da API
- `UAZAPI_TOKEN` — Token de autenticação

## Documentação UAZAPI

- Docs oficiais: https://doc.uazapi.com/
- API REST, autenticação via Bearer token
- Instâncias representam conexões WhatsApp individuais
