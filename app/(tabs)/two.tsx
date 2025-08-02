import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { Text, View } from '@/components/Themed';
import { LocationService } from '@/services/LocationService';
import { TrackingSession } from '@/types/location';
import { generateHeatmapData, calculateMapRegion } from '@/utils/heatmapUtils';

export default function HeatMapScreen() {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrackingSession | null>(null);
  const [locationService] = useState(() => LocationService.getInstance());

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const allSessions = await locationService.getAllSessions();
    setSessions(allSessions);
    if (allSessions.length > 0 && !selectedSession) {
      setSelectedSession(allSessions[allSessions.length - 1]);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all tracking sessions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await locationService.clearAllSessions();
            setSessions([]);
            setSelectedSession(null);
            Alert.alert('Success', 'All tracking data has been cleared.');
          },
        },
      ]
    );
  };

  const coordinates = selectedSession?.coordinates || [];
  const heatmapData = generateHeatmapData(coordinates);
  const mapRegion = calculateMapRegion(coordinates);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion}>
        {heatmapData.map((point, index) => (
          <Circle
            key={index}
            center={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            radius={20}
            fillColor={`rgba(255, 0, 0, ${point.weight * 0.6})`}
            strokeColor={`rgba(255, 0, 0, ${point.weight})`}
            strokeWidth={2}
          />
        ))}
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.title}>Heat Map</Text>
        
        {sessions.length > 0 ? (
          <>
            <ScrollView horizontal style={styles.sessionSelector}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionButton,
                    selectedSession?.id === session.id && styles.selectedSession,
                  ]}
                  onPress={() => setSelectedSession(session)}
                >
                  <Text style={styles.sessionButtonText}>
                    {new Date(session.startTime).toLocaleDateString()}
                  </Text>
                  <Text style={styles.sessionButtonSubtext}>
                    {session.coordinates.length} points
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedSession && (
              <View style={styles.stats}>
                <Text style={styles.statsText}>
                  Session: {new Date(selectedSession.startTime).toLocaleString()}
                </Text>
                <Text style={styles.statsText}>
                  Duration: {selectedSession.endTime 
                    ? Math.floor((selectedSession.endTime - selectedSession.startTime) / 1000)
                    : 'In Progress'
                  }s
                </Text>
                <Text style={styles.statsText}>
                  Heat Points: {heatmapData.length}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
              <Text style={styles.clearButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tracking sessions found.</Text>
            <Text style={styles.emptySubtext}>
              Start tracking on the Tracking Lines tab to see heatmap data.
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    maxHeight: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sessionSelector: {
    maxHeight: 80,
    marginBottom: 10,
  },
  sessionButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
  },
  selectedSession: {
    backgroundColor: '#007AFF',
  },
  sessionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionButtonSubtext: {
    fontSize: 10,
    color: '#666',
  },
  stats: {
    marginBottom: 10,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  clearButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
