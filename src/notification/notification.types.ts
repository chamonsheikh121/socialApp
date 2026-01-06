/**
 * Notification Event Types
 */
export enum NotificationEventType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  POST_SHARED = 'POST_SHARED',
  PAGE_INVITATION = 'PAGE_INVITATION',
  PAGE_FOLLOW = 'PAGE_FOLLOW',
  MESSAGE = 'MESSAGE',
  BOOKMARK = 'BOOKMARK',
  CUSTOM = 'CUSTOM',
}

/**
 * Notification Payload Interface
 */
export interface NotificationPayload {
  id?: string;
  type: NotificationEventType;
  message: string;
  userId: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  data?: Record<string, any>;
  createdAt?: Date;
  isRead?: boolean;
}

/**
 * WebSocket Notification Event
 */
export interface WebSocketNotificationEvent {
  event: string;
  payload: NotificationPayload;
  timestamp: Date;
}
