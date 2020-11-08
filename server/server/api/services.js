const db = require('../services/dbconfig');
const hash = require('../utils/hash');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const handlebars = require('handlebars');
const request = require('request');
const fs = require('fs');

// Create new sensor data instance in database
function createSensorData(data, name) {
    try {
        if (data) {
            data['Cell'] = {
                CID: data.CID,
                MCC: data.MCC,
                MNC: data.MNC,
            };
        
            data.Time = new Date(data.Time);
            data.Temp = parseFloat((data.Temp / 10).toFixed(1));
            data.Hum = parseFloat((data.Hum / 10).toFixed(1));
            data.Bat = (data.Bat / 1000).toFixed(2);

            delete data.MNC;
            delete data.CID;
            delete data.MCC;

            return db.dataCollection().insertOne({data: data, name: name});
        }
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to add data to database'
        });
    }
}
                          
// Method for creating inital thresholds collection based on non-existing IMEI
async function setInitThreshold(name, data) {
    try {
        const res = await db.thresholdCollection().findOne({name: name});
        if (!res) {
            /* 
                Insert default thresholds if passed device name is not present 
                in thresholds collection 
            */ 
            return db.thresholdCollection().insertOne({
                name: name,
                Lum: {
                    min: 0,
                    max: 120000,
                    disabledMin: false,
                    disabledMax: false
                },
                Temp: {
                    min: -10,   
                    max: 70,
                    disabledMin: false,
                    disabledMax: false
                },
                Hum: {
                    min: 0,
                    max: 100,
                    disabledMin: false,
                    disabledMax: false
                }
            });
        /*
            If device name is present check for thresholds crossing 
            and send user alarm e-mail 
        */ 
        } 
        else {
            // Tamper switch check
            if (data.Tam === 1) {
                sendAlarm({
                    type: 'tamper', 
                    time: data.Time,
                    CID: data.Cell.CID, 
                    name: name
                });
            } 
            // Luminosity sensor check
            if (data.Lum) {
                if (!res.Lum.disabledMax && data.Lum > res.Lum.max) {
                    sendAlarm({
                        type: 'max', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: 'lux',
                        param: 'Luminosity',
                        value: data.Lum,
                        threshold: res.Lum.max
                    });
                } else if (!res.Lum.disabledMin && data.Lum < res.Lum.min) {
                    sendAlarm({
                        type: 'min', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: 'lux',
                        param: 'Luminosity',
                        value: data.Lum,
                        threshold: res.Lum.max
                    });
                }
            }
            // Temperature sensor check
            if (data.Temp) {
                if (!res.Temp.disabledMax && data.Temp > res.Temp.max) {
                    sendAlarm({
                        type: 'max', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: '°C',
                        param: 'Temperature',
                        value: data.Temp,
                        threshold: res.Temp.max
                    });
                } else if (!res.Temp.disabledMin && data.Temp < res.Temp.min) {
                    sendAlarm({
                        type: 'min', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: '°C',
                        param: 'Temperature',
                        value: data.Temp,
                        threshold: res.Temp.max
                    });
                }
            }
            // Humidity sensor check
            if (data.Hum) {
                if (!res.Hum.disabledMax && data.Hum > res.Hum.max) {
                    sendAlarm({
                        type: 'max', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: '%',
                        param: 'Humidity',
                        value: data.Hum,
                        threshold: res.Hum.max
                    });
                } else if (!res.Hum.disabledMin && data.Hum < res.Hum.min) {
                    sendAlarm({
                        type: 'min', 
                        time: data.Time, 
                        name: name,
                        CID: data.Cell.CID,
                        unit: '%',
                        param: 'Humidity',
                        value: data.Hum,
                        threshold: res.Hum.max
                    });
                }
            }     
        }
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to set initial threshold'
        });
    }
}

// Add device method
async function addDevice(name) {
    try {
        const middle = await db.deviceCollection().findOne({name: name});
        if (middle) {
            return {};
        } else {
            return db.deviceCollection().inserOne({name: name});
        }
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to add new device'
        });
    }
}

// Initial wake configuration method
async function setInitWake(name) {
    try {
        const res = await db.wakeConfigCollection().findOne({name: name});
        if (!res) {
            return db.wakeConfigCollection().insertOne({
                name: name,
                // wake: 3600
                wake: 120              
            });
        }
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to set initial wake'
        });
    }
}

// Fetches the things from AWS IoT Core
async function getThings() {
    try {
        let result = [];

        const middle = await db.deviceCollection()
                        .find({}, {sort: {"name": 1}})
                        .toArray();
        if (middle.length !== 0) {
            middle.forEach(element => {
                result.push(element['name']);
            });
        }
    
        return result;
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Failed to fetch device list'
        });
    }
}

// Get latest sensor readings by date
function getLatestData(data) {
    try {
        return db.dataCollection().findOne(
            {"name": data}, 
            {sort: {"data.Time": -1}
        });
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get latest data'
        });
    }
}

// Format data structure to be passed to front-end
async function getDataByName(sensorData) {
    try {
        const config = db.getConfig();
        let thresholds;
        
        // Check if data is existent in thresholds database
        try {
            thresholds = await db.thresholdCollection().findOne(
                {"name": sensorData.name}
            );
        } catch (error) {
            return {};
        }
        
        // Format the data for UI preview
        const result = Object.keys(config)
            .filter(key => Object.keys(sensorData.data).includes(key))
            .reduce((obj, key) => {
                obj[key] = {...config[key]};
                obj[key].value = sensorData.data[key];
                obj[key].name = key;
                if (key === 'Bat') {
                    obj[key].charge = parseInt(62.5 * obj[key].value - 125);
                }
                if (obj[key].threshold) {
                    obj[key].threshold.value = thresholds[key];
                }
                return obj;
            }, {});

        return {[sensorData.name]: result};
    } catch (error) {
        // ERROR 500
        console.error(error);
        res.status(500).json({
            status: 'Internal Server Error',
            message: 'Unable to get data by given name'
        });
    }
}

// Update thresholds for given IMEI
function setThresholds(device) {
    return db.thresholdCollection().findOneAndUpdate(
        {name: device.name}, 
        {'$set': device}
    );
}

// Update wake configuration for given device name
async function updateWake(data) {
    const current = await db.wakeConfigCollection().findOne({name: data.name});
    
    request.post({
        url: process.env.POST_URL,
        form: {
            name: data.name,
            data: `{"Refresh": ${data.wake}}`,
            cacheStatus: true,
            cacheTime: current.wake,
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        }
    });

    const upData = {
        name: data.name,
        wake: data.wake
    };
    
    await db.wakeConfigCollection().findOneAndUpdate(
        {name: data.name}, 
        {'$set': upData}
    );

    return {"name": data.name, "wake": data.wake}
}

// Get wake configuration for specified IMEI
function getWake(name) {
    return db.wakeConfigCollection().findOne({name: name});
}

// Get device data for specified IMEI
async function getData(name, label, dateMin, dateMax) {
    const param = `data.${label}`;
    let query = {};

    // Prepare query for specific sensor
    switch(param) {
        case 'data.Temp':
            query = {'name': name, 'data.Temp': {'$gte': -10, '$lte': 85}};
            break;
        case 'data.Lum':
            query = {'name': name, 'data.Lum': {'$gte': 0, '$lte': 120000}};
            break;
        case 'data.Hum':
            query = {'name': name, 'data.Hum': {'$gte': 0, '$lte': 100}};
            break;
        default:
            query = {'name': name};
    }

    // Handle date filtering options
    if (dateMin && dateMax) {
        query['data.Time'] = {
            '$gte': new Date(dateMin), 
            '$lte': new Date(dateMax)
        };
    } else if (dateMin) {
        query['data.Time'] = {
            '$gte': new Date(dateMin)
        };
    } else if (dateMax) {
        query['data.Time'] = {
            '$gte': new Date('2000-01-01T12:00:00.000+00:00Z'), 
            '$lte': new Date(dateMax)
        };
    } else {
        query['data.Time'] = {
            '$gte': new Date('2000-01-01T12:00:00.000+00:00Z')
        };
    }

    // Chart data
    const result = await db.dataCollection().find(
        query, 
        {sort: {"data.Time": 1}}
    ).project({"_id": 0, "data.Time": 1, [param]: 1}).toArray();

    // Find minimal, maximal and average value for specified parameter (label)
    const max = await db.dataCollection().find(query, {sort: {[param]: -1}})
                                        .project({"_id": 0, [param]: 1})
                                        .toArray();
    const min = await db.dataCollection().find(query, {sort: {[param]: 1}})
                                        .project({"_id": 0, [param]: 1})
                                        .toArray();

    // Mean value calculation
    let mean = 0;
    result.forEach(data => {
        // Escape conditional for string representations of data value
        if (typeof(data.data[label]) === 'string') {
            const floatValue = parseFloat(data.data[label]);
            mean += floatValue;
        } else {
            mean += data.data[label];
        }
    });
    mean /= result.length;

    // Empty data handling
    if (result === undefined || result.length == 0) {
        return {
            data: undefined,
            min: undefined,
            max: undefined,
            mean: undefined
        }
    }

    return {
        data: result.map(value => value.data), 
        min: min.map(value => value.data)[0][label], 
        max: max.map(value => value.data)[0][label], 
        mean: mean.toFixed(1)
    };
}

// Restart module with given IMEI
async function restartDevice(data) {
    request.post({
        url: process.env.POST_URL,
        form: {
            name: data.name,
            data: `{"Restart": 1}`,
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        }
    });

    return {name: data.name, Res: 'True'}
}

// Template function to read HTML and send alarm mail
const readTemplate = function (path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};

// Send notification email on triggered alarm
function sendAlarm(data) {
    // Configure email parameters - TEST SERVICE PROVIDER
    const transport = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: 
        {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    });

    // Configure email parameters - REAL MAIL SERVER
    //   let transport = nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //         user: process.env.GMAIL_PASS,
    //         pass: process.env.GMAIL_USER
    //     }
    // });

    // Email content parsing
    let mailContent;
    if (data.type === 'max') {
        const path = './server/static/maxTemplate.html';
        readTemplate(path, function(err, html) {
            const template = handlebars.compile(html);

            const replacements = {
                name: data.name, 
                time: data.time,
                CID: data.CID,
                param: data.param,
                value: data.value,
                unit: data.unit,
                threshold: data.threshold
            }

            mailContent = template(replacements);

            // Message parameter formatter
            const message = {
                from: process.env.IOT_MAIL, // Sender address
                to: process.env.GMAIL_USER, // List of recipients
                subject: `IoT Dashboard Alarm Message`, // Subject line
                html: mailContent
            };

            // E-mail send API
            transport.sendMail(message, function(err) {
                if (err) {
                    console.error(err);
                }
            });
        });
    } else if (data.type === 'min') {
        const path = './server/static/minTemplate.html';
        readTemplate(path, function(err, html) {
            const template = handlebars.compile(html);

            const replacements = {
                name: data.name, 
                time: data.time,
                CID: data.CID,
                param: data.param,
                value: data.value,
                unit: data.unit,
                threshold: data.threshold
            }

            mailContent = template(replacements);

            // Message parameter formatter
            const message = {
                from: process.env.IOT_MAIL, // Sender address
                to: process.env.GMAIL_USER, // List of recipients
                subject: `IoT Dashboard Alarm Message`, // Subject line
                html: mailContent
            };

            // E-mail send API
            transport.sendMail(message, function(err) {
                if (err) {
                    console.error(err);
                }
            });
        });
    } else if (data.type === 'tamper') {
        const path = './server/static/tamperTemplate.html';
        readTemplate(path, function(err, html) {
            const template = handlebars.compile(html);

            const replacements = {
                name: data.name, 
                time: data.time,
                CID: data.CID
            }

            mailContent = template(replacements);

            // Message parameter formatter
            const message = {
                from: process.env.IOT_MAIL, // Sender address
                to: process.env.GMAIL_USER, // List of recipients
                subject: `IoT Dashboard Alarm Message`, // Subject line
                html: mailContent
            };

            // E-mail send API
            transport.sendMail(message, function(err) {
                if (err) {
                    console.error(err);
                }
            });
        });
    } else {
        return;
    }
}

// Expected battery end of life date
async function getBatteryEnd(name) {
    // Get current wake
    const currentWake = await db.wakeConfigCollection().findOne({name: name});

    // Get battery voltage
    const battery = await db.dataCollection().findOne(
        {"name": name}, 
        {sort: {"data.Time": -1}}
    );

    if (!battery) {
        return '';
    };

    // Calculate battery charge
    const currentCharge = parseInt(62.5 * parseFloat(battery.data.Bat) - 125);

    // Get power consuption for provided wake configuration
    const powerConsumption = await db.powerCollection().findOne(
        {cycle: currentWake.wake}
    );
    const power = powerConsumption.power;
    const Ncycle = powerConsumption.period;

    // Calculate remaining battery days
    const endDays = parseInt((currentCharge / 100 * 3600) / (Ncycle * power));
    let endDate = battery.data.Time;

    // Setup date format for sending to UI front-end
    endDate.setDate(endDate.getDate() + endDays);

    let dd = String(endDate.getDate());
    dd.length === 1 ? dd = '0' + dd : dd;
    let mm = String(endDate.getMonth() + 1);
    mm.length === 1 ? mm = '0' + mm : mm;
    const y = endDate.getFullYear();

    return dd + '-'+ mm + '-'+ y;
}

// Latest time for displayed data
async function getTime(name) {
    // Get current latest time from data payload
    const result = await db.dataCollection().find(
        {"name": name}, 
        {sort: {"data.Time": -1}}
        ).project({"_id": 0, "data.Time": 1}).toArray();
    
    let timestamp;
    try {
        // Format time into date format for sending to UI front-end
        timestamp = result[0].data['Time'];
    } catch {
        return '';
    }
    
    let day = String(timestamp.getDate());
    day.length === 1 ? day = '0' + day : day;
    let month = String(timestamp.getMonth() + 1);
    month.length === 1 ? month = '0' + month : month;
    const year = timestamp.getFullYear();
    let hour = String(timestamp.getHours());
    hour.length === 1 ? hour = '0' + hour : hour;
    let min = String(timestamp.getMinutes());
    min.length === 1 ? min = '0' + min : min;
    let sec = String(timestamp.getSeconds());
    sec.length === 1 ? sec = '0' + sec : sec;
    
    return `${day}-${month}-${year} ${hour}:${min}:${sec}`;
}

// Create account
function createAccount(credentials) {
    hash.cryptPassword(credentials.password, async (err, hash) => {
        if (err) {
            return;
        }
        credentials.password = hash;
        credentials['token'] = null;
        credentials['tokenExpires'] = null;
        await db.credentialsCollection().insertOne(credentials);
    });
}

// User login
async function userLogin(login, res) {
    // Get credentials for provided login data
    const user = await db.credentialsCollection().findOne(
        {'username': login.username}
    );

    // If user does not exists send error message
    if (!user) {
        res.status(400).json({
            status: 'User Error',
            message: 'Invalid credentials'
        });
        return;
    }

    // Compare provided and found passwords
    hash.comparePassword(login.password, user.password, async (err, match) => {
        if (err || !match) {
            res.status(400).json({
                status: 'User Error',
                message: 'Invalid credentials'
            });
            return;
        }

        // If token exists and it's not exipred, prolong it
        if (user.token && user.tokenExpires >= new Date()) {
            user.tokenExpires.setDate(new Date().getDate() + 1);
            await db.credentialsCollection().findOneAndUpdate(
                {'username': user.username}, 
                {'$set': {'tokenExpires': user.tokenExpires}}
            );
            res.send(user.token);
        // If token does not exist or it's expired, provide a new one refreshed
        } else {
            token = jwt.sign(
                { userId: user.username },
                'RANDOM_TOKEN_SECRET',
                { expiresIn: '24h' });
            user.token = token;

            const date = new Date();
            date.setDate(date.getDate() + 1);
            user.tokenExpires = date;

            // Update the credentials for user
            await db.credentialsCollection().findOneAndUpdate(
                {'username': user.username}, 
                {'$set': user}
            );
            res.send(token);
        }
    });
}

// Validate token on login
async function validateToken(token) {
    const user = await db.credentialsCollection().findOne({'token': token});

    if (!user) {
        return false;
    }

    return user.tokenExpires >= new Date();
}

module.exports = {
    createSensorData,
    setInitThreshold,
    setInitWake,
    getLatestData,
    getDataByName,
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
    getThings,
    addDevice
}