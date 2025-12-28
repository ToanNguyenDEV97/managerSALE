import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
// [THÊM] Import BrowserRouter
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* [THÊM] Bọc BrowserRouter ở ngoài cùng (hoặc trong QueryClientProvider đều được) */}
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DataProvider>
            <App />
            <Toaster position="top-right" />
        </DataProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);