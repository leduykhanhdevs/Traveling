import type { CommunityFilters, CommunityReview } from '@wanderai/shared';
import { AppError } from '../utils/errors.js';
import { prisma } from './prisma.service.js';

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

export type CreateReviewInput = {
  userId: string;
  placeId: string;
  rating: number;
  text: string;
  photos: readonly string[];
  tags: readonly string[];
  nationality: string;
};

export type CreatePostInput = {
  clerkUserId: string;
  content: string;
  imageUrl?: string;
  placeId?: string;
};

export type CreateCommentInput = {
  clerkUserId: string;
  postId: string;
  content: string;
};

const authorNameFromEmail = (email: string): string => email.split('@')[0] ?? 'Traveler';

const authorInitials = (name: string): string => {
  const letters = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter((letter): letter is string => Boolean(letter));

  return letters.join('') || 'T';
};

const userByClerkId = async (clerkUserId: string): Promise<{ id: string; email: string }> => {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError(
      'USER_NOT_FOUND',
      'Create a WanderAI profile before using community features.',
      404,
    );
  }

  return user;
};

const toCommunityPost = (
  post: {
    id: string;
    userId: string;
    content: string;
    imageUrl: string | null;
    placeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      email: string;
    };
    _count: {
      comments: number;
      likes: number;
    };
    likes?: readonly { userId: string }[];
  },
  viewerUserId: string,
): CommunityPost => {
  const name = authorNameFromEmail(post.user.email);

  return {
    id: post.id,
    userId: post.userId,
    author: {
      id: post.userId,
      name,
      initials: authorInitials(name),
    },
    content: post.content,
    imageUrl: post.imageUrl ?? undefined,
    placeId: post.placeId ?? undefined,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: (post.likes ?? []).some((like) => like.userId === viewerUserId),
  };
};

const toCommunityComment = (comment: {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    email: string;
  };
}): CommunityComment => {
  const name = authorNameFromEmail(comment.user.email);

  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    author: {
      id: comment.userId,
      name,
      initials: authorInitials(name),
    },
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
};

export const listCommunityReviews = async (
  filters: CommunityFilters,
): Promise<readonly CommunityReview[]> => {
  const reviews = await prisma.review.findMany({
    where: {
      nationality: filters.nationality,
      tags: filters.foodCategory ? { has: filters.foodCategory } : undefined,
      placeId: filters.city ? { contains: filters.city, mode: 'insensitive' } : undefined,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return reviews.map((review) => ({
    id: review.id,
    placeId: review.placeId,
    userId: review.userId,
    userName: review.user.email.split('@')[0] ?? 'Traveler',
    nationality: review.nationality,
    rating: review.rating,
    text: review.text,
    photos: review.photos,
    tags: review.tags,
    createdAt: review.createdAt.toISOString(),
  }));
};

export const createCommunityReview = async (input: CreateReviewInput): Promise<CommunityReview> => {
  const user = await prisma.user.findUnique({
    where: { clerkId: input.userId },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Create a WanderAI profile before posting a review.', 404);
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      placeId: input.placeId,
      rating: input.rating,
      text: input.text,
      photos: [...input.photos],
      tags: [...input.tags],
      nationality: input.nationality,
    },
  });

  return {
    id: review.id,
    placeId: review.placeId,
    userId: review.userId,
    userName: user.email.split('@')[0] ?? 'Traveler',
    nationality: review.nationality,
    rating: review.rating,
    text: review.text,
    photos: review.photos,
    tags: review.tags,
    createdAt: review.createdAt.toISOString(),
  };
};

export const followTraveler = async (
  followerClerkId: string,
  followingUserId: string,
): Promise<{ followed: true }> => {
  const follower = await prisma.user.findUnique({
    where: { clerkId: followerClerkId },
  });

  if (!follower) {
    throw new AppError(
      'USER_NOT_FOUND',
      'Create a WanderAI profile before following travelers.',
      404,
    );
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: follower.id,
        followingId: followingUserId,
      },
    },
    update: {},
    create: {
      followerId: follower.id,
      followingId: followingUserId,
    },
  });

  return { followed: true };
};

export const createCommunityPost = async (input: CreatePostInput): Promise<CommunityPost> => {
  const user = await userByClerkId(input.clerkUserId);
  const post = await prisma.post.create({
    data: {
      userId: user.id,
      content: input.content,
      imageUrl: input.imageUrl,
      placeId: input.placeId,
    },
    include: {
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
      likes: {
        where: {
          userId: user.id,
        },
        select: {
          userId: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return toCommunityPost(post, user.id);
};

export const listPostComments = async (postId: string): Promise<readonly CommunityComment[]> => {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return comments.map(toCommunityComment);
};

export const addPostComment = async (input: CreateCommentInput): Promise<CommunityComment> => {
  const user = await userByClerkId(input.clerkUserId);
  const post = await prisma.post.findUnique({
    where: {
      id: input.postId,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    throw new AppError('POST_NOT_FOUND', 'Community post was not found.', 404);
  }

  const comment = await prisma.comment.create({
    data: {
      postId: input.postId,
      userId: user.id,
      content: input.content,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return toCommunityComment(comment);
};

export const togglePostLike = async (
  clerkUserId: string,
  postId: string,
): Promise<{ liked: boolean; count: number }> => {
  const user = await userByClerkId(clerkUserId);
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    throw new AppError('POST_NOT_FOUND', 'Community post was not found.', 404);
  }

  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });
  } else {
    await prisma.like.create({
      data: {
        postId,
        userId: user.id,
      },
    });
  }

  const count = await prisma.like.count({
    where: {
      postId,
    },
  });

  return {
    liked: !existing,
    count,
  };
};
