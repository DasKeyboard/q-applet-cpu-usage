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
      this.deleteOldSignals();

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

  /**
   * Delete all previous signals
   */
  async deleteOldSignals() {
    // delete the previous signals
    while (this.signalLog && this.signalLog.length) {
      const signal = this.signalLog.pop().signal;
      logger.debug(`Deleting previous signal: ${signal.id}`)
      await q.Signal.delete(signal).catch(error => {
        logger.error(`Error deleting signal ${signal.id}: ${error}`);
      });

      logger.debug(`Deleted the signal: ${signal.id}`);
    }
  }

  generatePoints(percent) {
    // multiply the cpu percentage by the number total of keys 
    const numberOfKeysToLight = Math.round(this.getWidth() * percent);
    let points = [];

    // create a list of points (zones) with a color). Each point 
    // correspond to an LED
    for (let i = 0; i < numberOfKeysToLight; i++) {
      points.push(new q.Point(this.getColor(i)));
    }

    return points;
  }

  /** get a color of a zone depending on it's index on the zone array */
  getColor(zoneIndex) {
    if (zoneIndex >= colors.length) {
      // if the zone is after the number max of keys to light. Turn off the light
      // Black color = no light
      return this.config.defaultColor || '#000000';
    } else {
      // turn on the zone with the proper color
      return colors[zoneIndex];
    }
  }

  async shutdown() {
    await this.deleteOldSignals();
    await super.shutdown();    
  }
}

module.exports = {
  CpuUsage: CpuUsage
};

const cpuUsage = new CpuUsage();