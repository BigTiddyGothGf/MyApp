// Add all required modules
var express = require('express');
var session = require('express-session');
var path = require('path');
var logger = require('morgan');
var fileUpload = require('express-fileupload');

/** 
 * Instantiate the Express app and 
 * assign it to a global variable
 * psuedo namespaced under AraDT
 */
AraDTApp = express();
AraDTApp.use(session({
    secret: 'hurrdurr',
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
AraDTApp.use(logger('dev'));
AraDTApp.use(express.json());
AraDTApp.use(express.urlencoded({ extended: false }));

// Assign static files directory
AraDTApp.use(express.static(path.join(__dirname, 'public')));

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
var UserModel = require('./models/UserModel');
AraDTUserModel = new UserModel();
var ChannelModel = require('./models/ChannelModel');
AraDTChannelModel = new ChannelModel();
var Router = require('./classes/Router');
AraDTRouter = new Router();

module.exports = AraDTApp;