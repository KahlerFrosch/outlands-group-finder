export const MAX_GROUP_CHAT_BODY_LENGTH = 2000;
/**
 * Max messages per group: API returns this many (newest), DB retains this many after each post,
 * and the client trims its live buffer to this size. One number keeps storage aligned with the UI.
 */
export const GROUP_CHAT_FETCH_LIMIT = 100;

export type GroupChatMessageDto = {
  id: string;
  groupId: string;
  discordId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

/** Pusher private channel for group members only; server must authorize subscriptions. */
export function groupChatChannelName(groupId: string): string {
  return `private-group-${groupId}`;
}
