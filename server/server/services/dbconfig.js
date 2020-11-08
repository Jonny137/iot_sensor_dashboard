const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = process.env.URI;

const client = new MongoClient(uri, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    }
);

let mongodb;
let config;

// Connect to the MongoDB cluster
function connect(callback) {
    client.connect(async (err) => {
        if (err) {
            return console.error(err)
        }
        console.log('Connected to the cluster!');
    
        mongodb = client.db('IotSensorData');
        config = await configCollection().findOne();
        callback();
    });
}

// Get collection with data acquired from the cloud
function dataCollection() {
    return mongodb.collection('sensorData');
}

// Get collection with data configuration for remodeling
function configCollection() {
    return mongodb.collection('config');
}

// Get collection with thresholds
function thresholdCollection() {
    return mongodb.collection('thresholds');
}

// Get collection with wake configurations
function wakeConfigCollection() {
    return mongodb.collection('wakeConfiguration');
}

// Get collection with user credenttials
function credentialsCollection() {
    return mongodb.collection('credentials');
}

// Close the connection with the MongoDB cluster
function close() {
    mongodb.close();
}

// Get the configuration collection method for modules outside this one
function getConfig() {
    return config;
}

// Get power consumption collection
function powerCollection() {
    return mongodb.collection('powerConsumptions');
}

// Get power consumption collection
function deviceCollection() {
    return mongodb.collection('devices');
}

module.exports = {
    connect,
    dataCollection,
    configCollection,
    thresholdCollection,
    wakeConfigCollection,
    close,
    getConfig,
    powerCollection,
    credentialsCollection,
    deviceCollection
};
