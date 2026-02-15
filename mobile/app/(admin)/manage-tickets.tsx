import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { adminService } from '../../services/admin';
import { Booking } from '../../types';

export default function ManageTickets() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            if (!refreshing) setLoading(true);
            const data = await adminService.getBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            Alert.alert('Error', 'Failed to fetch bookings');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handleCancel = (id: number) => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await adminService.cancelBooking(id);
                        Alert.alert('Success', 'Booking cancelled');
                        fetchBookings();
                    } catch (error: any) {
                        Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel');
                    }
                },
            },
        ]);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return '#059669';
            case 'cancelled': return '#EF4444';
            case 'pending': return '#D97706';
            default: return '#6B7280';
        }
    };

    const renderItem = ({ item }: { item: Booking }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.bookingCode}>{item.booking_code}</Text>
                    <Text style={styles.date}>{new Date(item.booked_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.details}>
                <Text style={styles.detailText}>Bus: {item.bus_number || 'N/A'}</Text>
                <Text style={styles.detailText}>Amount: ₹{item.total_amount}</Text>
                <Text style={styles.detailText}>Passengers: {item.passengers?.length || 0}</Text>
            </View>

            {item.status.toLowerCase() !== 'cancelled' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancel(item.id)}
                    >
                        <Text style={styles.cancelText}>Cancel Booking</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No bookings found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    date: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
    },
    actions: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        alignItems: 'flex-end',
    },
    cancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 6,
    },
    cancelText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
    },
});
