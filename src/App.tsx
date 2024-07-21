import { Button, Flex, Grid, Item, Picker, Provider, Text, View, defaultTheme } from '@adobe/react-spectrum';
import { invoke, process } from '@tauri-apps/api';
import type { FileEntry } from '@tauri-apps/api/fs';
import { appDataDir, pictureDir } from '@tauri-apps/api/path';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Store } from 'tauri-plugin-store-api';
import type { Disk } from 'tauri-plugin-system-info-api';

import { OptionsForm } from './components/OptionsForm/OptionsForm';
import { SlideList } from './components/SlideList/SlideList';
import { Fieldset } from './components/form/Fieldset/Fieldset';
import { subFolderOptions } from './constants';
import { useDisksQuery } from './hooks/useDisksQuery';
import { useIsDev } from './hooks/useIsDev';
import { usePhotosStore } from './stores/photos.store';
import type { ExtractedThumbnails } from './types/ExtractedThumbnail';
import type { FileInfo } from './types/File';

import './App.css';

interface FormValues {
  location: string;
  createSubFoldersPattern: string;
  convertToDng: boolean;
  deleteOriginal: boolean;
}

function App() {
  const store = new Store('photo-importer.settings.json');
  const [disk, setDisk] = useState<string>('');
  const { data: disks, isLoading: isLoadingDisks, refetch: refetchDisks } = useDisksQuery();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [removableDisks, setRemovableDisks] = useState<Disk[]>([]);
  const [extractedThumbnails, setExtractedThumbnails] = useState<ExtractedThumbnails[]>([]);
  const selected = usePhotosStore((state) => state.selected);
  const isDev = useIsDev(true);

  const isRemovableDisk = (disk: Disk): boolean => {
    if (isDev) {
      return disk.name.toLowerCase().startsWith('fake') || disk.is_removable;
    }
    return disk.is_removable;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const options = useMemo(
    () => disks?.filter((disk) => isRemovableDisk(disk)).map((disk) => ({ id: disk.mount_point, name: disk.name })),
    [disks],
  );

  const methods = useForm<FormValues>({
    defaultValues: async () => ({
      location: (await store.get('location')) ?? (await pictureDir()),
      createSubFoldersPattern: (await store.get('createSubFoldersPattern')) ?? subFolderOptions[2].id,
      convertToDng: (await store.get('convertToDng')) ?? false,
      deleteOriginal: (await store.get('deleteOriginal')) ?? false,
    }),
  });

  const formValues = useWatch(methods);

  // dirty logging
  useEffect(() => {
    if (!isDev) return;

    console.info('isDev', isDev);
    (async () => {
      const appDataDirPath = await appDataDir();
      console.info('appDataDirPath', appDataDirPath);
    })();
  }, [isDev]);

  useEffect(() => {
    (async () => {
      const promises: Promise<string>[] = [];
      for (const file of files) {
        promises.push(invoke<string>('extract_thumbnail', { path: file.path }));
      }
      const results = await Promise.allSettled(promises);

      setExtractedThumbnails(results.map((result) => (result.status === 'fulfilled' ? JSON.parse(result.value) : '')));
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

  const handleFocus = () => refetchDisks();

  const handleClose = async (): Promise<void> => {
    try {
      await process.exit(0);
    } catch (err) {
      console.info(err);
    }
  };

  const copyOrConvertFile = async (sources: string[], destination: string, useDngConverter: boolean): Promise<void> => {
    console.info('copyOrConvertFile', sources, destination, useDngConverter);
    try {
      await invoke('copy_or_convert', { sources, destination, useDngConverter });
      console.log('Operation successful');
    } catch (error) {
      console.error('Operation failed', error);
    }
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
                items={options ?? []}
                onSelectionChange={(value) => setDisk(String(value))}
                onFocus={handleFocus}
                isLoading={isLoadingDisks}
                isRequired
                width="100%"
              >
                {(item) => <Item>{item.name}</Item>}
              </Picker>
              <pre>{JSON.stringify(removableDisks, null, 2)}</pre>
              <pre>{JSON.stringify(options, null, 2)}</pre>
            </Fieldset>
          </form>
          <SlideList extractedThumbnails={extractedThumbnails} />
        </View>
        <View gridArea="sidebar" elementType="aside" padding="5px">
          <FormProvider {...methods}>
            <OptionsForm />
          </FormProvider>
        </View>
        <View gridArea="footer" elementType="footer">
          <Flex alignItems="center" justifyContent="space-between">
            <View>
              <Text>Selected: {selected.length}</Text>
            </View>
            <Flex gap="size-100">
              <Button variant="primary" type="button" onPress={handleClose}>
                Quit
              </Button>
              <Button
                variant="cta"
                type="button"
                onPress={() => copyOrConvertFile(selected, formValues.location ?? '', formValues.convertToDng ?? false)}
              >
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
