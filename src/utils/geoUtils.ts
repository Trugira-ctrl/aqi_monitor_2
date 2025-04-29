/**
 * Utility functions for working with GeoJSON data
 */

/**
 * Checks if a point is inside a polygon using the ray casting algorithm
 * @param point [longitude, latitude] coordinates
 * @param polygon Array of polygon coordinates
 * @returns boolean indicating if the point is inside the polygon
 */
export const isPointInPolygon = (point: [number, number], polygon: number[][][]): boolean => {
  // For MultiPolygon, check each polygon
  for (const poly of polygon) {
    // For each polygon, check the first ring (outer ring)
    const ring = poly[0];
    
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    if (inside) return true;
  }
  
  return false;
};

/**
 * Interface for GeoJSON feature properties
 */
export interface GeoJSONFeatureProperties {
  NAME_1?: string; // Province/Region
  NAME_2?: string; // District
  NAME_3?: string; // Sector
  [key: string]: any;
}

/**
 * Interface for GeoJSON feature
 */
export interface GeoJSONFeature {
  type: string;
  properties: GeoJSONFeatureProperties;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

/**
 * Interface for GeoJSON data
 */
export interface GeoJSONData {
  type: string;
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: GeoJSONFeature[];
}

/**
 * Finds the administrative area (district, sector) containing the given coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param districtsGeoJSON GeoJSON data for districts
 * @param sectorsGeoJSON GeoJSON data for sectors
 * @returns Object containing district and sector names
 */
export const findAdministrativeArea = (
  latitude: number | undefined,
  longitude: number | undefined,
  districtsGeoJSON: GeoJSONData | null,
  sectorsGeoJSON: GeoJSONData | null
): { district: string; sector: string } => {
  if (!latitude || !longitude || !districtsGeoJSON || !sectorsGeoJSON) {
    return { district: "Unknown", sector: "Unknown" };
  }

  const point: [number, number] = [longitude, latitude];
  let district = "Unknown";
  let sector = "Unknown";

  // Find district
  for (const feature of districtsGeoJSON.features) {
    if (feature.geometry.type === "MultiPolygon" && 
        isPointInPolygon(point, feature.geometry.coordinates)) {
      district = feature.properties.NAME_2 || "Unknown";
      break;
    }
  }

  // Find sector
  for (const feature of sectorsGeoJSON.features) {
    if (feature.geometry.type === "MultiPolygon" && 
        isPointInPolygon(point, feature.geometry.coordinates)) {
      sector = feature.properties.NAME_3 || "Unknown";
      break;
    }
  }

  return { district, sector };
};