import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { adminService } from '../../services/admin';
import { Bus, Route } from '../../types';

// Define Schedule Type locally if not in types
interface Schedule {
    id: number;
    bus_id: number;
    route_id: number;
    travel_date: string;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    available_seats: number;
    status: string;
    bus?: Bus;
    route?: Route;
}

export default function ManageSchedules() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        bus_id: '',
        route_id: '',
        travel_date: '', // YYYY-MM-DD
        departure_time: '', // HH:MM:SS
        base_price: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesData, busesData, routesData] = await Promise.all([
                adminService.getSchedules(),
                adminService.getBuses(),
                adminService.getRoutes(),
            ]);
            setSchedules(schedulesData);
            setBuses(busesData);
            setRoutes(routesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.bus_id || !formData.route_id || !formData.travel_date || !formData.departure_time || !formData.base_price) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        // Simple validation for date/time format if needed
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

        if (!dateRegex.test(formData.travel_date)) {
            Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
            return;
        }
        if (!timeRegex.test(formData.departure_time)) {
            Alert.alert('Error', 'Invalid time format. Use HH:MM');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                bus_id: parseInt(formData.bus_id),
                route_id: parseInt(formData.route_id),
                travel_date: formData.travel_date,
                departure_time: formData.departure_time.length === 5 ? formData.departure_time + ':00' : formData.departure_time,
                base_price: parseFloat(formData.base_price),
            };

            await adminService.createSchedule(payload);
            Alert.alert('Success', 'Schedule created');
            setModalVisible(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('Delete Schedule', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await adminService.deleteSchedule(id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete schedule');
                    }
                },
            },
        ]);
    };

    const openModal = () => {
        setFormData({
            bus_id: buses.length > 0 ? buses[0].id.toString() : '',
            route_id: routes.length > 0 ? routes[0].id.toString() : '',
            travel_date: new Date().toISOString().split('T')[0], // Default to today
            departure_time: '09:00',
            base_price: '',
        });
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: Schedule }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.dateText}>{item.travel_date} • {item.departure_time.substring(0, 5)}</Text>
                    <Text style={styles.routeText}>
                        {item.route?.from_city?.name || 'Unknown'} → {item.route?.to_city?.name || 'Unknown'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'scheduled' ? '#D1FAE5' : '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'scheduled' ? '#065F46' : '#374151' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>Bus: {item.bus?.bus_number} ({item.bus?.bus_type})</Text>
                <Text style={styles.detailText}>Price: ₹{item.base_price}</Text>
                <Text style={styles.detailText}>Seats: {item.available_seats} / {item.bus?.total_seats}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <FontAwesome name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
                <FlatList
                    data={schedules}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No schedules found</Text>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openModal}>
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Schedule</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        <Text style={styles.label}>Select Bus</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {buses.map(bus => (
                                <TouchableOpacity
                                    key={bus.id}
                                    style={[styles.chip, formData.bus_id === bus.id.toString() && styles.activeChip]}
                                    onPress={() => setFormData({ ...formData, bus_id: bus.id.toString() })}
                                >
                                    <Text style={[styles.chipText, formData.bus_id === bus.id.toString() && styles.activeChipText]}>
                                        {bus.bus_number}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Select Route</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {routes.map(route => (
                                <TouchableOpacity
                                    key={route.id}
                                    style={[styles.chip, formData.route_id === route.id.toString() && styles.activeChip]}
                                    onPress={() => setFormData({ ...formData, route_id: route.id.toString() })}
                                >
                                    <Text style={[styles.chipText, formData.route_id === route.id.toString() && styles.activeChipText]}>
                                        {route.from_city?.name} → {route.to_city?.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Travel Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.travel_date}
                            onChangeText={(t) => setFormData({ ...formData, travel_date: t })}
                            placeholder="2024-05-20"
                        />

                        <Text style={styles.label}>Departure Time (HH:MM)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.departure_time}
                            onChangeText={(t) => setFormData({ ...formData, departure_time: t })}
                            placeholder="09:00"
                        />

                        <Text style={styles.label}>Base Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.base_price}
                            onChangeText={(t) => setFormData({ ...formData, base_price: t })}
                            keyboardType="numeric"
                            placeholder="500"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, submitting && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Create Schedule</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
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
        paddingBottom: 80,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#6B7280',
        fontSize: 16,
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
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailsContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 2,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionBtn: {
        padding: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: Colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        color: '#EF4444',
        fontSize: 16,
    },
    form: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chipScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: '#E0E7FF',
        borderColor: '#4F46E5',
    },
    chipText: {
        fontSize: 14,
        color: '#374151',
    },
    activeChipText: {
        color: '#4F46E5',
        fontWeight: '600',
    },
});
