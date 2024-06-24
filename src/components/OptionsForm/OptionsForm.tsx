import { Button, Checkbox, Form, Item, Picker, TextField } from '@adobe/react-spectrum';
import type { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Fieldset } from '../form/Fieldset/Fieldset';

export const OptionsForm: FC = (): JSX.Element => {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      location: '',
      createSubFoldersPattern: '',
      convertToDng: false,
      deleteOriginal: false,
    },
  });

  // @ts-ignore
  const onSubmit = (data) => {
    // Call your API here...
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Fieldset>
        <legend>Options</legend>

        <Controller
          control={control}
          name="location"
          rules={{ required: 'Location is required.' }}
          render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
            <Picker
              label="Location"
              name={name}
              items={[
                { id: 1, name: 'Folder 1' },
                { id: 2, name: 'Folder 2' },
              ]}
              onBlur={onBlur}
              ref={ref}
              isRequired
              errorMessage={error?.message}
            >
              {(item) => <Item>{item.name}</Item>}
            </Picker>
          )}
        />

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
            />
          )}
        />

        <Controller
          control={control}
          name="createSubFoldersPattern"
          rules={{ required: 'Create sub-folders pattern is required.' }}
          render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
            <TextField
              label="Create Sub-Folders"
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              ref={ref}
              isRequired
              errorMessage={error?.message}
            />
          )}
        />
      </Fieldset>

      <Fieldset>
        <legend>Advanced Options</legend>
        <Controller
          control={control}
          name="convertToDng"
          render={({ field: { name, value, onChange, onBlur, ref } }) => (
            <Checkbox name={name} onChange={onChange} onBlur={onBlur} ref={ref} isRequired>
              Convert To DNG
            </Checkbox>
          )}
        />

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
      </Fieldset>

      <Button type="submit" variant="cta">
        Submit
      </Button>
    </Form>
  );
};
