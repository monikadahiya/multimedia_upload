import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { searchFiles, fetchFiles } from '../../store/slices/fileSlice';
import '../../styles/Search.scss';

export default function SearchBar() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [startDate, setStartDate] = useState(''); // NEW
  const [endDate, setEndDate] = useState('');     // NEW

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() && !fileType && !startDate && !endDate) {
      dispatch(fetchFiles({ page: 1 }));
      return;
    }
    dispatch(
      searchFiles({
        query,
        fileType: fileType || undefined,
        startDate: startDate || undefined, // NEW
        endDate: endDate || undefined,     // NEW
        sortBy,
        page: 1,
      })
    );
  };

  const handleClear = () => {
    setQuery('');
    setFileType('');
    setSortBy('relevance');
    setStartDate('');
    setEndDate('');
    dispatch(fetchFiles({ page: 1 }));
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="search"
        placeholder="Search by file name or tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={fileType} onChange={(e) => setFileType(e.target.value)}>
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="audio">Audio</option>
        <option value="pdf">PDFs</option>
      </select>

      {/* NEW: date range filters */}
      <label className="search-bar__date">
        From
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label className="search-bar__date">
        To
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="relevance">Best match</option>
        <option value="popularity">Most viewed</option>
        <option value="date">Newest</option>
      </select>
      <button type="submit">Search</button>
      <button type="button" onClick={handleClear} className="search-bar__clear">Clear</button>
    </form>
  );
}
