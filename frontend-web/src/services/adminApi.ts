import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const adminApi = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { auth } from '../services/firebase';

// Add request interceptor for auth token
adminApi.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error attaching auth token:", error);
    }
    return config;
});

// System Statistics
export const getSystemStats = async () => {
    try {
        const response = await adminApi.get('/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching system stats:', error);
        throw error;
    }
};

// Service Health Check
export const getServiceHealth = async () => {
    try {
        const response = await adminApi.get('/services/status');
        return response.data;
    } catch (error) {
        console.error('Error fetching service health:', error);
        throw error;
    }
};

// System Health
export const getSystemHealth = async () => {
    try {
        const response = await adminApi.get('/health');
        return response.data;
    } catch (error) {
        console.error('Error fetching system health:', error);
        throw error;
    }
};

// Get All Users
export const getAllUsers = async (page = 0, size = 10) => {
    try {
        const response = await adminApi.get(`/users?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Get Active Sessions
export const getActiveSessions = async () => {
    try {
        const response = await adminApi.get('/sessions/active');
        return response.data;
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        throw error;
    }
};

// Get All Sessions
export const getAllSessions = async (page = 0, size = 10, filter = 'all') => {
    try {
        const response = await adminApi.get(`/sessions/all?page=${page}&size=${size}&filter=${filter}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all sessions:', error);
        throw error;
    }
};

// Ban/Unban User
export const toggleUserBan = async (userId: number, banned: boolean) => {
    try {
        const response = await adminApi.post(`/users/${userId}/ban`, { banned });
        return response.data;
    } catch (error) {
        console.error('Error toggling user ban:', error);
        throw error;
    }
};

// Update User Role
export const updateUserRole = async (userId: number, role: string) => {
    try {
        const response = await adminApi.put(`/users/${userId}/role`, { role });
        return response.data;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

// Create User
export const createUser = async (user: any) => {
    try {
        const response = await adminApi.post('/users', user);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Force End Session
export const forceEndSession = async (sessionId: string) => {
    try {
        const response = await adminApi.delete(`/sessions/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error ending session:', error);
        throw error;
    }
};

// Get System Logs
export const getSystemLogs = async (level = 'all', limit = 100) => {
    try {
        const response = await adminApi.get(`/logs?level=${level}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
};

// Update System Settings
export const updateSystemSettings = async (settings: any) => {
    try {
        const response = await adminApi.put('/settings', settings);
        return response.data;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
};

// Get Analytics Data
export const getAnalytics = async (period = '7d') => {
    try {
        const response = await adminApi.get(`/analytics?period=${period}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
};

// Export Data
export const exportData = async (type: string) => {
    try {
        const response = await adminApi.get(`/export/${type}`, { responseType: 'blob' });
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_export_${new Date().toISOString()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
};

// Execute System Action (Maintenance)
export const executeSystemAction = async (action: string) => {
    try {
        const response = await adminApi.post('/system/actions', { action });
        return response.data;
    } catch (error) {
        console.error('Error executing system action:', error);
        throw error;
    }
};

export default adminApi;
