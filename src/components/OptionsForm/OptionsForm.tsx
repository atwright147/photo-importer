import { AlertDialog, Button, Checkbox, DialogContainer, Flex, Form, Item, Picker, TextField } from '@adobe/react-spectrum';
import { DevTool } from '@hookform/devtools';
import IconFolder from '@spectrum-icons/workflow/Folder';
import { invoke } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/dialog';
import { type FC, useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Store } from 'tauri-plugin-store-api';
import type { Disk } from 'tauri-plugin-system-info-api';

import { subFolderOptions } from '../../constants';
import { useDisksQuery } from '../../hooks/useDisksQuery';
import { useIsDev } from '../../hooks/useIsDev';
import { usePhotosStore } from '../../stores/photos.store';
import { Fieldset } from '../form/Fieldset/Fieldset';

export const OptionsForm: FC = (): JSX.Element => {
  const [showDngConverterAlert, setShowDngConverterAlert] = useState(false);
  const { handleSubmit, control, getValues, setValue } = useFormContext();
  const { setSelectedAll, setSelectNone } = usePhotosStore((store) => ({
    setSelectedAll: store.setSelectedAll,
    setSelectNone: store.setSelectNone,
  }));
  const isDev = useIsDev(true);

  const store = new Store('photo-importer.settings.json');

  useEffect(() => {
    (async () => {
      const storeEntries = await store.entries();
      console.info('storeEntries', storeEntries);
    })();
  }, [store.entries]);

  // @ts-ignore
  const onSubmit = (data) => {
    // Call your API here...
  };

  // Open a selection dialog for directories

  const handleChooseFolder = async () => {
    const previousValue = getValues('location');

    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: getValues('location'),
    });

    if (selected === null) {
      // user cancelled the selection
      console.info('cancelled');
    } else {
      // user selected a single directory
      console.info('selected', selected);
      const shouldDirty = previousValue !== selected;
      setValue('location', selected as string, { shouldDirty, shouldTouch: true });
      await store.set('location', selected);
      await store.save();
    }
  };

  const handleDngSettings = () => {
    console.info('handleDngSettings');
  };

  const handleCloseDngConverterAlert = () => {
    setShowDngConverterAlert(false);
  };

  const handleGetDngConverter = () => {
    invoke('open_url', { url: 'https://helpx.adobe.com/uk/camera-raw/using/adobe-dng-converter.html' });
  };

  const handleFieldChange = async (value: string | number | boolean, name: string, onChangeFn: (value: string) => void): Promise<void> => {
    console.info('handleFieldChange', { value, name });
    onChangeFn(String(value));
    try {
      await store.set(name, value);
      await store.save();
    } catch (err) {
      console.info(err);
    }
  };

  const handleDngConverterCheckboxChange = async (
    value: string | number | boolean,
    name: string,
    onChangeFn: (value: string) => void,
  ): Promise<void> => {
    if (await !invoke<boolean>('is_dng_converter_available')) {
      setShowDngConverterAlert(true);
      return;
    }
    await handleFieldChange(value, name, onChangeFn);
  };

  const { data: disks, isLoading: isLoadingDisks, refetch: refetchDisks } = useDisksQuery();

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

  const handleSelectAll = () => {
    setSelectedAll();
  };

  const handleSelectNone = () => {
    console.info('handleSelectNone');
    setSelectNone();
  };

  const handleFocus = () => refetchDisks();

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset>
          <legend>Options</legend>

          <Flex gap="size-100" direction="column">
            <Controller
              control={control}
              name="sourceDisk"
              rules={{ required: 'Location is required.' }}
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { error } }) => (
                <Picker
                  label="Source Disk"
                  name={name}
                  items={options ?? []}
                  onSelectionChange={onChange}
                  selectedKey={value}
                  onFocus={handleFocus}
                  onBlur={onBlur}
                  ref={ref}
                  isLoading={isLoadingDisks}
                  isRequired
                  errorMessage={error?.message}
                  width="100%"
                >
                  {(item) => <Item>{item.name}</Item>}
                </Picker>
              )}
            />

            <Flex gap="size-100" direction="row" alignItems="end">
              <Controller
                control={control}
                name="location"
                rules={{ required: 'Location is required.' }}
                render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { error } }) => (
                  <TextField
                    label="Location"
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                    isRequired
                    errorMessage={error?.message}
                    width="100%"
                  />
                )}
              />
              <Button type="button" variant="secondary" onPress={handleChooseFolder} aria-label="Select a folder">
                <IconFolder />
              </Button>
            </Flex>

            <Controller
              control={control}
              name="createSubFoldersPattern"
              rules={{ required: 'Location is required.' }}
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { error } }) => (
                <Picker
                  label="Create Sub-Folders"
                  name={name}
                  items={subFolderOptions}
                  onSelectionChange={(event) => handleFieldChange(event as string, name, onChange)}
                  selectedKey={value}
                  onBlur={onBlur}
                  ref={ref}
                  isRequired
                  errorMessage={error?.message}
                  width="100%"
                >
                  {(item) => <Item>{item.name}</Item>}
                </Picker>
              )}
            />
          </Flex>
        </Fieldset>

        <Fieldset>
          <legend>Advanced Options</legend>
          <Flex gap="size-100" direction="column">
            <Flex>
              <Controller
                control={control}
                name="convertToDng"
                render={({ field: { name, value, onChange, onBlur, ref } }) => (
                  <Checkbox
                    name={name}
                    onChange={(event) => handleDngConverterCheckboxChange(event, name, onChange)}
                    onBlur={onBlur}
                    ref={ref}
                    isSelected={value}
                  >
                    Convert To DNG
                  </Checkbox>
                )}
              />
              <Button type="button" variant="secondary" onPress={handleDngSettings}>
                Settings
              </Button>
            </Flex>
            <Controller
              control={control}
              name="deleteOriginal"
              rules={{ required: 'Create sub-folders pattern is required.' }}
              render={({ field: { name, value, onChange, onBlur, ref } }) => (
                <Checkbox
                  name={name}
                  onChange={(event) => handleFieldChange(event, name, onChange)}
                  onBlur={onBlur}
                  ref={ref}
                  isSelected={value}
                >
                  Delete Original
                </Checkbox>
              )}
            />
          </Flex>
        </Fieldset>

        <Fieldset>
          <legend>Actions</legend>

          <Flex gap="size-100" direction="column">
            <Button type="button" variant="secondary" onPress={handleSelectAll}>
              Select All
            </Button>

            <Button type="button" variant="secondary" onPress={handleSelectNone}>
              Select None
            </Button>
          </Flex>
        </Fieldset>
      </Form>

      <DialogContainer type="modal" onDismiss={handleCloseDngConverterAlert}>
        {showDngConverterAlert && (
          <AlertDialog
            variant="confirmation"
            title="Adobe DNG Converter not installed"
            primaryActionLabel="Get Adobe DNG Converter"
            cancelLabel="Cancel"
            onCancel={handleCloseDngConverterAlert}
            onPrimaryAction={handleGetDngConverter}
          >
            Get Adobe DNG Converter?
          </AlertDialog>
        )}
      </DialogContainer>

      <DevTool control={control} placement="top-left" />
    </>
  );
};
