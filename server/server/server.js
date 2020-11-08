// Configuration of express app
const express = require('express');
const db = require('./services/dbconfig');
const cors = require('cors');
const app = express();

// CORS handler
app.use(cors());

// Port definition
app.set('port', process.env.PORT || 8080);
app.use(express.json());

// Database configuration
require('./services/dbconfig');

module.exports = app;

// Routes configuration
require('./api/routes');

db.connect(() => {
  app.listen(app.get('port'), () => {
    console.log('Server is running on port:', app.get('port'));
  });
});
