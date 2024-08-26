import type { Store } from 'tauri-plugin-store-api';

export const handleFieldChangeSave = async (
  value: string | number | boolean,
  name: string,
  onChangeFn: (value: string) => void,
  store: Store,
): Promise<void> => {
  onChangeFn(String(value));

  try {
    await store.set(name, value);
    await store.save();
  } catch (err) {
    console.info(err);
  }
};
