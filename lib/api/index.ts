import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add response interceptor for error handling if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can handle global errors here, e.g., redirect to login on 401
        return Promise.reject(error);
    }
);
