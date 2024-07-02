import { create } from 'zustand';

export interface State {
  selected: string[];
  setSelected: (id: string) => void;
  removeSelected: (id: string) => void;
  empty: () => void;
}

export const usePhotosStore = create<State>((set, get) => ({
  selected: [],
  setSelected: (id) => {
    set({ selected: [...get().selected, id] });
  },
  removeSelected: (id) => {
    set({ selected: get().selected.filter((item) => item !== id) });
  },
  empty: () => set({ selected: [] }),
}));
