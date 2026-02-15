import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  View,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { busService, bookingService, walletService } from '../services';
import { BusSchedule, Passenger, Wallet } from '../types';
import Colors from '@/constants/Colors';

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { scheduleId, seatIds, seatNumbers, totalAmount } = useLocalSearchParams<{
    scheduleId: string;
    seatIds: string;
    seatNumbers: string;
    totalAmount: string;
  }>();

  const [schedule, setSchedule] = useState<BusSchedule | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');

  const parsedSeatIds = JSON.parse(seatIds || '[]') as number[];
  const parsedSeatNumbers = JSON.parse(seatNumbers || '[]') as string[];
  const amount = parseFloat(totalAmount || '0');

  useEffect(() => {
    loadData();
    initPassengers();
  }, []);

  const loadData = async () => {
    try {
      const [scheduleData, walletData] = await Promise.all([
        busService.getBusDetails(parseInt(scheduleId)),
        walletService.getWallet(),
      ]);
      setSchedule(scheduleData);
      setWallet(walletData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initPassengers = () => {
    const initial: Passenger[] = parsedSeatIds.map((seatId) => ({
      seat_id: seatId,
      passenger_name: '',
      passenger_age: 0,
      passenger_gender: 'male' as const,
    }));
    setPassengers(initial);
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const validatePassengers = () => {
    for (const p of passengers) {
      if (!p.passenger_name.trim()) {
        Alert.alert('Error', 'Please enter all passenger names');
        return false;
      }
      if (!p.passenger_age || p.passenger_age < 1 || p.passenger_age > 120) {
        Alert.alert('Error', 'Please enter valid ages for all passengers');
        return false;
      }
    }
    return true;
  };

  const handleBooking = async () => {
    if (!validatePassengers()) return;

    if (paymentMethod === 'wallet') {
      if (!wallet) {
        Alert.alert('Error', 'Wallet information not available');
        return;
      }
      if (wallet.balance < amount) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet balance (₹${wallet.balance.toFixed(2)}) is insufficient for this booking (₹${amount.toFixed(2)}). Please add money to your wallet.`
        );
        return;
      }
    }

    Alert.alert(
      'Confirm Booking',
      `Book ${passengers.length} seat(s) for ₹${amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBooking(true);
            try {
              const result = await bookingService.createBooking({
                bus_schedule_id: parseInt(scheduleId),
                passengers: passengers,
                payment_method: paymentMethod,
              });
              Alert.alert(
                'Booking Confirmed! 🎉',
                `Your booking code is ${result.booking_code}`,
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
              );
            } catch (error: any) {
              Alert.alert('Booking Failed', error.response?.data?.detail || 'Please try again');
            } finally {
              setBooking(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trip Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.operatorName}>{schedule?.bus.operator.name}</Text>
              <View style={styles.busTypeBadge}>
                <Text style={styles.busTypeText}>{schedule?.bus.bus_type.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <View>
                <Text style={styles.timeText}>{schedule?.departure_time.slice(0, 5)}</Text>
                <Text style={styles.cityText}>{schedule?.route.from_city.name}</Text>
              </View>
              <View style={styles.routeArrowContainer}>
                <FontAwesome name="long-arrow-right" size={18} color={Colors.primary} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.timeText}>{schedule?.arrival_time.slice(0, 5)}</Text>
                <Text style={styles.cityText}>{schedule?.route.to_city.name}</Text>
              </View>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.detailItem}>
                <FontAwesome name="calendar" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{schedule?.travel_date}</Text>
              </View>
              <View style={styles.detailItem}>
                <FontAwesome name="ticket" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{parsedSeatNumbers.join(', ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Passenger Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger Details</Text>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <View style={styles.passengerHeader}>
                <Text style={styles.passengerTitle}>Passenger {index + 1}</Text>
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>Seat {parsedSeatNumbers[index]}</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={passenger.passenger_name}
                onChangeText={(val) => updatePassenger(index, 'passenger_name', val)}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.ageInput]}
                  placeholder="Age"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={passenger.passenger_age > 0 ? String(passenger.passenger_age) : ''}
                  onChangeText={(val) => updatePassenger(index, 'passenger_age', parseInt(val) || 0)}
                />
                <View style={styles.genderButtons}>
                  {(['male', 'female', 'other'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        passenger.passenger_gender === gender && styles.genderButtonActive,
                      ]}
                      onPress={() => updatePassenger(index, 'passenger_gender', gender)}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          passenger.passenger_gender === gender && styles.genderButtonTextActive,
                        ]}
                      >
                        {gender === 'male' ? 'M' : gender === 'female' ? 'F' : 'O'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#E8F5E9' }]}>
              <FontAwesome name="credit-card" size={18} color={Colors.success} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Wallet</Text>
              <Text style={styles.paymentBalance}>Balance: ₹{wallet?.balance.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'wallet' && styles.radioActive]}>
              {paymentMethod === 'wallet' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome name="credit-card-alt" size={16} color={Colors.info} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Card / UPI</Text>
              <Text style={styles.paymentBalance}>Pay via gateway</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{amount.toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, booking && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={booking}
        >
          <LinearGradient
            colors={[Colors.success, '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check" size={16} color="#fff" />
                <Text style={styles.bookButtonText}>Book Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  operatorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  busTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  busTypeText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cityText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  routeArrowContainer: {
    paddingHorizontal: 16,
  },
  summaryDetails: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  passengerCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  passengerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  seatBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seatBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#1A1A2E',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  genderButtons: {
    flexDirection: 'row',
  },
  genderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  paymentBalance: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalSection: {},
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
