import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Animated, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = '30856a4dacec8cd9bd9aff5214056474';

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 42.6629, // Prishtina
    longitude: 21.1655,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const debounceTimeout = useRef(null);

  // 🔹 Animacioni për marker (pulsim)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🔹 Animacioni për sfondin
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTemperature(region.latitude, region.longitude);

    // 🔹 Pulsim i marker-it
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // 🔹 Ndryshim më i dukshëm i sfondit
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();

    return () => {
      isMounted.current = false;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const fetchTemperature = async (latitude, longitude) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );
      if (isMounted.current) {
        setTemperature(response.data.main.temp);
      }
    } catch (error) {
      console.error("Gabim gjatë marrjes së të dhënave të motit:", error.message);
      Alert.alert("Gabim", "Nuk u arrit të merren të dhënat e motit.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchTemperature(newRegion.latitude, newRegion.longitude);
    }, 500);
  };

  const getMarkerColor = () => {
    if (temperature === null) return '#A93226';
    if (temperature < 0) return '#3498DB';
    if (temperature < 15) return '#5DADE2';
    if (temperature < 25) return '#F7DC6F';
    if (temperature < 35) return '#F39C12';
    return '#E74C3C';
  };

  // 🔹 Gradient sfondi më i dukshëm
  const backgroundColor = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,50,0.9)', 'rgba(255,140,0,0.7)'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)']}
        style={StyleSheet.absoluteFill}
      />
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsCompass
        loadingEnabled
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
          <Animated.View
            style={[
              styles.marker,
              { backgroundColor: getMarkerColor(), transform: [{ scale: pulseAnim }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.markerText}>
                {temperature !== null ? `${Math.round(temperature)}°C` : '—'}
              </Text>
            )}
          </Animated.View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  markerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
