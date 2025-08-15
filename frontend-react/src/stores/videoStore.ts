import { socket } from '@/lib/socket';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  createdAt: string;
}

interface Video {
  id: string;
  url: string; // This will be the CloudFront URL (built from backend's 'url' field which contains S3 key)
  key?: string; // S3 key (for reference, extracted from backend's 'url' field)
  title: string;
  description: string | null;
  userId: string;
  createdAt: string;
  user?: User;
}

interface VideoStore {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;

  // Videos
  videos: Video[];
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;

  // UI State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isRecordModalOpen: boolean;
  setRecordModalOpen: (open: boolean) => void;
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        try {
          localStorage.setItem('token', token);
        } catch { }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        try {
          localStorage.removeItem('token');
          socket.disconnect()
        } catch { }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          videos: [], // Clear videos on logout
          searchQuery: '' // Clear search query too
        });
      },

      // Videos
      videos: [],
      setVideos: (videos) => set({ videos }),
      addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),

      // UI State
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      isRecordModalOpen: false,
      setRecordModalOpen: (isRecordModalOpen) => set({ isRecordModalOpen }),
      isUploadModalOpen: false,
      setUploadModalOpen: (isUploadModalOpen) => set({ isUploadModalOpen }),
    }),
    {
      name: 'clippr-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);