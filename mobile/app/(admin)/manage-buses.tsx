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
import { Bus, Operator } from '../../types';

export default function ManageBuses() {
    const router = useRouter();
    const [buses, setBuses] = useState<Bus[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        bus_number: '',
        operator_id: '',
        bus_type: 'sleeper',
        total_seats: '30',
        seat_layout: '2+1',
        amenities: 'wifi,charging',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [busesData, operatorsData] = await Promise.all([
                adminService.getBuses(),
                adminService.getOperators() as any, // Cast because I haven't added getOperators to adminService types explicitly yet, or I did? I did in the file but maybe index.ts needs update? 
                // Actually I defined getOperators in admin.ts, so it should be fine if types import is correct.
                // Wait, I updated admin.ts but did I export it properly? Yes.
            ]);
            setBuses(busesData);
            setOperators(operatorsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Failed to fetch buses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.bus_number || !formData.operator_id) {
            Alert.alert('Error', 'Please fill required fields');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                operator_id: parseInt(formData.operator_id),
                total_seats: parseInt(formData.total_seats),
                amenities: formData.amenities.split(',').map(item => item.trim()),
            };

            if (isEditing && selectedBusId) {
                await adminService.updateBus(selectedBusId, payload);
                Alert.alert('Success', 'Bus updated');
            } else {
                await adminService.createBus(payload);
                Alert.alert('Success', 'Bus created');
            }
            setModalVisible(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('Delete Bus', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await adminService.deleteBus(id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete bus');
                    }
                },
            },
        ]);
    };

    const openModal = (bus?: Bus) => {
        if (bus) {
            setIsEditing(true);
            setSelectedBusId(bus.id);
            setFormData({
                bus_number: bus.bus_number,
                operator_id: bus.operator.id.toString(),
                bus_type: bus.bus_type,
                total_seats: bus.total_seats.toString(),
                seat_layout: bus.seat_layout,
                amenities: bus.amenities.join(','),
            });
        } else {
            setIsEditing(false);
            setSelectedBusId(null);
            setFormData({
                bus_number: '',
                operator_id: operators.length > 0 ? operators[0].id.toString() : '',
                bus_type: 'sleeper',
                total_seats: '30',
                seat_layout: '2+1',
                amenities: 'wifi,charging',
            });
        }
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: Bus }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.busNumber}>{item.bus_number}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.operator.name}</Text>
                </View>
            </View>
            <Text style={styles.busInfo}>{item.bus_type} • {item.total_seats} Seats</Text>
            <Text style={styles.amenities}>{item.amenities.join(', ')}</Text>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
                    <FontAwesome name="edit" size={20} color={Colors.primary} />
                </TouchableOpacity>
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
                    data={buses}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit Bus' : 'Add Bus'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        <Text style={styles.label}>Bus Number</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.bus_number}
                            onChangeText={(t) => setFormData({ ...formData, bus_number: t })}
                            placeholder="e.g. KA-01-AB-1234"
                        />

                        <Text style={styles.label}>Operator ID</Text>
                        <View style={styles.operatorList}>
                            {operators.map(op => (
                                <TouchableOpacity
                                    key={op.id}
                                    style={[styles.operatorChip, formData.operator_id === op.id.toString() && styles.activeOperator]}
                                    onPress={() => setFormData({ ...formData, operator_id: op.id.toString() })}
                                >
                                    <Text style={[styles.operatorText, formData.operator_id === op.id.toString() && styles.activeOperatorText]}>
                                        {op.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Bus Type</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.bus_type}
                            onChangeText={(t) => setFormData({ ...formData, bus_type: t })}
                        />

                        <Text style={styles.label}>Total Seats</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.total_seats}
                            onChangeText={(t) => setFormData({ ...formData, total_seats: t })}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Amenities (comma separated)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.amenities}
                            onChangeText={(t) => setFormData({ ...formData, amenities: t })}
                            placeholder="wifi, charging"
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
    busNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    badge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#4F46E5',
        fontSize: 12,
        fontWeight: '600',
    },
    busInfo: {
        color: '#6B7280',
        marginBottom: 4,
    },
    amenities: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
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
    operatorList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    operatorChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeOperator: {
        backgroundColor: '#E0E7FF',
        borderColor: '#4F46E5',
    },
    operatorText: {
        fontSize: 12,
        color: '#374151',
    },
    activeOperatorText: {
        color: '#4F46E5',
        fontWeight: '600',
    },
});
