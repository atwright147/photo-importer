import { useQuery } from '@tanstack/react-query';
import { AllSystemInfo, type Disk, allSysInfo } from 'tauri-plugin-system-info-api';

const QUERY_KEY = ['disks', 'all'];

const getDisks = async (): Promise<Disk[]> => {
  console.info('getDisks', Math.random());
  try {
    return Promise.resolve(AllSystemInfo.parse(await allSysInfo()).disks);
  } catch (err) {
    console.info(err);
    return Promise.reject(err);
  }
};

export const useDisksQuery = () => {
  return useQuery<Disk[], Error>({ queryKey: QUERY_KEY, queryFn: getDisks, staleTime: 0, gcTime: 0 });
};
