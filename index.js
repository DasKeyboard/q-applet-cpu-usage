// Library to track cpuUsage
const os = require('os-utils');

// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');

// Color associated to cpu activity from low (green) to high (red).
const colors = ['#00FF00', '#00FF00', '#00FF00', '#00FF00', '#FFFF00', '#FFFF00', '#FF0000',
  '#FF0000', '#FF0000', '#FF0000'
];

const logger = q.logger;


class CpuUsage extends q.DesktopApp {
  constructor() {
    super();
    // run every 3000 ms
    this.pollingInterval = 3000;
    logger.info("CPU Usage Meter ready to go!");
  }

  // call this function every pollingInterval
  async run() {
    return this.getCpuUsage().then(percent => {
      return new q.Signal({
        points: [this.generatePoints(percent)],
        name: "CPU Usage",
        message: Math.round(percent * 100) + "%",
        isMuted: true, // don't flash the Q button on each signal
      });
    });
  }

  async applyConfig() {
    let defaultColor = this.config.defaultColor;
    /* Throw an error if the color matches any color used to indicate cpu activity */
    if (colors.indexOf(defaultColor) > -1) {
      throw new Error(`The selected default color ${defaultColor} is a reserved color.`);
    }
  }

  async getCpuUsage() {
    return new Promise((resolve) => {
      os.cpuUsage(v => {
        resolve(v);
      })
    })
  }

  generatePoints(percent) {
    const numberOfKeys = 10;
    // multiply the cpu percentage by the number total of keys 
    const numberOfKeysToLight = Math.round(numberOfKeys * percent);
    let points = [];

    // create a list of points (zones) with a color). Each point 
    // correspond to an LED
    for (let i = 0; i < numberOfKeys; i++) {
      points.push(new q.Point(this.getColor(i, numberOfKeysToLight)));
    }

    return points;
  }

  /** get a color of a zone depending on it's index on the zone array */
  getColor(zoneIndex, numberOfKeysToLight) {
    if (zoneIndex >= numberOfKeysToLight) {
      // if the zone is after the number max of keys to light. Set the light to the selected default or turn it off
      // Black color = no light
      return this.config.defaultColor || '#000000';
    } else {
      // turn on the zone with the proper color
      return colors[zoneIndex];
    }
  }
}

module.exports = {
  CpuUsage: CpuUsage
};

const cpuUsage = new CpuUsage();
