import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { FC } from 'react';

import { usePhotosStore } from '../../stores/photos.store';

import styles from './Slide.module.scss';

interface Props {
  thumb: string;
  hash: string;
  alt: string;
  title: string;
}

export const Slide: FC<Props> = ({ thumb, hash, alt, title }): JSX.Element => {
  const { isSelected, setSelected, removeSelected } = usePhotosStore((state) => ({
    isSelected: state.isSelected,
    setSelected: state.setSelected,
    removeSelected: state.removeSelected,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, hash: string): void => {
    if (event.target.checked) {
      setSelected(hash);
    } else {
      removeSelected(hash);
    }
  };

  return (
    <div className={styles.slideContainer}>
      <input
        type="checkbox"
        name="image"
        value={thumb}
        id={thumb}
        checked={isSelected(hash)}
        onChange={(event) => handleChange(event, hash)}
      />
      <label className={styles.slide} htmlFor={thumb}>
        <figure className={styles.figure}>
          <img src={convertFileSrc(thumb)} alt={alt} />
          <figcaption className={styles.figcaption}>{title}</figcaption>
        </figure>
      </label>
    </div>
  );
};
