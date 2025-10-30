import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect, useState, useContext, createContext, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = '30856a4dacec8cd9bd9aff5214056474';
const Stack = createStackNavigator();

// Aktivizo LayoutAnimation në Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Context për qytetin e zgjedhur
const CityContext = createContext();

function CityProvider({ children }) {
  const [city, setCity] = useState('Pristina, XK');
  return <CityContext.Provider value={{ city, setCity }}>{children}</CityContext.Provider>;
}

// ---------------- WeatherScreen ----------------
function WeatherScreen({ navigation }) {
  const { city, setCity } = useContext(CityContext);
  const [weatherData, setWeatherData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchWeatherData = async (cityName = city) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(response.data);
      setError('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError('City not found or network error.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 1) {
      const cityList = [
        'Pristina', 'Peja', 'Prizren', 'Ferizaj', 'Gjilan', 'Gjakova', 'Mitrovica', 'Lipljan',
        'Vushtrri', 'Suhareka', 'Podujeva', 'Rahoveci', 'Fushë Kosovë', 'Kamenica', 'Skenderaj',
        'Obiliq', 'Deçan', 'Istog', 'Malishevë', 'Novobërdë', 'Kaçanik',
        'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
        'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
        'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein',
        'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
        'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'San Marino', 'Serbia',
        'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom'
      ];

      const matches = cityList.filter((c) => c.toLowerCase().includes(text.toLowerCase()));
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleCitySelect = (selectedCity) => {
    if (!selectedCity.trim()) {
      setError('Please enter a valid city name!');
      return;
    }
    setError('');
    setCity(selectedCity);
    setSearch(selectedCity);
    setSuggestions([]);
    fetchWeatherData(selectedCity);
  };

  const getBackgroundImage = () => {
    if (!weatherData) return require('./assets/default.jpg');
    const temp = weatherData.main.temp;
    if (temp < 0) return require('./assets/cold.jpg');
    if (temp < 15) return require('./assets/cloudy.jpg');
    if (temp < 25) return require('./assets/sunny.jpg');
    return require('./assets/hot.jpg');
  };

  if (!weatherData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 18, color: '#333' }}>Loading...</Text>
      </View>
    );
  }

  const weatherIcon = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`;

  return (
    <ImageBackground source={getBackgroundImage()} style={{ flex: 1 }}>
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(255,255,255,0.1)']} style={{ flex: 1 }}>
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Current Weather</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MapScreen')} style={styles.mapButton}>
                  <Icon name="map" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter city or country"
                  value={search}
                  onChangeText={handleSearch}
                  onSubmitEditing={() => handleCitySelect(search)}
                />
                <TouchableOpacity style={styles.searchButton} onPress={() => handleCitySelect(search)}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleCitySelect(item)}>
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginTop: 20 }}>
              <Text style={styles.location}>{weatherData.name}</Text>
              <Image source={{ uri: weatherIcon }} style={styles.weatherIcon} />
              <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°C</Text>
              <Text style={styles.weatherDescription}>{weatherData.weather[0].description}</Text>
            </Animated.View>
          }
          contentContainerStyle={styles.container}
        />
      </LinearGradient>
    </ImageBackground>
  );
}

// ---------------- MapScreen ----------------
function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 42.6667,
          longitude: 21.1667,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        <Marker coordinate={{ latitude: 42.6667, longitude: 21.1667 }} title="Pristina" description="Kosovo" />
      </MapView>
    </View>
  );
}

// ---------------- App ----------------
export default function App() {
  return (
    <CityProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="WeatherScreen">
          <Stack.Screen name="WeatherScreen" component={WeatherScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MapScreen" component={MapScreen} options={{ title: 'Map View' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </CityProvider>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#A93226',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  mapButton: {
    backgroundColor: '#A93226',
    padding: 10,
    borderRadius: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    marginVertical: 15,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    padding: 10,
    backgroundColor: '#A93226',
    borderRadius: 8,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#FFF',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#FFF',
  },
  suggestionText: {
    fontSize: 16,
  },
  location: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
  },
  weatherIcon: {
    width: 120,
    height: 120,
    marginTop: 10,
  },
  temperature: {
    fontSize: 50,
    fontWeight: 'bold',
    marginTop: 5,
  },
  weatherDescription: {
    fontSize: 20,
    color: '#555',
    marginTop: 5,
  },
});
