# onboarding — Fluxo de Onboarding

Fluxo de configuração inicial para novos usuários em 3 passos.

## Estrutura

- `layout.tsx` — Layout customizado com progress bar e logo (sem sidebar)
- `connect/page.tsx` — Step 1: Conectar WhatsApp (form + QR code + polling)
- `groups/page.tsx` — Step 2: Sincronizar e selecionar grupos
- `done/page.tsx` — Step 3: Conclusão com resumo e links

## Fluxo

1. Após signup, usuário é redirecionado para `/onboarding/connect`
2. Step 1: Criar instância, gerar QR code, polling de status
3. Step 2: Sincronizar grupos e marcar quais monitorar
4. Step 3: Resumo e botão para dashboard

## Lógica de Redirect

Em `src/app/(auth)/auth/callback/route.ts`:
- Novos usuários (com `organization_name` em metadata) vão para onboarding
- Usuários existentes sem instâncias vão para onboarding
- Usuários com instâncias vão direto para dashboard

## Padrões

- Layout sem sidebar (diferente do dashboard)
- Progress bar visual (3 steps)
- Botão "Pular" em cada step
- Client components com estado local
- Polling de status a cada 5s no step de conexão
