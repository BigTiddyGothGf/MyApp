// Add all required modules
var http = require('http');
var socketIo = require('socket.io');
var express = require('express');
var session = require('express-session');
var path = require('path');
var fileUpload = require('express-fileupload');

/** 
 * Instantiate the Express app and 
 * assign it to a global variable
 * psuedo namespaced under AraDT
 */
AraDTApp = express();
AraDTApp.use(session({
    secret: 'hodor',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Assign view directory and EJS template language
AraDTApp.set('views', path.join(__dirname, 'views'));
AraDTApp.set('view engine', 'ejs');

/** 
 * Add key middleware for:
 *      File uploads
 *      Console logging requests
 *      JSON parsing
 *      Request string parsing
 */ 
AraDTApp.use(fileUpload({createParentPath: true}));
AraDTApp.use(express.json());
AraDTApp.use(express.urlencoded({ extended: false }));

// Assign static files directory
AraDTApp.use(express.static(path.join(__dirname, 'public')));

AraDTApp.use('/socket', express.static('./node_modules/socket.io-client/dist'));

AraDTServer = http.createServer(AraDTApp);
AraDTIO = socketIo.listen(AraDTServer);

const PORT = process.env.PORT || 3000;
AraDTServer.listen(PORT);

/**
 * Add simple MVC framework including:
 *      Firebase database class
 *      Image uploader
 *      Data validator
 *      Key models
 *      A router
 * All are psuedo namespaced under AraDT
 */
var Database = require('./classes/Database'); 
AraDTDatabase = new Database(); 
var ImageUpload = require('./classes/ImageUpload');
AraDTImageUpload = new ImageUpload();
var Validator = require('./classes/Validator');
AraDTValidator = new Validator();
var Socket = require('./classes/Socket');
AraDTSocket = new Socket();
var ChannelModel = require('./models/ChannelModel');
AraDTChannelModel = new ChannelModel();
var UserModel = require('./models/UserModel');
AraDTUserModel = new UserModel();
var Router = require('./classes/Router');
AraDTRouter = new Router();

module.exports = AraDTApp;