import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteFile } from '../../store/slices/fileSlice';
import FilePreview from './FilePreview';
import '../../styles/FileCard.scss';

export default function FileCard({ file }) {
  const dispatch = useDispatch();

  const handleDelete = () => {
    if (window.confirm(`Delete "${file.fileName}"? This cannot be undone.`)) {
      dispatch(deleteFile(file._id));
    }
  };

  return (
    <article className="file-card">
      <div className="file-card__preview">
        <FilePreview file={file} className="file-card__media" />
      </div>
      <div className="file-card__body">
        <h3 title={file.fileName}>{file.fileName}</h3>
        {file.description && <p className="file-card__desc">{file.description}</p>}
        {!!file.tags?.length && (
          <div className="file-card__tags">
            {file.tags.map((tag) => (
              <span key={tag} className="file-card__tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="file-card__meta">
          <span>{file.fileType.toUpperCase()}</span>
          <span>{file.viewCount ?? 0} views</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="file-card__actions">
          <a href={file.url} target="_blank" rel="noopener noreferrer">Open</a>
          <button onClick={handleDelete} className="file-card__delete">Delete</button>
        </div>
      </div>
    </article>
  );
}
