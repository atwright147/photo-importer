import { AlertDialog, Button, Checkbox, DialogContainer, Flex, Form, Item, Picker, TextField } from '@adobe/react-spectrum';
import { DevTool } from '@hookform/devtools';
import { invoke } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/dialog';
import { pictureDir } from '@tauri-apps/api/path';
import { type FC, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Fieldset } from '../form/Fieldset/Fieldset';

const subFolderOptions = [
  { id: 'none', name: 'None' },
  { id: 'custom', name: 'Custom Name' },
  { id: 'yyyymmdd', name: 'Shot Date (yyyymmdd)' }, // default?
  { id: 'yymmdd', name: 'Shot Date (yymmdd)' },
  { id: 'ddmmyy', name: 'Shot Date (ddmmyy)' },
  { id: 'ddmm', name: 'Shot Date (ddmm)' },
  { id: 'yyyyddmmm', name: 'Shot Date (yyyyddmmm)' },
  { id: 'ddmmmyyyy', name: 'Shot Date (ddmmmyyyy)' },
];

export const OptionsForm: FC = (): JSX.Element => {
  const [showDngConverterAlert, setShowDngConverterAlert] = useState(false);
  const { handleSubmit, control, getValues, setValue, watch } = useForm({
    defaultValues: async () => ({
      location: await pictureDir(),
      createSubFoldersPattern: subFolderOptions[2].id,
      convertToDng: false,
      deleteOriginal: false,
    }),
  });

  useEffect(() => {
    console.info('OptionsForm');
    (async () => {
      // TODO: pull these from localStorage or something
      const location = await pictureDir();
      setValue('location', location);
    })();
  }, [setValue]);

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
      defaultPath: await pictureDir(),
    });

    if (selected === null) {
      // user cancelled the selection
      console.info('cancelled');
    } else {
      // user selected a single directory
      console.info('selected', selected);
      const shouldDirty = previousValue !== selected;
      setValue('location', selected as string, { shouldDirty, shouldTouch: true });
    }
  };

  const handleDngSettings = () => {
    console.info('handleDngSettings');
  };

  const handleCloseDngConverterAlert = () => {
    console.info('handleDngAlertCancel');
  };

  const handleGetDngConverter = () => {
    invoke('open_url', { url: 'https://helpx.adobe.com/uk/camera-raw/using/adobe-dng-converter.html' });
  };

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset>
          <legend>Options</legend>
          <Flex gap="size-100" direction="row" alignItems="end">
            <Controller
              control={control}
              name="location"
              rules={{ required: 'Location is required.' }}
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
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
            <Button type="button" variant="secondary" onPress={handleChooseFolder}>
              Folder
            </Button>
          </Flex>
          <Controller
            control={control}
            name="createSubFoldersPattern"
            rules={{ required: 'Location is required.' }}
            render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
              <Picker
                label="Create Sub-Folders"
                name={name}
                items={subFolderOptions}
                onSelectionChange={onChange}
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
        </Fieldset>
        <Fieldset>
          <legend>Advanced Options</legend>
          <Flex gap="size-100" direction="column">
            <Flex>
              <Controller
                control={control}
                name="convertToDng"
                render={({ field: { name, value, onChange, onBlur, ref } }) => (
                  <Checkbox name={name} onChange={onChange} onBlur={onBlur} ref={ref} isRequired>
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
                <Checkbox name={name} onChange={onChange} onBlur={onBlur} ref={ref} isRequired>
                  Delete Original
                </Checkbox>
              )}
            />
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

      <DevTool control={control} placement="bottom-left" />
    </>
  );
};
