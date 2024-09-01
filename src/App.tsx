import { Button, Flex, Grid, Provider, Text, View, defaultTheme } from '@adobe/react-spectrum';
import { invoke, process } from '@tauri-apps/api';
import type { FileEntry } from '@tauri-apps/api/fs';
import { pictureDir } from '@tauri-apps/api/path';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Store } from 'tauri-plugin-store-api';

import { OptionsForm } from './components/OptionsForm/OptionsForm';
import { SlideList } from './components/SlideList/SlideList';
import { jpegPreviewSizes, subFolderOptions } from './constants';
import { usePhotosStore } from './stores/photos.store';
import type { FileInfo } from './types/File';

import './App.css';
import { getDngArgs } from './utils/getDngArgs';

interface FormValues {
  // options form
  sourceDisk: string;
  location: string;
  createSubFoldersPattern: string;
  convertToDng: boolean;
  deleteOriginal: boolean;

  // dng settings form
  jpegPreviewSize: string;
  compressedLossless: boolean;
  imageConversionMethod: string;
  embedOriginalRawFile: boolean;
}

function App() {
  const store = new Store('photo-importer.settings.json');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const { selected, extractedThumbnails, setExtractedThumbnails } = usePhotosStore((state) => ({
    selected: state.selected,
    extractedThumbnails: state.extractedThumbnails,
    setExtractedThumbnails: state.setExtractedThumbnails,
  }));

  useEffect(() => {
    console.info(store);
  }, [store]);

  const methods = useForm<FormValues>({
    defaultValues: async () => ({
      sourceDisk: '',
      location: (await store.get('location')) ?? (await pictureDir()),
      createSubFoldersPattern: (await store.get('createSubFoldersPattern')) ?? subFolderOptions[2].id,
      convertToDng: (await store.get('convertToDng')) ?? false,
      deleteOriginal: (await store.get('deleteOriginal')) ?? false,

      jpegPreviewSize: (await store.get('jpegPreviewSize')) ?? jpegPreviewSizes[2].id,
      compressedLossless: (await store.get('compressedLossless')) ?? true,
      imageConversionMethod: (await store.get('imageConversionMethod')) ?? 'preserve',
      embedOriginalRawFile: (await store.get('embedOriginalRawFile')) ?? false,
    }),
  });

  const formValues = useWatch(methods);

  useEffect(() => {
    (async () => {
      const promises: Promise<string>[] = [];
      for (const file of files) {
        promises.push(invoke<string>('extract_thumbnail', { path: file.path }));
      }
      const results = await Promise.allSettled(promises);

      setExtractedThumbnails(results.map((result) => (result.status === 'fulfilled' ? JSON.parse(result.value) : '')));
    })();
  }, [files, setExtractedThumbnails]);

  useEffect(() => {
    if (!formValues.sourceDisk) return;

    (async () => {
      try {
        const result: FileInfo[] = await invoke('list_files', { drivePath: formValues.sourceDisk });
        setFiles(result);
      } catch (error) {
        console.error('Error listing files:', error);
      }
    })();
  }, [formValues.sourceDisk]);

  const handleClose = async (): Promise<void> => {
    try {
      await process.exit(0);
    } catch (err) {
      console.info(err);
    }
  };

  const copyOrConvertFile = async (
    sources: string[],
    destination: string,
    useDngConverter: boolean,
    deleteOriginal: boolean,
    args: string,
  ): Promise<void> => {
    console.info('copyOrConvertFile', sources, destination, useDngConverter);
    try {
      await invoke('copy_or_convert', { sources, destination, useDngConverter, deleteOriginal, args });
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
                onPress={() =>
                  copyOrConvertFile(
                    selected.map((file) => file.original_path),
                    formValues.location ?? '',
                    formValues.convertToDng ?? false,
                    formValues.deleteOriginal ?? false,
                    getDngArgs({
                      jpegPreviewSize: formValues.jpegPreviewSize ?? '',
                      compressedLossless: formValues.compressedLossless ?? false,
                      imageConversionMethod: formValues.imageConversionMethod ?? '',
                      embedOriginalRawFile: formValues.embedOriginalRawFile ?? false,
                    }),
                  )
                }
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
