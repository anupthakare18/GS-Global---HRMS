// Helper functions for API calls and LocalStorage

const API_BASE = '/api';

function getSavedUser() {
    const userStr = localStorage.getItem('hrms_user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

function requireAuth(role) {
    const user = getSavedUser();
    if (!user) {
        window.location.href = '/';
        return null;
    }
    if (role && user.role !== role) {
        window.location.href = user.role === 'admin' ? '/admin/dashboard.html' : '/employee/dashboard.html';
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('hrms_user');
    window.location.href = '/';
}

async function fetchAPI(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        // Handle Blob for Excel export
        if (response.headers.get('content-type')?.includes('spreadsheetml')) {
            return response.blob();
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Request Failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
