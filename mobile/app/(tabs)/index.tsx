import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { busService } from '../../services';
import { City } from '../../types';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPopularCities();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTravelDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const loadPopularCities = async () => {
    try {
      const cities = await busService.getCities(undefined, true);
      setPopularCities(cities);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSearch = async () => {
    if (!fromCity || !toCity || !travelDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      Alert.alert('Error', 'From and To cities cannot be the same');
      return;
    }

    router.push({
      pathname: '/search-results',
      params: {
        from: fromCity,
        to: toCity,
        date: travelDate,
      },
    });
  };

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const selectCity = (cityName: string, field: 'from' | 'to') => {
    if (field === 'from') {
      setFromCity(cityName);
    } else {
      setToCity(cityName);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={[Colors.primary, '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <Text style={styles.heroTitle}>Where would you like to go?</Text>
        <Text style={styles.heroSubtitle}>Book bus tickets in seconds</Text>
      </LinearGradient>

      {/* Search Card */}
      <View style={styles.searchCard}>
        {/* From City */}
        <View style={styles.inputRow}>
          <View style={styles.inputIconContainer}>
            <FontAwesome name="circle-o" size={14} color={Colors.success} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>FROM</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter departure city"
              placeholderTextColor="#9CA3AF"
              value={fromCity}
              onChangeText={setFromCity}
            />
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={swapCities}>
          <FontAwesome name="exchange" size={14} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* To City */}
        <View style={styles.inputRow}>
          <View style={styles.inputIconContainer}>
            <FontAwesome name="map-marker" size={16} color={Colors.primary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>TO</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination city"
              placeholderTextColor="#9CA3AF"
              value={toCity}
              onChangeText={setToCity}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Date */}
        <View style={styles.inputRow}>
          <View style={styles.inputIconContainer}>
            <FontAwesome name="calendar" size={14} color={Colors.secondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>TRAVEL DATE</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={travelDate}
              onChangeText={setTravelDate}
            />
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="search" size={16} color="#fff" />
                <Text style={styles.searchButtonText}>Search Buses</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Popular Cities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Cities</Text>
        <View style={styles.citiesGrid}>
          {popularCities.slice(0, 8).map((city) => (
            <TouchableOpacity
              key={city.id}
              style={styles.cityChip}
              onPress={() => selectCity(city.name, fromCity ? 'to' : 'from')}
            >
              <Text style={styles.cityChipText}>{city.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        {[
          { from: 'Bengaluru', to: 'Chennai', price: '₹499' },
          { from: 'Mumbai', to: 'Pune', price: '₹349' },
          { from: 'Hyderabad', to: 'Bengaluru', price: '₹699' },
          { from: 'Bengaluru', to: 'Goa', price: '₹899' },
        ].map((route, index) => (
          <TouchableOpacity
            key={index}
            style={styles.routeCard}
            onPress={() => {
              setFromCity(route.from);
              setToCity(route.to);
            }}
          >
            <View style={styles.routeInfo}>
              <View style={styles.routeCities}>
                <Text style={styles.routeCity}>{route.from}</Text>
                <FontAwesome name="long-arrow-right" size={14} color={Colors.primary} style={styles.routeArrow} />
                <Text style={styles.routeCity}>{route.to}</Text>
              </View>
              <Text style={styles.routePrice}>from {route.price}</Text>
            </View>
            <View style={styles.routeIconContainer}>
              <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  searchCard: {
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
    padding: 0,
  },
  swapButton: {
    position: 'absolute',
    right: 20,
    top: 50,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 46,
  },
  searchButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cityChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeCities: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  routeArrow: {
    marginHorizontal: 10,
  },
  routePrice: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  routeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
