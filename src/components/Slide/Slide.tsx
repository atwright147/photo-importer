import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { FC } from 'react';

import { usePhotosStore } from '../../stores/photos.store';

import styles from './Slide.module.scss';

interface Props {
  thumb: string;
  original: string;
  alt: string;
  title: string;
}

export const Slide: FC<Props> = ({ thumb, original, alt, title }): JSX.Element => {
  const { setSelected, removeSelected } = usePhotosStore((state) => ({
    setSelected: state.setSelected,
    removeSelected: state.removeSelected,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, original: string): void => {
    if (event.target.checked) {
      setSelected(original);
    } else {
      removeSelected(original);
    }
  };

  return (
    <div className={styles.slideContainer}>
      <input type="checkbox" name="image" value={thumb} id={thumb} onChange={(event) => handleChange(event, original)} />
      <label className={styles.slide} htmlFor={thumb}>
        <figure className={styles.figure}>
          <img src={convertFileSrc(thumb)} alt={alt} />
          <figcaption className={styles.figcaption}>{title}</figcaption>
        </figure>
      </label>
    </div>
  );
};
