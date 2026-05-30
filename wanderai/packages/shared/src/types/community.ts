export type CommunityReview = {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  nationality: string;
  rating: number;
  text: string;
  photos: readonly string[];
  tags: readonly string[];
  createdAt: string;
};

export type CommunityFilters = {
  nationality?: string;
  foodCategory?: string;
  city?: string;
};

export type CommunityAuthor = {
  id: string;
  name: string;
  initials: string;
};

export type CommunityPost = {
  id: string;
  userId: string;
  author: CommunityAuthor;
  content: string;
  imageUrl?: string;
  placeId?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type CommunityComment = {
  id: string;
  postId: string;
  userId: string;
  author: CommunityAuthor;
  content: string;
  createdAt: string;
};

export type CreateCommunityPostRequest = {
  content: string;
  imageUrl?: string;
  placeId?: string;
};

export type CreateCommunityCommentRequest = {
  content: string;
};

export type ToggleCommunityLikeResponse = {
  liked: boolean;
  count: number;
};
