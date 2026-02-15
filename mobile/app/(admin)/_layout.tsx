import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/Colors';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="dashboard"
                options={{
                    title: 'Admin Dashboard',
                    headerLeft: () => null, // Hide back button on dashboard
                }}
            />
            <Stack.Screen name="manage-buses" options={{ title: 'Manage Buses' }} />
            <Stack.Screen name="manage-routes" options={{ title: 'Manage Routes' }} />
            <Stack.Screen name="manage-tickets" options={{ title: 'Manage Tickets' }} />
        </Stack>
    );
}
