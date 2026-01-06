import toast from 'react-hot-toast';

// [SỬA LẠI] Thêm đuôi /api vào cuối đường dẫn
const BASE_URL = 'http://localhost:5001/api';

export const api = async (endpoint: string, options: RequestInit = {}) => {
    // 1. Lấy token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // 2. Chuẩn bị Header
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Xử lý URL
    // Nếu endpoint bắt đầu bằng http (link ngoài) thì giữ nguyên
    // Nếu không thì nối BASE_URL + endpoint (Ví dụ: .../api + /auth/login)
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    try {
        console.log(`Dang goi API: ${url}`); // Bạn mở Console (F12) để xem nó in ra link đúng chưa nhé
        
        // 4. Gọi Fetch
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // 5. Xử lý logic 204 No Content
        if (response.status === 204) return null;

        const textData = await response.text();
        if (!textData || textData.trim().length === 0) return null;

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("Lỗi Parse JSON:", textData);
            if (textData.includes('<!DOCTYPE html>')) {
                throw new Error("Sai đường dẫn API (Thiếu /api) hoặc Server lỗi.");
            }
            throw new Error("Dữ liệu từ Server không đúng định dạng JSON");
        }

        // 6. Xử lý lỗi từ Server
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('rememberedEmail');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                throw new Error('Phiên đăng nhập hết hạn');
            }

            const errorMessage = data?.message || 'Có lỗi xảy ra';
            throw new Error(errorMessage);
        }

        return data;

    } catch (error: any) {
        console.error('API Call Error:', url, error);
        throw error;
    }
};