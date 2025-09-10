export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  settings: TeamSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  invitedBy: string;
  status: 'active' | 'pending' | 'suspended';
  invitationToken?: string; // Secure token for invitation validation
  invitationExpiresAt?: string; // When the invitation expires
}

export interface TeamSettings {
  allowMemberInvites: boolean;
  requireApprovalForJoins: boolean;
  allowPublicDiscussions: boolean;
  defaultMemberRole: 'member' | 'viewer';
  notificationSettings: {
    newMembers: boolean;
    newDiscussions: boolean;
    vulnerabilityUpdates: boolean;
  };
}

export interface Discussion {
  id: string;
  teamId?: string;
  vulnerabilityId: string;
  title: string;
  description?: string;
  authorId: string;
  authorEmail: string;
  authorDisplayName: string;
  isPublic: boolean;
  isPinned: boolean;
  tags: string[];
  status: 'open' | 'closed' | 'resolved';
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  participantCount: number;
  messageCount: number;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  authorId: string;
  authorEmail: string;
  authorDisplayName: string;
  content: string;
  isEdited: boolean;
  editHistory?: MessageEdit[];
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  parentMessageId?: string; // For replies
  createdAt: string;
  updatedAt: string;
}

export interface MessageEdit {
  editedAt: string;
  previousContent: string;
  reason?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userDisplayName: string;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface SharedVulnerability {
  id: string;
  vulnerabilityId: string;
  sharedBy: string;
  sharedWith: string; // User ID or team ID
  shareType: 'user' | 'team';
  message?: string;
  permissions: {
    canView: boolean;
    canComment: boolean;
    canEdit: boolean;
    canShare: boolean;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface CollaborationStats {
  teamCount: number;
  totalMembers: number;
  activeDiscussions: number;
  sharedVulnerabilities: number;
  recentActivity: {
    type: 'discussion' | 'share' | 'invitation' | 'message';
    userId: string;
    displayName: string;
    timestamp: string;
    data: Record<string, unknown>;
  }[];
}
