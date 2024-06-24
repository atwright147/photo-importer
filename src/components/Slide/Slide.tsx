import type { FC } from 'react';

import styles from './Slide.module.scss';

interface Props {
  src: string;
  alt: string;
  title: string;
}

export const Slide: FC<Props> = ({ src, alt, title }): JSX.Element => (
  <div className={styles.slide}>
    <figure className={styles.figure}>
      <img src={src} alt={alt} />
      <figcaption>{title}</figcaption>
    </figure>
  </div>
);
