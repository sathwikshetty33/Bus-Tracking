import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { busService } from '../services';
import { BusSchedule } from '../types';
import Colors from '@/constants/Colors';

export default function SearchResultsScreen() {
  const router = useRouter();
  const { from, to, date } = useLocalSearchParams<{ from: string; to: string; date: string }>();
  const [buses, setBuses] = useState<BusSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchBuses();
  }, []);

  const searchBuses = async () => {
    try {
      const results = await busService.searchBuses({
        from_city: from,
        to_city: to,
        travel_date: date,
      });
      setBuses(results);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No buses found for this route');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderBus = ({ item }: { item: BusSchedule }) => (
    <TouchableOpacity
      style={styles.busCard}
      onPress={() =>
        router.push({
          pathname: '/bus-details',
          params: { scheduleId: item.id.toString() },
        })
      }
      activeOpacity={0.7}
    >
      {/* Operator Header */}
      <View style={styles.busHeader}>
        <View style={styles.operatorInfo}>
          <Text style={styles.operatorName}>{item.bus.operator.name}</Text>
          <Text style={styles.busType}>
            {item.bus.bus_type.toUpperCase()} • {item.bus.seat_layout}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <FontAwesome name="star" size={11} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.bus.operator.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Time & Route */}
      <View style={styles.routeSection}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeText}>{item.departure_time.slice(0, 5)}</Text>
          <Text style={styles.cityText}>{item.route.from_city.name}</Text>
        </View>
        <View style={styles.durationBlock}>
          <Text style={styles.durationText}>
            {formatDuration(item.route.duration_minutes)}
          </Text>
          <View style={styles.routeLine}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <View style={styles.dot} />
          </View>
          <Text style={styles.distanceText}>{item.route.distance_km} km</Text>
        </View>
        <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
          <Text style={styles.timeText}>{item.arrival_time.slice(0, 5)}</Text>
          <Text style={styles.cityText}>{item.route.to_city.name}</Text>
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.amenitiesRow}>
        {item.bus.amenities?.slice(0, 4).map((amenity, index) => (
          <View key={index} style={styles.amenityChip}>
            <Text style={styles.amenityText}>{amenity}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.busFooter}>
        <View style={styles.seatsInfo}>
          <FontAwesome name="user" size={12} color={Colors.success} />
          <Text style={styles.seatsText}>{item.available_seats} seats left</Text>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Starts from</Text>
          <Text style={styles.priceText}>₹{item.base_price.toFixed(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Searching buses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIcon}>
          <FontAwesome name="bus" size={40} color="#D1D5DB" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Route Header */}
      <LinearGradient
        colors={[Colors.primary, '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.routeHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.routeTitle}>
            {from} → {to}
          </Text>
          <Text style={styles.dateText}>{date} • {buses.length} buses found</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={buses}
        renderItem={renderBus}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No buses found</Text>
          </View>
        }
      />
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
    padding: 20,
    backgroundColor: '#F8F9FD',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  routeHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  busType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    color: '#D97706',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBlock: {
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  cityText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  amenityChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  busFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 6,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
