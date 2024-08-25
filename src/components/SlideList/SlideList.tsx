import type { FC } from 'react';
import type { ExtractedThumbnails } from '../../types/ExtractedThumbnail';
import { getFilename } from '../../utils/getFilename';
import { Slide } from '../Slide/Slide';
import styles from './SlideList.module.scss';

interface Props {
  extractedThumbnails: ExtractedThumbnails[];
}

export const SlideList: FC<Props> = ({ extractedThumbnails }): JSX.Element => {
  return (
    <ul className={styles.slideList}>
      {extractedThumbnails.map((file) => (
        <li key={file.original_path} className={styles.listItem}>
          <Slide thumb={file.thumbnail_path} hash={file.hash} alt="" title={getFilename(file.original_path)} />
        </li>
      ))}
    </ul>
  );
};
