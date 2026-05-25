import { request } from './api.js';

export const sendChatMessage = (message, sessionId = null) =>
  request('POST', '/ai/chat', { message, session_id: sessionId });

export const getChatHistory = (sessionId) =>
  request('GET', '/ai/history', null, { session_id: sessionId });
