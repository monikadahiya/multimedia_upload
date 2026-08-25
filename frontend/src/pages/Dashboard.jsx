import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFiles, searchFiles } from '../store/slices/fileSlice';
import SearchBar from '../components/Search/SearchBar';
import FileCard from '../components/Files/FileCard';
import '../styles/Dashboard.scss';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { items, status, error, page, totalPages, mode } = useSelector((state) => state.files);

  useEffect(() => {
    dispatch(fetchFiles({ page: 1 }));
  }, [dispatch]);

  const goToPage = (newPage) => {
    if (mode === 'search') {
      dispatch(searchFiles({ page: newPage }));
    } else {
      dispatch(fetchFiles({ page: newPage }));
    }
  };

  return (
    <div className="dashboard">
      <h1>Your files</h1>
      <SearchBar />

      {status === 'loading' && <p className="dashboard__status">Loading...</p>}
      {status === 'failed' && <p className="dashboard__status dashboard__status--error">{error}</p>}
      {status === 'succeeded' && items.length === 0 && (
        <p className="dashboard__status">No files found. Try uploading one!</p>
      )}

      <div className="dashboard__grid">
        {items.map((file) => (
          <FileCard key={file._id} file={file} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="dashboard__pagination">
          <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
