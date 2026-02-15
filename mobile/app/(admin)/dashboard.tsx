import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const router = useRouter();
    const { logout } = useAuth();
    const [stats, setStats] = useState({
        users: 0,
        buses: 0,
        routes: 0,
        bookings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const menuItems = [
        {
            title: 'Manage Buses',
            icon: 'bus',
            route: '/(admin)/manage-buses',
            color: ['#4F46E5', '#3730A3'],
            count: stats.buses,
        },
        {
            title: 'Manage Routes',
            icon: 'map-marker',
            route: '/(admin)/manage-routes',
            color: ['#059669', '#047857'],
            count: stats.routes,
        },
        {
            title: 'Manage Tickets',
            icon: 'ticket',
            route: '/(admin)/manage-tickets',
            color: ['#D97706', '#B45309'],
            count: stats.bookings,
        },
        {
            title: 'Manage Schedules',
            icon: 'calendar',
            route: '/(admin)/manage-schedules',
            color: ['#8B5CF6', '#7C3AED'],
            count: 0, // We could fetch this if we update getStats
        },
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Admin Dashboard</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <FontAwesome name="sign-out" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.users}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.bookings}</Text>
                    <Text style={styles.statLabel}>Total Bookings</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Management</Text>

            <View style={styles.grid}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => router.push(item.route as any)}
                    >
                        <LinearGradient
                            colors={item.color as any}
                            style={styles.cardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <FontAwesome name={item.icon as any} size={32} color="#fff" style={styles.cardIcon} />
                            <Text style={styles.cardCount}>{item.count}</Text>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
        marginLeft: 4,
    },
    grid: {
        gap: 16,
    },
    card: {
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardGradient: {
        flex: 1,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardIcon: {
        opacity: 0.9,
    },
    cardCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        position: 'absolute',
        right: 24,
        top: 24,
        opacity: 0.2,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginTop: 'auto',
    },
});
