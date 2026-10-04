import { create } from 'zustand';
import { getReleaseStatus, markReleaseAsViewed } from '../services/api';
import { APP_VERSION } from '../config/appMeta';
import { RELEASE_NOTES, ReleaseNote } from '../data/releaseNotes';

export interface ReleaseStore {
  isOpen: boolean;
  hasUnseenRelease: boolean;
  latestSeenVersion: string | null;
  selectedRelease: ReleaseNote | null;
  allReleases: ReleaseNote[];

  openReleaseNotes: (release?: ReleaseNote) => void;
  closeReleaseNotes: () => void;
  checkReleaseStatus: (token: string) => Promise<void>;
  markCurrentAsViewed: (token: string) => Promise<void>;
}

export const useReleaseStore = create<ReleaseStore>((set) => ({
  isOpen: false,
  hasUnseenRelease: false,
  latestSeenVersion: null,
  selectedRelease: null,
  allReleases: RELEASE_NOTES,

  openReleaseNotes: (release) => {
    set({
      isOpen: true,
      selectedRelease: release || RELEASE_NOTES[0] || null,
    });
  },

  closeReleaseNotes: () => {
    set({ isOpen: false });
  },

  checkReleaseStatus: async (token: string) => {
    if (!token) return;
    try {
      const status = await getReleaseStatus(APP_VERSION, token);
      const hasUnseen = !status?.hasSeenCurrentVersion;

      set({
        hasUnseenRelease: hasUnseen,
        latestSeenVersion: status?.latestSeenVersion ?? null,
        isOpen: hasUnseen,
        selectedRelease: RELEASE_NOTES[0] || null,
      });
    } catch (err) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
        console.error('Falha ao verificar status de releases:', err);
      }
    }
  },

  markCurrentAsViewed: async (token: string) => {
    set({ hasUnseenRelease: false, isOpen: false });
    if (!token) return;
    try {
      await markReleaseAsViewed(APP_VERSION, token);
      set({ latestSeenVersion: APP_VERSION });
    } catch (err) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
        console.error('Falha ao marcar release como visualizada:', err);
      }
    }
  },
}));
