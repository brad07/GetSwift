import axios from 'axios'
import { Drone } from './classes/droneClass'
import { Package } from './classes/packageClass'

// declare empty array to store drone objects
var drones = [];
// declare empty array to store package objects
var queuedPackages = [];
// declate empty array to store new package assignments
var assignments = [];
// delcare empty array to store unassignedPackages
var unassignedPackageIds = [];

var currentDrone = 0;
var analyse = false;

if (process.argv[2] == "analyse") analyse = true;

function getDrones() {

  // get drone data from api
  axios({
    method: 'get',
    url: 'https://codetest.kube.getswift.co/drones'
  }).then(res => {

    for (var drone of res.data) {

      // instantiate a new drone object
      const thisDrone = new Drone(drone.droneId,drone.location.latitude,drone.location.longitude);

      // if the drone already has a package onboard
      if (drone.packages.length > 0) {
        // create package object and assign it to the drone object
        const thisPackage = new Package(drone.packages[0].packageId,drone.packages[0].destination.latitude,drone.packages[0].destination.longitude,drone.packages[0].deadline);
        thisDrone.packages.push(thisPackage);
      }

      // calculate the distance to the depot
      thisDrone.calcDistanceToDepot();

      drones.push(thisDrone);

    }

    // load package data
    getPackages();

  }).catch(err => {
    console.log({ error: 100, error_msg: "There was an error loading Drone data from the API" });
  });
}

function getPackages() {

  // get package data from api
  axios({
    method: 'get',
    url: 'https://codetest.kube.getswift.co/packages'
  }).then(res => {

    // assign package data to Package class objects
    for (var pkg of res.data) {

      // instantiate a package object
      const thisPackage = new Package(pkg.packageId, pkg.destination.latitude, pkg.destination.longitude, pkg.deadline);

      // calculate the distance to this packages delivery location
      thisPackage.calcDeliveryDist();

      queuedPackages.push(thisPackage);
    }

    // now lets attempt to assign the packages to drones
    assignPackages();

  }).catch(err => {
    console.log({ error: 101, error_msg: "There was an error loading Package data from the API" });
  });
}

function assignPackages() {

  // sort queued packages ascending based on deadline so the packages
  // with the closest deadline are delivered first
  queuedPackages.sort((a,b) => {
      if (a.deadline < b.deadline) return -1;
      if (a.deadline > b.deadline) return 1;
      return 0;
  });

  // loop through the queued packages and attempt to assign them
  for (var pkg of queuedPackages) {

    // check that there is a drone available
    if (drones[currentDrone] != undefined) {

      // delivery time is time for drone to return to depot plus delivery time of package
      const deliveryTimeInSecs = drones[currentDrone].timeToDepot + pkg.deliveryTime;

      // convert UTC timestamp to date object
      const deadline = new Date((pkg.deadline * 1000));
      const currentTime = new Date();

      // calc estimated delivery time
      const estDeliveryTime = new Date(currentTime.getTime() + (deliveryTimeInSecs * 1000));

      // only assign the pacakge if the estimated delivery time is earlier than the deadline
      if (estDeliveryTime <= deadline) {

        // assign the next available drone to the current package
        const newAssigment = { droneId: drones[currentDrone].id, packageId: pkg.id }
        assignments.push(newAssigment);

        // move to the next available drone
        currentDrone++;

      } else {
        // if the package can't be delivered by deadline then add the package to the unasssigned list
        // and move onto the next package
        unassignedPackageIds.push(pkg.id);
      }
    } else {
      // if no drone is available then add the package to the unasssigned list
      unassignedPackageIds.push(pkg.id);
    }
  }

  // create result object
  const result = { assignments: assignments, unassignedPackageIds: unassignedPackageIds};

  // output the final result as JSON
  console.log(result);

  // if the analyse argument has been passed into npm run
  if (analyse) analyseData();

}

function analyseData() {

  var totalDroneToDepotTime = 0;
  var totalDeadline = 0;
  var totalDeliveryTime = 0;

  for (var drone of drones) {
    totalDroneToDepotTime+=drone.timeToDepot;
  }
  console.log("Total Drones: " + drones.length);
  console.log("Total Packages: " + queuedPackages.length);
  console.log("Total Assigned: " + assignments.length);
  console.log("Total Undeliverable: " + unassignedPackageIds.length);
  console.log("Avg Drone Time to Depot: " + Math.floor(totalDroneToDepotTime/drones.length/60) + " mins");

  for (var pkg of queuedPackages) {
    totalDeadline+=pkg.deadline;
    totalDeliveryTime+=pkg.deliveryTime;
  }

  const avg_deadline = new Date(totalDeadline/queuedPackages.length * 1000);
  const currentTime = new Date();
  console.log("Avg Delivery Time from Depot: " + Math.floor(totalDeliveryTime/queuedPackages.length/60) + " mins");
  console.log("Avg Deadline: " + Math.floor((avg_deadline - currentTime) / 60000) + " mins");
}

// start processing by getting drone data
getDrones();
