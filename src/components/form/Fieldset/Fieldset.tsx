import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

import styles from './Fieldset.module.scss';

export interface Props extends ComponentPropsWithoutRef<'fieldset'> {
  children: ReactNode;
}

export const Fieldset: FC<Props> = ({ children }): JSX.Element => {
  return <fieldset className={styles.fieldset}>{children}</fieldset>;
};
