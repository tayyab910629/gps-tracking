import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Text, View } from '@/components/Themed';
import { LocationService } from '@/services/LocationService';
import { TrackingSession } from '@/types/location';
import { calculateMapRegion, convertToPitchCoordinates } from '@/utils/heatmapUtils';

export default function TrackingLinesScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [locationService] = useState(() => LocationService.getInstance());
  const [isPitchMode, setIsPitchMode] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (locationService.isCurrentlyTracking()) {
        setCurrentSession(locationService.getCurrentSession());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [locationService]);

  const handleStartTracking = async () => {
    const success = await locationService.startTracking();
    if (success) {
      setIsTracking(true);
      Alert.alert('Success', 'GPS tracking started!');
    } else {
      Alert.alert('Error', 'Failed to start GPS tracking. Please check location permissions.');
    }
  };

  const handleStopTracking = async () => {
    await locationService.stopTracking();
    setIsTracking(false);
    setCurrentSession(null);
    Alert.alert('Success', 'GPS tracking stopped and session saved!');
  };

  const rawCoordinates = currentSession?.coordinates || [];
  const coordinates = isPitchMode ? convertToPitchCoordinates(rawCoordinates) : rawCoordinates;
  const mapRegion = calculateMapRegion(coordinates, isPitchMode);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion}>
        {coordinates.length >= 1 && (
          <Polyline
            coordinates={coordinates.map(coord => ({
              latitude: coord.latitude,
              longitude: coord.longitude,
            }))}
            strokeColor="#007AFF"
            strokeWidth={5}
          />
        )}
        {coordinates.length > 0 && (
          <>
            <Marker
              coordinate={{
                latitude: coordinates[0].latitude,
                longitude: coordinates[0].longitude,
              }}
              title="Start"
              pinColor="green"
            />
            {coordinates.length > 1 && (
              <Marker
                coordinate={{
                  latitude: coordinates[coordinates.length - 1].latitude,
                  longitude: coordinates[coordinates.length - 1].longitude,
                }}
                title="Current Position"
                pinColor="red"
              />
            )}
          </>
        )}
      </MapView>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setIsPitchMode(!isPitchMode)}
        >
          <Text style={styles.modeButtonText}>
            {isPitchMode ? 'Pitch Mode' : 'GPS Mode'}
          </Text>
        </TouchableOpacity>

        {currentSession && (
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              Points: {currentSession.coordinates.length}
            </Text>
            <Text style={styles.statsText}>
              Duration: {Math.floor((Date.now() - currentSession.startTime) / 1000)}s
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  modeButton: {
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  modeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
