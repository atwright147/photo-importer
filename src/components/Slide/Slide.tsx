import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { FC } from 'react';

import { usePhotosStore } from '../../stores/photos.store';
import type { ImageInfo } from '../../types/ImageInfo';

import styles from './Slide.module.scss';

interface Props {
  item: ImageInfo;
  alt: string;
  title: string;
}

export const Slide: FC<Props> = ({ item, alt, title }): JSX.Element => {
  const { isSelected, setSelected, removeSelected } = usePhotosStore((state) => ({
    isSelected: state.isSelected,
    setSelected: state.setSelected,
    removeSelected: state.removeSelected,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, item: ImageInfo): void => {
    if (event.target.checked) {
      setSelected(item);
    } else {
      removeSelected(item.hash);
    }
  };

  return (
    <div className={styles.slideContainer}>
      <input
        type="checkbox"
        name="image"
        value={item.thumbnail_path}
        id={item.thumbnail_path}
        checked={isSelected(item.hash)}
        onChange={(event) => handleChange(event, item)}
      />
      <label className={styles.slide} htmlFor={item.thumbnail_path}>
        <figure className={styles.figure}>
          <img src={convertFileSrc(item.thumbnail_path)} alt={alt} />
          <figcaption className={styles.figcaption}>{title}</figcaption>
        </figure>
      </label>
    </div>
  );
};
