import { create } from 'zustand';

import type { ExtractedThumbnails } from '../types/ExtractedThumbnail';

export interface State {
  selected: ExtractedThumbnails[];
  extractedThumbnails: ExtractedThumbnails[];

  isSelected: (id: string) => boolean;
  setSelected: (items: ExtractedThumbnails | ExtractedThumbnails[]) => void;
  removeSelected: (ids: string | string[]) => void;
  setSelectedAll: () => void;
  setSelectNone: () => void;
  setExtractedThumbnails: (thumbnails: ExtractedThumbnails[]) => void;
}

export const usePhotosStore = create<State>()((set, get) => ({
  selected: [],
  extractedThumbnails: [],

  isSelected: (id) => get().selected.some((item) => item.hash === id),
  setSelected: (items) => {
    if (Array.isArray(items)) {
      set({ selected: [...get().selected, ...items] });
      return;
    }
    set({ selected: [...get().selected, items] });
  },
  removeSelected: (ids) => {
    if (Array.isArray(ids)) {
      set({ selected: get().selected.filter((item) => !ids.includes(item.hash)) });
      return;
    }
    set({ selected: get().selected.filter((item) => item.hash !== ids) });
  },
  setSelectedAll: () => {
    set({ selected: get().extractedThumbnails });
  },
  setSelectNone: () => set({ selected: [] }),
  setExtractedThumbnails: (thumbnails) => set({ extractedThumbnails: thumbnails }),
}));
