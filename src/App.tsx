import { Grid, Heading, Item, Picker, Provider, Text, View, defaultTheme } from '@adobe/react-spectrum';
import { invoke } from '@tauri-apps/api';
import type { FileEntry } from '@tauri-apps/api/fs';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { AllSystemInfo, allSysInfo } from 'tauri-plugin-system-info-api';
import type { Disk } from 'tauri-plugin-system-info-api';
import { SlideList } from './components/SlideList/SlideList';
import type { FileInfo } from './types/File';

import './App.css';
import { OptionsForm } from './components/OptionsForm/OptionsForm';
import { Fieldset } from './components/form/Fieldset/Fieldset';

function App() {
  const [disk, setDisk] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [removableDisks, setRemovableDisks] = useState<Disk[]>([]);
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([]);

  const options = useMemo(() => removableDisks.map((disk) => ({ id: disk.mount_point, name: disk.name })), [removableDisks]);

  useEffect(() => {
    (async () => {
      const disks = await getRemovableDisks();
      const removableDisks = disks; //.filter((disk) => disk.is_removable);
      setRemovableDisks(removableDisks);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const promises: Promise<string>[] = [];
      for (const file of files) {
        promises.push(invoke<string>('extract_thumbnail', { path: file.path }));
      }
      const results = await Promise.allSettled(promises);

      console.info('results', results);

      setExtractedThumbnails(results.map((result) => (result.status === 'fulfilled' ? result.value : '')));
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
    <Provider theme={defaultTheme} height="100%">
      <View padding="size-200" height="100%">
        <Grid
          areas={['content sidebar', 'footer  footer']}
          columns={['3fr', '1fr']}
          rows={['auto', 'min-content']}
          height="100%"
          gap="size-300"
        >
          <View gridArea="content">
            <form
              className="row"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <Fieldset>
                <legend>Drive</legend>
                <Picker
                  label="Source Disk"
                  name="sourceDisk"
                  items={options}
                  onSelectionChange={(value) => setDisk(String(value))}
                  onFocus={handleFocus}
                  isRequired
                  width="100%"
                >
                  {(item) => <Item>{item.name}</Item>}
                </Picker>
              </Fieldset>
            </form>
            <SlideList files={files} extractedThumbnails={extractedThumbnails} />
            <details>
              <summary>Debug</summary>
              <pre>{JSON.stringify({ disk, removableDisks, options, files, extractedThumbnails }, null, 2)}</pre>
            </details>
          </View>
          <View gridArea="sidebar" elementType="aside" padding="5px">
            <OptionsForm />
          </View>
          <View gridArea="footer" elementType="footer">
            <Text>Selected: n</Text>
          </View>
        </Grid>
      </View>
    </Provider>
  );
}

export default App;
