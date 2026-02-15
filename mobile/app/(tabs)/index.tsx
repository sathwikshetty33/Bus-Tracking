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
  Modal,
  FlatList,
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
  const [allCities, setAllCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingField, setSelectingField] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCities();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTravelDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const loadCities = async () => {
    try {
      const [popular, all] = await Promise.all([
        busService.getCities(undefined, true),
        busService.getCities()
      ]);
      setPopularCities(popular);
      setAllCities(all);
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

  const openCityModal = (field: 'from' | 'to') => {
    setSelectingField(field);
    setSearchQuery('');
    setModalVisible(true);
  };

  const selectCity = (cityName: string) => {
    if (selectingField === 'from') {
      setFromCity(cityName);
    } else if (selectingField === 'to') {
      setToCity(cityName);
    }
    setModalVisible(false);
  };

  // Helper to directly select from popular chips without modal if needed, 
  // or pass to the selectCity function 
  const quickSelectCity = (cityName: string, field: 'from' | 'to') => {
    // If the field is empty, fill it. If "From" is filled, fill "To".
    if (field === 'from' || !fromCity) {
      setFromCity(cityName);
    } else {
      setToCity(cityName);
    }
  };

  const filteredCities = allCities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <TouchableOpacity style={styles.inputRow} onPress={() => openCityModal('from')}>
          <View style={styles.inputIconContainer}>
            <FontAwesome name="circle-o" size={14} color={Colors.success} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>FROM</Text>
            <Text style={[styles.inputText, !fromCity && styles.placeholderText]}>
              {fromCity || 'Select departure city'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={swapCities}>
          <FontAwesome name="exchange" size={14} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* To City */}
        <TouchableOpacity style={styles.inputRow} onPress={() => openCityModal('to')}>
          <View style={styles.inputIconContainer}>
            <FontAwesome name="map-marker" size={16} color={Colors.primary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>TO</Text>
            <Text style={[styles.inputText, !toCity && styles.placeholderText]}>
              {toCity || 'Select destination city'}
            </Text>
          </View>
        </TouchableOpacity>

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
              onPress={() => quickSelectCity(city.name, fromCity ? 'to' : 'from')}
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

      {/* City Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or code..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityItem} onPress={() => selectCity(item.name)}>
                <View>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.cityState}>{item.state}</Text>
                </View>
                <Text style={styles.cityCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>

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
  inputText: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cityState: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  cityCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
});
