'use strict';

/**
 * Wraps the bme280 driver in node-red wrapper
 * @param  {} RED node-red wrapper
 */
module.exports = function (RED) {
    const BME280 = require('bme280');
    /**
     * This function creates the node and corresponding to html file
     * @param  {} n links variables from html files
     */
    function bme280(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.bus = parseInt(n.bus);
        node.addr = parseInt(n.address, 16);
        node.topic = n.topic || "";
        node.initialized = false;

        // init the sensor
        node.status({ fill: "grey", shape: "ring", text: "Initializing BME280..." });
        node.log("Initializing on bus" + node.bus + " addr:" + node.addr);
        const i2cSettings = {
          i2cBusNo   : node.bus,
          i2cAddress : node.addr
        };

        node.sensor = new BME280(i2cSettings);

        /**
         * Initialize bme280
         */
        const sensorInit = () => {
            node.sensor.init().then(function () {
                node.initialized = true;
                node.status({ fill: "green", shape: "dot", text: "BME280 Initialized." }); // show green dot on node if successful
                node.log("BME280 Initialized.");
            }).catch(function (err) {
                node.status({ fill: "red", shape: "ring", text: "Initialization failed." }); // show red ring on node if unsuccessful
                node.error("Initialization failed. ->" + err);
            });
        };
        /**
         * Get readings from bme280
         * @param  {object} msg payload object containing the data
         */
        const sensorReading = (msg) => {
          node.sensor.readSensorData()
            .then((data) => {
              msg.payload = data;
              node.send(msg); // send the payload
              let temp = node.type + "[T :" + Math.round(data.temperature_C);
              node.status({ fill: "green", shape: "dot", text: temp + "°C]" }); // display the temperature at the node
            })
            .catch((err) => {
              node.status({ fill: "red", shape: "ring", text: "BME280 reading failed." }); // display error message at the node
              node.error("BME280 reading failed ->" + err);
            });
            return null;
        };

        // initialize sensor
        sensorInit();

        /**
         * @param  {} 'input' the node an input for trigger measures
         * @param  {object} msg payload object containing data
         */
        node.on('input', function (msg) {
            if (!node.initialized) {
                // repeat initialization if failed
                sensorInit();
                return null;
            }
            sensorReading(msg);
          });
    }

    // register the node
    RED.nodes.registerType("bme280", bme280);
};