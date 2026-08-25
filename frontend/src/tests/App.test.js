import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import fileReducer from '../store/slices/fileSlice';
import App from '../App';

jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockRejectedValue(new Error('not authenticated')),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

function renderWithProviders(ui) {
  const store = configureStore({ reducer: { auth: authReducer, files: fileReducer } });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

test('renders the home page with a call to action for logged-out users', async () => {
  renderWithProviders(<App />);
  expect(await screen.findByText(/store, preview, and find your media/i)).toBeInTheDocument();
  expect(screen.getByText(/get started/i)).toBeInTheDocument();
});

test('renders the navbar brand', () => {
  renderWithProviders(<App />);
  expect(screen.getByText('MediaVault')).toBeInTheDocument();
});
