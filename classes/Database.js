/**
 * Database Class.
 * 
 * Singleton class that stores Firebase Auth and Admin
 * functionality as well as credentials
 *
 * @class
 *
 */
class Database{

    /**
     * Database constructor. 
     * 
     * Calls Firebase and Firebase Admin modules
     * and loads credentials from JSON files.
     * Includes the folowing key class properties:
     *      this.firebase       -   for user Auth requests
     *      this.firebaseAdmin  -   for firestore collection requests
     * 
     * On subsequent instantiation calls, 
     * it always returns the initial class instance.
     */
    constructor(){
        
        // If class already instatiated, return the initial instance
        if (typeof this.instance === 'object') {
            return this.instance;
        }

        // Load Firebase modules and config files
        var firebase = require("firebase");   
        var firebaseConfig = require('./../firebase.json');
        var firebaseAdmin = require("firebase-admin");
        var firebaseAdminConfig = require('./../firebase.admin.json');

        // Instantiate key class properties
        this.firebase = firebase.initializeApp(firebaseConfig);
        this.firebaseAdmin = firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(firebaseAdminConfig),
            storageBucket: firebaseConfig.storageBucket,
        });
        this.storage = firebaseAdmin.firestore();
        this.bucket = firebaseAdmin.storage().bucket();

        // Store first instance, and return it
        this.instance = this;
        return this;
    }

}
module.exports = Database;