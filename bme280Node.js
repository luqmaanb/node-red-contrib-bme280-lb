'use strict';

module.exports = function (RED) {
    const BME280 = require('bme280');

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

        const sensorInit = () => {
            node.sensor.init().then(function () {
                node.initialized = true;
                node.status({ fill: "green", shape: "dot", text: "BME280 Initialized." });
                node.log("BME280 Initialized.");
            }).catch(function (err) {
                node.status({ fill: "red", shape: "ring", text: "Initialization failed." });
                node.error("Initialization failed. ->" + err);
            });
        };

        const sensorReading = (msg) => {
          node.sensor.readSensorData()
            .then((data) => {
              msg.payload = data;
              node.send(msg);
              let temp = node.type + "[T :" + Math.round(data.temperature_C);
              node.status({ fill: "green", shape: "dot", text: temp + "Â°C]" });
            })
            .catch((err) => {
              node.status({ fill: "red", shape: "ring", text: "BME280 reading failed." });
              node.error("BME280 reading failed ->" + err);
            });
            return null;
        };

        // Init
        sensorInit();
        // trigger measure
        node.on('input', function (msg) {
            if (!node.initialized) {
                //try to reinit node until no sensor is found
                sensorInit();
                return null;
            }
            sensorReading(msg);
          });
    }
    RED.nodes.registerType("bme280", bme280);
};