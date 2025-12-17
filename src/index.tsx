// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import mới

// Tạo Client quản lý cache
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Không tự load lại khi focus tab
            retry: 1, // Thử lại 1 lần nếu lỗi
        },
    },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Bọc QueryClientProvider ở ngoài cùng hoặc trong DataProvider đều được */}
    <QueryClientProvider client={queryClient}>
        <DataProvider>
          <App />
        </DataProvider>
    </QueryClientProvider>
  </React.StrictMode>
);