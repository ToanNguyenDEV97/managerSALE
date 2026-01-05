import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Navigate } from 'react-router-dom'; // [1] Import Navigate
// Nếu bạn muốn hiển thị trực tiếp trang 404 mà không đổi URL, import component này:
import NotFoundPage from '../../pages/NotFoundPage'; 

interface Props {
    children: ReactNode;
    resetKey?: string; 
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log lỗi ra console để dev vẫn biết đường sửa
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    public componentDidUpdate(prevProps: Props) {
        if (this.props.resetKey !== prevProps.resetKey) {
            this.setState({ hasError: false, error: null });
        }
    }

    public render() {
        if (this.state.hasError) {
            // CÁCH 1: Hiển thị trực tiếp component NotFoundPage (Khuyên dùng)
            // Ưu điểm: URL không bị đổi, người dùng biết trang hiện tại đang lỗi
            // Nhược điểm: Phải sửa NotFoundPage để nhận thông báo lỗi tùy chỉnh (nếu muốn)
            return <NotFoundPage />;

            // CÁCH 2: Chuyển hướng sang /404 (Nếu bạn thích đổi URL)
            // return <Navigate to="/404" replace />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;