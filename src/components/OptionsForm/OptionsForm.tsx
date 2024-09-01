import {
  AlertDialog,
  Button,
  ButtonGroup,
  Checkbox,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Form,
  Heading,
  Item,
  Picker,
  Radio,
  RadioGroup,
  TextField,
} from '@adobe/react-spectrum';
import { DevTool } from '@hookform/devtools';
import IconFolder from '@spectrum-icons/workflow/Folder';
import { invoke } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/dialog';
import { type FC, useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Store } from 'tauri-plugin-store-api';
import type { Disk } from 'tauri-plugin-system-info-api';

import { subFolderOptions } from '../../constants';
import { jpegPreviewSizes } from '../../constants';
import { useDisksQuery } from '../../hooks/useDisksQuery';
import { useIsDev } from '../../hooks/useIsDev';
import { useDialogsStore } from '../../stores/dialogs.store';
import { usePhotosStore } from '../../stores/photos.store';
import { handleFieldChangeSave } from '../../utils/handleFieldChangeSave';
import { Fieldset } from '../form/Fieldset/Fieldset';

export const OptionsForm: FC = (): JSX.Element => {
  const { addDialog, getDialog, setDialog } = useDialogsStore((store) => ({
    addDialog: store.addDialog,
    getDialog: store.getDialog,
    setDialog: store.setDialog,
  }));

  useEffect(() => {
    addDialog('dng-settings-form');
    addDialog('dng-converter-alert');
  }, []);

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
    setDialog('dng-settings-form', true);
  };

  const handleCloseDngConverterAlert = () => {
    setDialog('dng-converter-alert', false);
  };

  const handleCloseDngSettingsFormDialog = () => {
    setDialog('dng-settings-form', false);
  };

  const handleGetDngConverter = () => {
    invoke('open_url', { url: 'https://helpx.adobe.com/uk/camera-raw/using/adobe-dng-converter.html' });
  };

  const handleDngSettingsFormSave = async () => {
    await store.set('jpegPreviewSize', getValues('jpegPreviewSize'));
    await store.set('compressedLossless', getValues('compressedLossless'));
    await store.set('imageConversionMethod', getValues('imageConversionMethod'));
    await store.set('embedOriginalRawFile', getValues('embedOriginalRawFile'));
    await store.save();

    setDialog('dng-settings-form', false);
  };

  const handleDngConverterCheckboxChange = async (
    value: string | number | boolean,
    name: string,
    onChangeFn: (value: string) => void,
  ): Promise<void> => {
    if (await !invoke<boolean>('is_dng_converter_available')) {
      setDialog('dng-converter-alert', true);
      return;
    }
    await handleFieldChangeSave(value, name, onChangeFn, store);
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
      <Form onSubmit={() => handleSubmit(onSubmit)}>
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
                  onSelectionChange={(event) => handleFieldChangeSave(event as string, name, onChange, store)}
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

        <Fieldset legend="Advanced Options">
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
                  onChange={(event) => handleFieldChangeSave(event, name, onChange, store)}
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

        <Fieldset legend="Actions">
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
        {getDialog('dng-converter-alert')?.open && (
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

      <DialogContainer type="modal" onDismiss={handleCloseDngSettingsFormDialog}>
        {getDialog('dng-settings-form')?.open && (
          <Dialog>
            <Heading>DNG Convert Settings</Heading>
            <Divider />
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setDialog('dng-settings-form', false)}>
                Cancel
              </Button>
              <Button autoFocus variant="accent" onPress={handleDngSettingsFormSave}>
                Save
              </Button>
            </ButtonGroup>
            <Content>
              <Flex direction="column">
                <Controller
                  name="jpegPreviewSize"
                  control={control}
                  render={({ field }) => (
                    <Picker label="JPEG Preview Size" items={jpegPreviewSizes} onSelectionChange={field.onChange} selectedKey={field.value}>
                      {(item) => (
                        <Item key={item.id} textValue={item.name}>
                          {item.name}
                        </Item>
                      )}
                    </Picker>
                  )}
                />
                <Controller
                  control={control}
                  name="compressedLossless"
                  render={({ field }) => (
                    <Checkbox name={field.name} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} isSelected={field.value}>
                      Compressed (lossless)
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="imageConversionMethod"
                  render={({ field }) => (
                    <RadioGroup label="Image Conversion Method" onChange={field.onChange} defaultValue={field.value}>
                      <Radio value="preserve">Preserve Raw Image</Radio>
                      <Radio value="convert">Convert to Linear Image</Radio>
                    </RadioGroup>
                  )}
                />
                <Controller
                  control={control}
                  name="embedOriginalRawFile"
                  render={({ field }) => (
                    <Checkbox name={field.name} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} isSelected={field.value}>
                      Embed Original Raw File
                    </Checkbox>
                  )}
                />
              </Flex>
            </Content>
          </Dialog>
        )}
      </DialogContainer>

      <DevTool control={control} placement="top-left" />
    </>
  );
};
