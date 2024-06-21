import type { FileEntry } from '@tauri-apps/api/fs';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { AllSystemInfo, allSysInfo } from 'tauri-plugin-system-info-api';
import type { Disk } from 'tauri-plugin-system-info-api';

import './App.css';
import { invoke } from '@tauri-apps/api';

type FileInfo = {
  path: string;
  is_file: boolean;
  size?: number;
};

function App() {
  const [disk, setDisk] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [removableDisks, setRemovableDisks] = useState<Disk[]>([]);
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([]);

  const options = useMemo(() => removableDisks.map((disk) => ({ value: disk.mount_point, label: disk.name })), [removableDisks]);

  useEffect(() => {
    (async () => {
      const disks = await getRemovableDisks();
      const removableDisks = disks; //.filter((disk) => disk.is_removable);
      setRemovableDisks(removableDisks);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const promises: Promise<void>[] = [];
      for (const file of files) {
        promises.push(invoke('extract_thumbnail', { path: file.path }));
      }
      const results = await Promise.allSettled(promises);

      console.info(results);

      // setExtractedThumbnails(results.map((result) => result.status === 'fulfilled' ? result.value : ''));
    })();
  }, [files]);

  useEffect(() => {
    (async () => {
      try {
        const result: FileInfo[] = await invoke('list_files', { drivePath: disk });
        setFiles(result);
      } catch (error) {
        console.error('Error listing files:', error);
      }
    })();
  }, [disk]);

  const getRemovableDisks = async (): Promise<Disk[]> => {
    try {
      return AllSystemInfo.parse(await allSysInfo()).disks;
    } catch (err) {
      console.info(err);
      return Promise.reject([]);
    }
  };

  const handleFocus = async () => {
    const disks = await getRemovableDisks();
    const removableDisks = disks; //.filter((disk) => disk.is_removable);
    // const removableDisks = disks;
    setRemovableDisks(removableDisks);
  };

  return (
    <div className="container">
      <h1>Photo Importer</h1>

      <button type="button" onClick={async () => await getRemovableDisks()}>
        Get Disks
      </button>

      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Select
          name="disks"
          id="disks"
          onFocus={() => {
            handleFocus();
          }}
          onChange={(newValue) => {
            setDisk(newValue?.value);
          }}
          options={options}
        />
      </form>

      <ul>
        {files.map((file) => (
          <li key={file.path}>
            <div>{file.path}</div>
          </li>
        ))}
      </ul>

      <details>
        <summary>Debug</summary>
        <pre>{JSON.stringify({ disk, removableDisks, options, files }, null, 2)}</pre>
      </details>
    </div>
  );
}

export default App;
