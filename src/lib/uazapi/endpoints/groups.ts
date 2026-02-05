/**
 * UAZAPI Groups Endpoints
 * Gerenciamento de grupos WhatsApp
 */

import type {
  ApiResponse,
  Group,
  GroupListResponse,
  CreateGroupParams,
  CreateGroupResponse,
  ModifyParticipantParams,
  InviteLinkResponse,
  DisappearingDuration,
} from '../types';

/** Resposta genérica para operações de grupo */
interface GroupOperationResponse {
  success?: boolean;
  message?: string;
}

export interface GroupsEndpoints {
  /**
   * Lista todos os grupos que a instância participa.
   */
  list(): Promise<ApiResponse<GroupListResponse>>;

  /**
   * Obtém informações detalhadas de um grupo.
   */
  getInfo(groupJid: string): Promise<ApiResponse<Group>>;

  /**
   * Cria um novo grupo.
   */
  create(params: CreateGroupParams): Promise<ApiResponse<CreateGroupResponse>>;

  /**
   * Modifica um participante do grupo (add/remove/promote/demote).
   */
  modifyParticipant(params: ModifyParticipantParams): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Adiciona participante ao grupo.
   */
  addParticipant(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Remove participante do grupo.
   */
  removeParticipant(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Promove participante a admin.
   */
  promoteToAdmin(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Rebaixa participante de admin.
   */
  demoteFromAdmin(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Obtém link de convite do grupo.
   */
  getInviteLink(groupJid: string): Promise<ApiResponse<InviteLinkResponse>>;

  /**
   * Altera o nome do grupo.
   */
  setName(groupJid: string, name: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Altera a descrição/tópico do grupo.
   */
  setDescription(groupJid: string, description: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Altera a foto do grupo (JPEG base64).
   */
  setPhoto(groupJid: string, imageBase64: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Remove a foto do grupo.
   */
  removePhoto(groupJid: string): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Configura se apenas admins podem editar info do grupo.
   */
  setLocked(groupJid: string, locked: boolean): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Configura mensagens temporárias.
   */
  setDisappearingMessages(groupJid: string, duration: DisappearingDuration): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Configura modo de anúncio (apenas admins enviam mensagens).
   */
  setAnnounce(groupJid: string, announce: boolean): Promise<ApiResponse<GroupOperationResponse>>;

  /**
   * Sai do grupo.
   */
  leave(groupJid: string): Promise<ApiResponse<GroupOperationResponse>>;
}

type RequestFn = <T>(method: string, endpoint: string, body?: object) => Promise<ApiResponse<T>>;

/**
 * Converte número de telefone para JID do WhatsApp
 */
function toJid(phone: string): string {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  // Se já é JID, retorna como está
  if (phone.includes('@s.whatsapp.net')) return phone;
  return `${cleanPhone}@s.whatsapp.net`;
}

export function createGroupsEndpoints(request: RequestFn): GroupsEndpoints {
  return {
    async list(): Promise<ApiResponse<GroupListResponse>> {
      return request<GroupListResponse>('GET', '/group/list');
    },

    async getInfo(groupJid: string): Promise<ApiResponse<Group>> {
      return request<Group>('GET', '/group/info', { GroupJID: groupJid });
    },

    async create(params: CreateGroupParams): Promise<ApiResponse<CreateGroupResponse>> {
      return request<CreateGroupResponse>('POST', '/group/create', {
        name: params.name,
        participants: params.participants,
      });
    },

    async modifyParticipant(params: ModifyParticipantParams): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/grupo/modificar', {
        GroupJID: params.groupJid,
        action: params.action,
        remoteJid: params.participantJid,
      });
    },

    async addParticipant(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>> {
      return this.modifyParticipant({
        groupJid,
        action: 'add',
        participantJid: toJid(phone),
      });
    },

    async removeParticipant(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>> {
      return this.modifyParticipant({
        groupJid,
        action: 'remove',
        participantJid: toJid(phone),
      });
    },

    async promoteToAdmin(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>> {
      return this.modifyParticipant({
        groupJid,
        action: 'promote',
        participantJid: toJid(phone),
      });
    },

    async demoteFromAdmin(groupJid: string, phone: string): Promise<ApiResponse<GroupOperationResponse>> {
      return this.modifyParticipant({
        groupJid,
        action: 'demote',
        participantJid: toJid(phone),
      });
    },

    async getInviteLink(groupJid: string): Promise<ApiResponse<InviteLinkResponse>> {
      return request<InviteLinkResponse>('GET', '/group/invitelink', { GroupJID: groupJid });
    },

    async setName(groupJid: string, name: string): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/name', {
        GroupJID: groupJid,
        Name: name,
      });
    },

    async setDescription(groupJid: string, description: string): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/description', {
        GroupJID: groupJid,
        Description: description,
      });
    },

    async setPhoto(groupJid: string, imageBase64: string): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/photo', {
        GroupJID: groupJid,
        Image: imageBase64,
      });
    },

    async removePhoto(groupJid: string): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/photo/remove', {
        groupjid: groupJid,
      });
    },

    async setLocked(groupJid: string, locked: boolean): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/locked', {
        groupjid: groupJid,
        locked,
      });
    },

    async setDisappearingMessages(
      groupJid: string,
      duration: DisappearingDuration
    ): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/ephemeral', {
        groupjid: groupJid,
        duration,
      });
    },

    async setAnnounce(groupJid: string, announce: boolean): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/announce', {
        groupjid: groupJid,
        announce,
      });
    },

    async leave(groupJid: string): Promise<ApiResponse<GroupOperationResponse>> {
      return request<GroupOperationResponse>('POST', '/group/leave', {
        GroupJID: groupJid,
      });
    },
  };
}
