import type { FileEntry } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { FC } from 'react';
import { getFilename } from '../../utils/getFilename';
import { Slide } from '../Slide/Slide';
import styles from './SlideList.module.scss';

interface Props {
  files: FileEntry[];
  extractedThumbnails: string[];
}

export const SlideList: FC<Props> = ({ files, extractedThumbnails }): JSX.Element => {
  return (
    <ul className={styles.slideList}>
      {files.map((file, index) => (
        <li key={file.path} className={styles.listItem}>
          <Slide src={convertFileSrc(extractedThumbnails[index])} alt="" title={getFilename(file.path)} />
        </li>
      ))}
    </ul>
  );
};
