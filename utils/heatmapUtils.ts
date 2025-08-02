import { Coordinate, HeatmapPoint } from '../types/location';

export function generateHeatmapData(coordinates: Coordinate[]): HeatmapPoint[] {
  if (coordinates.length === 0) {
    return [];
  }

  const gridSize = 0.0001; // Approximately 10 meters
  const grid: { [key: string]: Coordinate[] } = {};

  coordinates.forEach((coord) => {
    const gridX = Math.floor(coord.latitude / gridSize);
    const gridY = Math.floor(coord.longitude / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!grid[key]) {
      grid[key] = [];
    }
    grid[key].push(coord);
  });

  const heatmapPoints: HeatmapPoint[] = [];
  
  Object.values(grid).forEach((gridCoords) => {
    if (gridCoords.length > 0) {
      const avgLat = gridCoords.reduce((sum, coord) => sum + coord.latitude, 0) / gridCoords.length;
      const avgLng = gridCoords.reduce((sum, coord) => sum + coord.longitude, 0) / gridCoords.length;
      
      const weight = Math.min(gridCoords.length / 10, 1); // Normalize to 0-1
      
      heatmapPoints.push({
        latitude: avgLat,
        longitude: avgLng,
        weight,
      });
    }
  });

  return heatmapPoints;
}

export function calculateMapRegion(coordinates: Coordinate[]) {
  if (coordinates.length === 0) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const latitudes = coordinates.map(coord => coord.latitude);
  const longitudes = coordinates.map(coord => coord.longitude);
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  const latDelta = Math.max(maxLat - minLat, 0.01) * 1.2; // Add 20% padding
  const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.2;
  
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}
