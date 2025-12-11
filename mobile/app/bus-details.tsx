import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  View,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { busService } from '../services';
import { BusSchedule, Seat } from '../types';
import { useAuth } from '../context/AuthContext';
import Colors from '@/constants/Colors';

export default function BusDetailsScreen() {
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const { isAuthenticated } = useAuth();
  const [schedule, setSchedule] = useState<BusSchedule | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusDetails();
  }, []);

  const loadBusDetails = async () => {
    try {
      const [scheduleData, seatsData] = await Promise.all([
        busService.getBusDetails(parseInt(scheduleId)),
        busService.getSeats(parseInt(scheduleId)),
      ]);
      setSchedule(scheduleData);
      setSeats(seatsData);
    } catch (error) {
      console.error('Failed to load bus details:', error);
      Alert.alert('Error', 'Failed to load bus details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (!seat.is_available) return;

    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        Alert.alert('Limit', 'You can select maximum 6 seats');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getTotalAmount = () => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to book tickets', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please select at least one seat');
      return;
    }

    router.push({
      pathname: '/booking-confirm',
      params: {
        scheduleId,
        seatIds: JSON.stringify(selectedSeats.map((s) => s.id)),
        seatNumbers: JSON.stringify(selectedSeats.map((s) => s.seat_number)),
        totalAmount: getTotalAmount().toString(),
      },
    });
  };

  const getSeatStyle = (seat: Seat) => {
    if (!seat.is_available) return { bg: '#E5E7EB', border: '#E5E7EB' };
    if (selectedSeats.find((s) => s.id === seat.id)) return { bg: Colors.success, border: Colors.success };
    if (seat.is_ladies_only) return { bg: '#FCE7F3', border: '#EC4899' };
    return { bg: '#fff', border: '#E5E7EB' };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!schedule) return null;

  // Group seats by deck
  const lowerDeck = seats.filter((s) => s.deck === 'lower');
  const upperDeck = seats.filter((s) => s.deck === 'upper');

  const renderSeat = (seat: Seat) => {
    const seatStyle = getSeatStyle(seat);
    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    
    return (
      <TouchableOpacity
        key={seat.id}
        style={[
          styles.seat,
          { backgroundColor: seatStyle.bg, borderColor: seatStyle.border },
        ]}
        onPress={() => toggleSeat(seat)}
        disabled={!seat.is_available}
      >
        <Text
          style={[
            styles.seatNumber,
            !seat.is_available && styles.unavailableSeatText,
            isSelected && styles.selectedSeatText,
          ]}
        >
          {seat.seat_number}
        </Text>
        <Text style={[styles.seatPrice, isSelected && styles.selectedSeatText]}>
          ₹{seat.price.toFixed(0)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDeck = (deckSeats: Seat[], title: string) => {
    const rows: { [key: number]: Seat[] } = {};
    deckSeats.forEach((seat) => {
      if (!rows[seat.row_number]) rows[seat.row_number] = [];
      rows[seat.row_number].push(seat);
    });

    return (
      <View style={styles.deckSection}>
        <Text style={styles.deckTitle}>{title}</Text>
        <View style={styles.seatLayout}>
          {Object.keys(rows).map((rowNum) => (
            <View key={rowNum} style={styles.seatRow}>
              {rows[parseInt(rowNum)]
                .sort((a, b) => a.column_number - b.column_number)
                .map(renderSeat)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Bus Info Header */}
      <LinearGradient
        colors={[Colors.primary, '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.operatorName}>{schedule.bus.operator.name}</Text>
        <Text style={styles.busInfo}>
          {schedule.bus.bus_type.toUpperCase()} • {schedule.bus.bus_number}
        </Text>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            {schedule.route.from_city.name} → {schedule.route.to_city.name}
          </Text>
        </View>
        <Text style={styles.dateText}>
          📅 {schedule.travel_date} • 🕐 {schedule.departure_time.slice(0, 5)}
        </Text>
      </LinearGradient>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FCE7F3', borderWidth: 1, borderColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Ladies</Text>
        </View>
      </View>

      {/* Seat Map */}
      <ScrollView style={styles.seatContainer} showsVerticalScrollIndicator={false}>
        {lowerDeck.length > 0 && renderDeck(lowerDeck, 'Lower Deck')}
        {upperDeck.length > 0 && renderDeck(upperDeck, 'Upper Deck')}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectedCount}>
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
          </Text>
          <Text style={styles.totalAmount}>₹{getTotalAmount().toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, selectedSeats.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
        >
          <LinearGradient
            colors={selectedSeats.length > 0 ? [Colors.success, '#00C853'] : ['#D1D5DB', '#D1D5DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <FontAwesome name="arrow-right" size={14} color="#fff" style={{ marginLeft: 8 }} />
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
  header: {
    padding: 20,
    paddingTop: 16,
  },
  operatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  busInfo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  routeInfo: {
    marginTop: 14,
  },
  routeText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  seatContainer: {
    flex: 1,
    padding: 16,
  },
  deckSection: {
    marginBottom: 28,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 14,
    textAlign: 'center',
  },
  seatLayout: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  seat: {
    width: 56,
    height: 48,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  seatPrice: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  unavailableSeatText: {
    color: '#9CA3AF',
  },
  selectedSeatText: {
    color: '#fff',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectionInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
