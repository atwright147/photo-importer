import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'react';

export const useIsDev = (defaultValue: boolean): boolean => {
  const [isDev, setIsDev] = useState<boolean>(defaultValue);

  useEffect(() => {
    (async () => {
      setIsDev(await invoke<boolean>('is_dev'));
    })();
  }, []);

  return isDev;
};
