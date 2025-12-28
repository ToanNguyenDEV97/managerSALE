// src/utils/api.ts
const API_SERVER_URL = 'http://localhost:5001'; // Hoặc đường dẫn server của bạn

export const api = async (url: string, options: RequestInit = {}) => {
    // 1. Lấy token từ Local hoặc Session
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 2. Chuẩn bị Header
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    // [QUAN TRỌNG] Nếu có token thì phải gắn vào Header
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Gọi Fetch
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    // 4. Xử lý lỗi
    if (!response.ok) {
        // Cố gắng đọc lỗi từ server trả về
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Lỗi API: ${response.statusText}`);
    }

    // Nếu server trả về 204 (No Content) -> return null
    if (response.status === 204) return null;

    return response.json();
};