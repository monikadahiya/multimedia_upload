import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ file, fileName, description, tags }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileName) formData.append('fileName', fileName);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);

      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.file;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Upload failed');
    }
  }
);

export const fetchFiles = createAsyncThunk('files/list', async ({ page = 1 } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/files', { params: { page } });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load files');
  }
});

export const searchFiles = createAsyncThunk(
  'files/search',
  async ({ query, fileType, startDate, endDate, sortBy = 'relevance', page = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/files/search', {
        params: { query, fileType, startDate, endDate, sortBy, page },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed');
    }
  }
);

export const deleteFile = createAsyncThunk('files/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/files/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Delete failed');
  }
});

const initialState = {
  items: [],
  page: 1,
  totalPages: 1,
  mode: 'browse', // 'browse' | 'search'
  status: 'idle',
  uploadStatus: 'idle',
  error: null,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    resetUploadStatus(state) {
      state.uploadStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploadStatus = 'loading';
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        state.items.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mode = 'browse';
        state.items = action.payload.files;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(searchFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mode = 'search';
        state.items = action.payload.files;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(searchFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f._id !== action.payload);
      });
  },
});

export const { resetUploadStatus } = fileSlice.actions;
export default fileSlice.reducer;
