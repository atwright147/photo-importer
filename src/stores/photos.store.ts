import { create } from 'zustand';

import type { ExtractedThumbnails } from '../types/ExtractedThumbnail';

export interface State {
  selected: string[];
  extractedThumbnails: ExtractedThumbnails[];

  isSelected: (id: string) => boolean;
  setSelected: (ids: string | string[]) => void;
  removeSelected: (ids: string | string[]) => void;
  setSelectedAll: () => void;
  setSelectNone: () => void;
  setExtractedThumbnails: (thumbnails: ExtractedThumbnails[]) => void;
}

export const usePhotosStore = create<State>()((set, get) => ({
  selected: [],
  extractedThumbnails: [],

  isSelected: (id) => get().selected.includes(id),
  setSelected: (ids) => {
    if (Array.isArray(ids)) {
      set({ selected: [...get().selected, ...ids] });
      return;
    }
    set({ selected: [...get().selected, ids] });
  },
  removeSelected: (ids) => {
    if (Array.isArray(ids)) {
      set({ selected: get().selected.filter((item) => !ids.includes(item)) });
      return;
    }
    set({ selected: get().selected.filter((item) => item !== ids) });
  },
  setSelectedAll: () => {
    set({ selected: get().extractedThumbnails.map((item) => item.hash) });
  },
  setSelectNone: () => set({ selected: [] }),
  setExtractedThumbnails: (thumbnails) => set({ extractedThumbnails: thumbnails }),
}));
