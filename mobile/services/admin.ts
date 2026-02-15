import api from './api';
import { Bus, Route, Booking } from '../types';

export const adminService = {
    // Get Dashboard Stats
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Bus Management
    getOperators: async () => {
        const response = await api.get('/admin/operators');
        return response.data;
    },

    getBuses: async (skip = 0, limit = 100) => {
        const response = await api.get<Bus[]>(`/admin/buses?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    createBus: async (busData: any) => {
        const response = await api.post<Bus>('/admin/buses', busData);
        return response.data;
    },

    updateBus: async (id: number, busData: any) => {
        const response = await api.put<Bus>(`/admin/buses/${id}`, busData);
        return response.data;
    },

    deleteBus: async (id: number) => {
        const response = await api.delete(`/admin/buses/${id}`);
        return response.data;
    },

    // Route Management
    getRoutes: async (skip = 0, limit = 100) => {
        const response = await api.get<Route[]>(`/admin/routes?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    createRoute: async (routeData: any) => {
        const response = await api.post<Route>('/admin/routes', routeData);
        return response.data;
    },

    deleteRoute: async (id: number) => {
        const response = await api.delete(`/admin/routes/${id}`);
        return response.data;
    },

    // City Management
    getCities: async () => {
        // We can reuse the busService.getCities or better: create a dedicated admin endpoint if needed.
        // But for now, let's use the public one or the new admin one?
        // Wait, I created create_city but not get_cities in admin.py?
        // Let me check admin.py... I see get_operators and create_city. I didn't add get_cities in admin.py!
        // The frontend currently uses busService.getCities().
        // I should probably use that or add get_cities to admin.py.
        // For consistency, let's look at admin.py again.
        // I missed adding get_cities to admin.py in the previous step?
        // Let me check my previous edit to admin.py.
        const response = await api.get('/buses/cities'); // Using public endpoint for now as it returns all cities
        return response.data;
    },

    createCity: async (cityData: any) => {
        const response = await api.post('/admin/cities', cityData);
        return response.data;
    },

    // Ticket Management
    getBookings: async (skip = 0, limit = 100) => {
        const response = await api.get<Booking[]>(`/admin/bookings?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    cancelBooking: async (id: number) => {
        const response = await api.put(`/admin/bookings/${id}/cancel`);
        return response.data;
    },
};
