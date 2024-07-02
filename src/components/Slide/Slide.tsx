import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { FC } from 'react';

import { usePhotosStore } from '../../stores/photos.store';

import styles from './Slide.module.scss';

interface Props {
  src: string;
  alt: string;
  title: string;
}

export const Slide: FC<Props> = ({ src, alt, title }): JSX.Element => {
  const { setSelected, removeSelected } = usePhotosStore((state) => ({
    setSelected: state.setSelected,
    removeSelected: state.removeSelected,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, src: string): void => {
    if (event.target.checked) {
      setSelected(src);
    } else {
      removeSelected(src);
    }
  };

  return (
    <div className={styles.slideContainer}>
      <input type="checkbox" name="image" value={src} id={src} onChange={(event) => handleChange(event, src)} />
      <label className={styles.slide} htmlFor={src}>
        <figure className={styles.figure}>
          <img src={convertFileSrc(src)} alt={alt} />
          <figcaption className={styles.figcaption}>{title}</figcaption>
        </figure>
      </label>
    </div>
  );
};
