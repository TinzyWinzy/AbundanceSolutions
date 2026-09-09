import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  bandwidthSaver: boolean;
  toggleBandwidthSaver: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      bandwidthSaver: false,
      toggleBandwidthSaver: () => set((state) => ({ bandwidthSaver: !state.bandwidthSaver }))
    }),
    { name: 'abundance-ui' }
  )
);
