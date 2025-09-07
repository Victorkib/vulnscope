export interface Comment {
  id: string;
  vulnerabilityId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  replies: string[]; // Array of comment IDs
  parentId?: string; // For nested replies
  isEdited: boolean;
  editHistory?: CommentEdit[];
}

export interface CommentEdit {
  editedAt: string;
  previousContent: string;
  reason?: string;
}

export interface CommentVote {
  id: string;
  commentId: string;
  userId: string;
  voteType: 'like' | 'dislike';
  createdAt: string;
}

export interface UserReputation {
  userId: string;
  totalScore: number;
  level: number;
  badges: UserBadge[];
  stats: {
    commentsCount: number;
    likesReceived: number;
    dislikesReceived: number;
    helpfulComments: number;
    expertComments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  category: 'participation' | 'expertise' | 'helpfulness' | 'leadership';
}

export interface CommentWithVotes extends Comment {
  userVote?: 'like' | 'dislike';
  userReputation: number;
  userLevel: number;
  userBadges: UserBadge[];
  replies?: CommentWithVotes[];
}

export interface CommunityStats {
  totalComments: number;
  totalVotes: number;
  activeUsers: number;
  topContributors: {
    userId: string;
    displayName: string;
    reputation: number;
    commentsCount: number;
  }[];
  recentActivity: {
    type: 'comment' | 'vote' | 'reply';
    userId: string;
    displayName: string;
    timestamp: string;
    data: Record<string, unknown>;
  }[];
}
