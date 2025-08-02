export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface TrackingSession {
  id: string;
  startTime: number;
  endTime?: number;
  coordinates: Coordinate[];
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}
