import geolib from 'geolib'

export class Drone {

  constructor(droneId, latitude, longitude) {
    this.id = droneId
    this.latitude = latitude
    this.longitude = longitude
    this.distToDepot = 0
    this.timeToDepot = 0
    this.packages = []
    this.depotLocation = { latitude: -37.816664, longitude: 144.9616536}
  }

  calcDistanceToDepot() {

    // if this drone is currently carrying a package it needs to deliver it
    // prior to returning to the depot
    if (this.packages.length > 0) {

      const pkg = this.packages[0];

      // calc distance left to package destination
      const distToDest = geolib.getDistance({latitude: this.latitude,longitude: this.longitude}, {latitude: pkg.latitude, longitude: pkg.longitude });
      // calc distance from package destination back to depot
      const distToDepotFromDest = geolib.getDistance({latitude: pkg.latitude,longitude: pkg.longitude}, this.depotLocation);

      // calc total distance back to depot in metres
      this.distToDepot = distToDest + distToDepotFromDest;

    } else {

      // if no packages are currently assigned then dist to depot
      // can be calculated directly from current location
      this.distToDepot = geolib.getDistance({latitude: this.latitude,longitude: this.longitude}, this.depotLocation);
    }

    // calc time to depot in secs by dividing by 20,000 metres for fixed speed
    // and multiplying by 3600 seconds
    this.timeToDepot = this.distToDepot / 20000 * 3600;
  }

}
