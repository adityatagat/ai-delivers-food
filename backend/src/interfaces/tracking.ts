export interface ILocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ITrackingInfo {
  orderId: string;
  currentLocation: ILocation;
  estimatedArrival: Date;
  status: 'pending' | 'in_transit' | 'arrived' | 'delivered';
  lastUpdated: Date;
}

export interface IDeliveryRoute {
  origin: ILocation;
  destination: ILocation;
  waypoints?: ILocation[];
  distance: number; // in meters
  duration: number; // in seconds
}

export interface IOrderStatus {
  orderId: string;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  lastUpdated: Date;
} 