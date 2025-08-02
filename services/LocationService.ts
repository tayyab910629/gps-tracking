import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate, TrackingSession } from '../types/location';

export class LocationService {
  private static instance: LocationService;
  private isTracking = false;
  private currentSession: TrackingSession | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    try {
      this.currentSession = {
        id: Date.now().toString(),
        startTime: Date.now(),
        coordinates: [],
      };

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 0.5,
        },
        (location) => {
          if (this.currentSession) {
            const coordinate: Coordinate = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            };
            this.currentSession.coordinates.push(coordinate);
          }
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking || !this.currentSession) {
      return;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.currentSession.endTime = Date.now();
    await this.saveSession(this.currentSession);
    
    this.currentSession = null;
    this.isTracking = false;
  }

  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  private async saveSession(session: TrackingSession): Promise<void> {
    try {
      const existingSessions = await this.getAllSessions();
      const updatedSessions = [...existingSessions, session];
      await AsyncStorage.setItem('tracking_sessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Error saving tracking session:', error);
    }
  }

  async getAllSessions(): Promise<TrackingSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem('tracking_sessions');
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Error loading tracking sessions:', error);
      return [];
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem('tracking_sessions');
    } catch (error) {
      console.error('Error clearing tracking sessions:', error);
    }
  }
}
