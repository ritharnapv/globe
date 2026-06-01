export interface StateInfo {
  name: string;
  code: string;
  capitalOrHq: string;
  typicalPincodes: string[];
  description: string;
}

export interface CountryInspection {
  countryName: string;
  capital: string;
  population: string;
  currency: string;
  language: string;
  phoneCode: string;
  flagEmoji: string;
  postalCodeLabel: string; // e.g. "PIN Code", "ZIP Code"
  postalCodeFormat: string;
  postalCodeRegexExplanation?: string;
  states: StateInfo[];
  generalPostalTrivia?: string;
}

export interface PostalLookup {
  isValid: boolean;
  postalCode: string;
  country: string;
  state: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface GeoJsonFeature {
  type: "Feature";
  id?: string;
  properties: {
    name: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJsonData {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}
