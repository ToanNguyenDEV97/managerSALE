import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Thiết lập timer để update giá trị sau khoảng delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clear timer nếu value thay đổi trước khi hết giờ (người dùng gõ tiếp)
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}