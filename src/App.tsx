import { Button, Flex, Grid, Item, Picker, Provider, Text, View, defaultTheme } from '@adobe/react-spectrum';
import { invoke } from '@tauri-apps/api';
import type { FileEntry } from '@tauri-apps/api/fs';
import { useEffect, useMemo, useState } from 'react';
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
    if (!disk) return;

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
    <Provider theme={defaultTheme} minHeight="100vh">
      <Grid
        UNSAFE_style={{ padding: '16px', boxSizing: 'border-box' }}
        areas={['content sidebar', 'footer  footer']}
        columns={['1fr', '310px']}
        rows={['auto', 'min-content']}
        minHeight="100vh"
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
          <Flex alignItems="center" justifyContent="space-between">
            <View>
              <Text>Selected: n</Text>
            </View>
            <Flex gap="size-100">
              <Button variant="primary" type="button">
                Cancel
              </Button>
              <Button variant="cta" type="button">
                Import
              </Button>
            </Flex>
          </Flex>
        </View>
      </Grid>
    </Provider>
  );
}

export default App;
