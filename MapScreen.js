import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

const API_KEY = '30856a4dacec8cd9bd9aff5214056474';

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 42.6629,  // Prishtina
    longitude: 21.1655,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    // Merr temperaturën fillestare
    fetchTemperature(region.latitude, region.longitude);

    // Cleanup
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

    // Debounce për të mos bërë thirrje shumë herë
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchTemperature(newRegion.latitude, newRegion.longitude);
    }, 500); // 500ms vonesë
  };

  const getMarkerColor = () => {
    if (temperature === null) return '#A93226'; // Default Red
    if (temperature < 0) return '#3498DB'; // Cold
    if (temperature < 15) return '#5DADE2'; // Cool
    if (temperature < 25) return '#F7DC6F'; // Mild
    if (temperature < 35) return '#F39C12'; // Warm
    return '#E74C3C'; // Hot
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsCompass={true}
        loadingEnabled={true}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
          <View style={[styles.marker, { backgroundColor: getMarkerColor() }]}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.markerText}>
                {temperature !== null ? `${Math.round(temperature)}°C` : '—'}
              </Text>
            )}
          </View>
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
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  markerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
