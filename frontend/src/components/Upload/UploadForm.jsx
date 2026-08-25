import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, resetUploadStatus } from '../../store/slices/fileSlice';
import '../../styles/Upload.scss';

const MAX_SIZE_MB = 50;
const ACCEPTED = 'image/*,video/*,audio/*,application/pdf';

export default function UploadForm() {
  const dispatch = useDispatch();
  const { uploadStatus, error } = useSelector((state) => state.files);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [localError, setLocalError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setLocalError('');
    if (selected && selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`File is too large. Max size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      return;
    }
    setFile(selected);
    if (selected && !fileName) setFileName(selected.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setLocalError('Please choose a file to upload.');
      return;
    }
    dispatch(resetUploadStatus());
    await dispatch(uploadFile({ file, fileName, description, tags }));
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Upload a file</h2>
      {(localError || error) && <p className="upload-form__error">{localError || error}</p>}
      {uploadStatus === 'succeeded' && <p className="upload-form__success">Upload complete!</p>}

      <label className="upload-form__dropzone">
        <input type="file" accept={ACCEPTED} onChange={handleFileChange} />
        {file ? file.name : 'Click to choose an image, video, audio, or PDF file'}
      </label>

      <label>
        File name
        <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Optional" />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional"
        />
      </label>
      <label>
        Tags
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </label>

      <button type="submit" disabled={uploadStatus === 'loading'}>
        {uploadStatus === 'loading' ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
