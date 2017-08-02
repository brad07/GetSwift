import geolib from 'geolib'

export class Package {

  constructor(packageId, latitude, longitude, deadline) {
    this.id = packageId
    this.latitude = latitude
    this.longitude = longitude
    this.deadline = deadline
    this.deliveryDist = 0;
    this.deliveryTime = 0;
    this.depotLocation = { latitude: -37.816664, longitude: 144.9616536}
  }

  calcDeliveryDist() {
    // calc distance from depot to delivery location
    this.deliveryDist = geolib.getDistance(this.depotLocation, {latitude: this.latitude,longitude: this.longitude});

    // calc delivery time in secs by dividing by 20,000 metres for fixed speed
    // and multiplying by 3600 seconds
    this.deliveryTime = this.deliveryDist / 20000 * 3600;

  }
}
