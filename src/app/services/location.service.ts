import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
@Injectable({
  providedIn: 'root',
})
export class LocationService {
  current_location: any = {
    latitude: 0,
    longitude: 0,
  };
  constructor() {}

  public async getLocation() {
    try {
      const watchOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 3000,
      };
      const watch = await Geolocation.watchPosition(
        watchOptions,
        (data: Position | null) => {
          if (data) {
            this.current_location.latitude = data.coords.latitude;
            this.current_location.longitude = data.coords.longitude;
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  public async getCurrentLocation() {
    try {
      const watchOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 3000,
      };

      const position = await Geolocation.getCurrentPosition(watchOptions);

      this.current_location.latitude = position.coords.latitude;
      this.current_location.longitude = position.coords.longitude;
    } catch (error) {
      console.error('Error getting location', error);
    }
  }
}
