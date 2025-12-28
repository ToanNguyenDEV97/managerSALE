import toast from 'react-hot-toast';

export const api = async (url: string, options: RequestInit = {}) => {
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

    try {
        // 3. Gọi Fetch
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // 4. [FIX MẠNH TAY] Xử lý body an toàn
        // Nếu là 204 (No Content) -> Trả về null luôn
        if (response.status === 204) {
            return null;
        }

        // Đọc response dưới dạng TEXT trước (không parse JSON ngay)
        const textData = await response.text();
        
        // Nếu text rỗng -> Trả về null (tránh lỗi Unexpected end of JSON input)
        if (!textData || textData.trim().length === 0) {
            return null;
        }

        // Nếu có dữ liệu -> Mới thử Parse JSON
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("Lỗi Parse JSON từ Server:", textData);
            throw new Error("Dữ liệu từ Server không đúng định dạng JSON");
        }

        // 5. Xử lý logic lỗi nghiệp vụ (như cũ)
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('rememberedEmail');
                window.location.href = '/login';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            const errorMessage = data?.message || 'Có lỗi xảy ra';
            throw new Error(errorMessage);
        }

        return data;

    } catch (error: any) {
        console.error('API Call Error:', url, error);
        // Ném lỗi tiếp để Component xử lý (hoặc toast ở đây luôn nếu muốn)
        throw error;
    }
};