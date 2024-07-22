import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'react';

export const useIsDngConverterAvailable = (): boolean => {
  const [isDngConverterAvailable, setIsDngConverterAvailable] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      setIsDngConverterAvailable(await invoke<boolean>('is_dng_converter_available'));
    })();
  }, []);

  return isDngConverterAvailable;
};
