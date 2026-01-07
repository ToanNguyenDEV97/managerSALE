import toast from 'react-hot-toast';

// [QUAN TRỌNG] Trỏ về Server Backend
const BASE_URL = 'http://localhost:5001';

export const api = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Xử lý URL thông minh: Tự động thêm /api nếu thiếu
    let url = endpoint;
    if (!endpoint.startsWith('http')) {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const finalPath = path.startsWith('/api') ? path : `/api${path}`;
        url = `${BASE_URL}${finalPath}`;
    }

    try {
        
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Xử lý 204 No Content
        if (response.status === 204) return null;

        const textData = await response.text();
        if (!textData || textData.trim().length === 0) return null;

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("Lỗi Parse JSON:", textData);
            if (textData.includes('<!DOCTYPE html>')) {
                throw new Error("Sai đường dẫn API hoặc Server chưa bật.");
            }
            throw new Error("Dữ liệu từ Server lỗi format");
        }

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Phiên đăng nhập hết hạn');
            }
            throw new Error(data?.message || 'Có lỗi xảy ra');
        }

        return data;

    } catch (error: any) {
        console.error('API Call Error:', url, error);
        throw error;
    }
};