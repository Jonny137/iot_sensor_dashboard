const app = require('../server');
const controller = require('./controller');
const router = require('express').Router();

// Create single data entry received from device
app.post('/sensor_data', controller.createData);

// Get list of devices from IoT Core
app.get('/devices', controller.getDeviceList);

// Add new device
app.post('/add', controller.addDevice);

// Prepare newest data object based on requested IMEI
app.get('/configured/:name', controller.getParsedData);

// Receive new threshold values
app.patch('/thresholds', controller.setThresholds);

// Update wake configuration
app.patch('/wake', controller.updateWake);

// Get wake configurations for device
app.get('/wake/:name', controller.getWake);

// Get data history for chart display
app.get('/data', controller.getData);

// Restart device
app.post('/restart', controller.restartDevice);

// Get battery replacement date
app.get('/battery', controller.getBatteryEnd);

// Get latest time
app.get('/time', controller.getTime);

// Create account
app.post('/account', controller.createAccount);

// User login
app.post('/login', controller.userLogin);

// Check is token valid
app.get('/token', controller.validateToken);

module.exports = router;