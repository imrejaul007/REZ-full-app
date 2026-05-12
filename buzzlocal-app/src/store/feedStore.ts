import { create } from 'zustand';
import { Post, FeedItem, AICard } from '@/types';

interface FeedState {
  feed: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  page: number;

  // Actions
  setFeed: (feed: FeedItem[]) => void;
  appendFeed: (items: FeedItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;

  // Post actions
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  incrementComment: (postId: string) => void;
  addPost: (post: Post) => void;

  // AI Card
  addAICard: (card: AICard) => void;
  removeAICard: (cardId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feed: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  page: 1,

  setFeed: (feed) => set({ feed }),

  appendFeed: (items) =>
    set((state) => ({
      feed: [...state.feed, ...items],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  setHasMore: (hasMore) => set({ hasMore }),

  setPage: (page) => set({ page }),

  likePost: (postId) =>
    set((state) => ({
      feed: state.feed.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                likes: post.likes + 1,
                isLiked: true,
              },
            };
          }
        }
        return item;
      }),
    })),

  unlikePost: (postId) =>
    set((state) => ({
      feed: state.feed.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                likes: Math.max(0, post.likes - 1),
                isLiked: false,
              },
            };
          }
        }
        return item;
      }),
    })),

  savePost: (postId) =>
    set((state) => ({
      feed: state.feed.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                saves: post.saves + 1,
                isSaved: true,
              },
            };
          }
        }
        return item;
      }),
    })),

  unsavePost: (postId) =>
    set((state) => ({
      feed: state.feed.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                saves: Math.max(0, post.saves - 1),
                isSaved: false,
              },
            };
          }
        }
        return item;
      }),
    })),

  incrementComment: (postId) =>
    set((state) => ({
      feed: state.feed.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                comments: post.comments + 1,
              },
            };
          }
        }
        return item;
      }),
    })),

  addPost: (post) =>
    set((state) => ({
      feed: [
        { type: 'post', data: post, timestamp: new Date().toISOString() },
        ...state.feed,
      ],
    })),

  addAICard: (card) =>
    set((state) => ({
      feed: [
        ...state.feed,
        { type: 'ai_card', data: card, timestamp: new Date().toISOString() },
      ],
    })),

  removeAICard: (cardId) =>
    set((state) => ({
      feed: state.feed.filter(
        (item) => item.type !== 'ai_card' || (item.data as AICard).id !== cardId
      ),
    })),
}));
