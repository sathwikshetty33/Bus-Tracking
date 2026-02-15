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
