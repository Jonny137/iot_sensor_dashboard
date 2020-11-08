const service = require('./services');

// Create data entry
const createData = async (req, res) => {    
    try {
        console.log(req.body);
        if (req.body.data) {
            await service.createSensorData(req.body.data, req.body.name);
            await service.addDevice(req.body.name);
            await service.setInitThreshold(req.body.name, req.body.data);
            await service.setInitWake(req.body.name);
            res.send('success');
        } else {
            res.status(400).json({
                status: 'User Error',
                message: 'Invalid input data format',
                payload: req.body
            });
        } 
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to create new data instance'
        });
    }
}

// Add new device
const addDevice = async(req, res) => {
    try {
        const result = await service.addDevice(req.body.name);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
           status: 'Internal Server Error',
           message: 'Unable to add new device'
       });
    }
}

// Get things from AWS IoT Core
const getDeviceList = async (req, res) => {
    try {
        const response = await service.getThings();
        res.send(response);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
           status: 'Internal Server Error',
           message: 'Unable to get list of devices'
       });
    }
}

// Get latest data formatted for front-end display
const getParsedData = async (req, res) => {
    try {
        const latest = await service.getLatestData(req.params.name);
        const result = await service.getDataByName(latest);
        res.send(result);
    } catch (error) {
         // ERROR 500
        console.error(error);
         res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get parsed data'
        });
    }
}

// Set new thresholds values
const setThresholds = async (req, res) => {
    try {
       await service.setThresholds(req.body);
       res.send('Updated Thresholds'); 
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to set threshold'
        });
    }
}

// Update wake configuration
const updateWake = async (req, res) => {
    try {
        const result = await service.updateWake(req.body);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to update wake'
        });
    }
}

// Get current wake configuration
const getWake = async (req, res) => {
    try {
        const result = await service.getWake(req.params.name);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get wake'
        });
    }
}

// Get data by requested device name for chart display and statistics
const getData = async (req, res) => {
    try {
        const result = await service.getData(
            req.query.name, 
            req.query.label,
            req.query.date_min,
            req.query.date_max
        );
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get data'
        });
    }
}

// Restart device with specified device name
const restartDevice = async (req, res) => {
    try {
        const result = await service.restartDevice(req.body);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal server error',
            message: 'Unable to send restart signal'
        });
    }
}

// Get battery replacement date for given device name
const getBatteryEnd = async (req, res) => {
    try {
        const result = await service.getBatteryEnd(req.query.name);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to battery expiration date'
        });
    }
}

// Get latest displayed time
const getTime = async (req, res) => {
    try {
        const result = await service.getTime(req.query.name);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get latest timestamp'
        });
    }   
}

// Create account
const createAccount = (req, res) => {
    try {
        service.createAccount(req.body);
        res.send('Account Created');
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to create user account'
        });
    } 
}

// User login handling
const userLogin = async (req, res) => {
    try {
        await service.userLogin(req.body, res);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Login failed'
        });
    } 
}

// Token validation method
const validateToken = async (req, res) => {
    try {
        const result = await service.validateToken(req.query.token);
        res.send(result);
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to validate token'
        });
    } 
}

module.exports = {
    createData,
    getDeviceList,
    getParsedData,
    setThresholds,
    updateWake,
    getWake,
    getData,
    restartDevice,
    getBatteryEnd,
    getTime,
    createAccount,
    userLogin,
    validateToken,
    addDevice
}