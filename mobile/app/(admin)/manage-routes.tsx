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
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { adminService } from '../../services/admin';
import { busService } from '../../services/buses';
import { Route, City } from '../../types';

export default function ManageRoutes() {
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        from_city_id: '',
        to_city_id: '',
        distance_km: '',
        duration_minutes: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [routesData, citiesData] = await Promise.all([
                adminService.getRoutes(),
                busService.getCities(),
            ]);
            setRoutes(routesData);
            setCities(citiesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Failed to fetch routes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.from_city_id || !formData.to_city_id || !formData.distance_km || !formData.duration_minutes) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (formData.from_city_id === formData.to_city_id) {
                Alert.alert('Error', 'From and To cities cannot be the same');
                setSubmitting(false);
                return;
            }

            const payload = {
                from_city_id: parseInt(formData.from_city_id),
                to_city_id: parseInt(formData.to_city_id),
                distance_km: parseFloat(formData.distance_km),
                duration_minutes: parseInt(formData.duration_minutes),
            };

            await adminService.createRoute(payload);
            Alert.alert('Success', 'Route created');
            setModalVisible(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('Delete Route', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await adminService.deleteRoute(id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete route');
                    }
                },
            },
        ]);
    };

    const openModal = () => {
        setFormData({
            from_city_id: cities.length > 0 ? cities[0].id.toString() : '',
            to_city_id: cities.length > 1 ? cities[1].id.toString() : (cities.length > 0 ? cities[0].id.toString() : ''),
            distance_km: '',
            duration_minutes: '',
        });
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: Route }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.routeContainer}>
                    <Text style={styles.cityName}>{item.from_city?.name || 'Unknown'}</Text>
                    <FontAwesome name="arrow-right" size={14} color="#9CA3AF" style={styles.arrow} />
                    <Text style={styles.cityName}>{item.to_city?.name || 'Unknown'}</Text>
                </View>
            </View>
            <Text style={styles.routeInfo}>{item.distance_km} km • {(item.duration_minutes / 60).toFixed(1)} hrs</Text>

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
                    data={routes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openModal}>
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Route</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        <Text style={styles.label}>From City</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
                            {cities.map(city => (
                                <TouchableOpacity
                                    key={`from-${city.id}`}
                                    style={[styles.cityChip, formData.from_city_id === city.id.toString() && styles.activeCity]}
                                    onPress={() => setFormData({ ...formData, from_city_id: city.id.toString() })}
                                >
                                    <Text style={[styles.cityText, formData.from_city_id === city.id.toString() && styles.activeCityText]}>
                                        {city.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>To City</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
                            {cities.map(city => (
                                <TouchableOpacity
                                    key={`to-${city.id}`}
                                    style={[styles.cityChip, formData.to_city_id === city.id.toString() && styles.activeCity]}
                                    onPress={() => setFormData({ ...formData, to_city_id: city.id.toString() })}
                                >
                                    <Text style={[styles.cityText, formData.to_city_id === city.id.toString() && styles.activeCityText]}>
                                        {city.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Distance (km)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.distance_km}
                            onChangeText={(t) => setFormData({ ...formData, distance_km: t })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Duration (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.duration_minutes}
                            onChangeText={(t) => setFormData({ ...formData, duration_minutes: t })}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, submitting && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save</Text>
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
        marginBottom: 8,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cityName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    arrow: {
        marginHorizontal: 8,
    },
    routeInfo: {
        color: '#6B7280',
        marginBottom: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        marginTop: 8,
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
    cityScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    cityChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    activeCity: {
        backgroundColor: '#E0E7FF',
        borderColor: '#4F46E5',
    },
    cityText: {
        fontSize: 14,
        color: '#374151',
    },
    activeCityText: {
        color: '#4F46E5',
        fontWeight: '600',
    },
});
