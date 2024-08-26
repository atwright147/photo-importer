import { create } from 'zustand';

interface Dialog {
  name: string;
  open: boolean;
}

export interface State {
  dialogs: Dialog[];
  addDialog: (name: string, open?: boolean) => void;
  setDialog: (name: string, open: boolean) => void;
  getDialog: (name: string) => Dialog | undefined;
  hasDialog: (name: string) => boolean;
  removeDialog: (name: string) => void;
  toggleDialog: (name: string) => void;
}

export const useDialogsStore = create<State>()((set, get) => ({
  dialogs: [],
  addDialog: (name: string, open = false) => {
    if (get().hasDialog(name)) {
      console.error(`Dialog with name ${name} already exists`);
    }

    set((state) => ({
      dialogs: [...state.dialogs, { name, open }],
    }));
  },
  setDialog: (name: string, open: boolean) => {
    set((state) => ({
      dialogs: state.dialogs.map((dialog) => {
        if (dialog.name === name) {
          return { ...dialog, open };
        }
        return dialog;
      }),
    }));
  },
  getDialog: (name: string) => {
    return get().dialogs.find((dialog) => dialog.name === name);
  },
  hasDialog: (name: string) => {
    return get().dialogs.some((dialog) => dialog.name === name);
  },
  removeDialog: (name: string) => {
    set((state) => ({
      dialogs: state.dialogs.filter((dialog) => dialog.name !== name),
    }));
  },
  toggleDialog: (name: string) => {
    if (!get().hasDialog(name)) {
      get().addDialog(name);
    }

    get().setDialog(name, !get().getDialog(name)?.open);
  },
}));
