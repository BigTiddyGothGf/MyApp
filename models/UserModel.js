/**
 * UserModel Class.
 * 
 * Singleton class that wraps Firebase methods for 
 * Auth users, such as signInWithEmailAndPassword()
 *
 * @class
 *
 */
class UserModel{

    /**
     * Model constructor. 
     * 
     * Assigns empty values for current user.
     * On subsequent instantiation, returns initial class.
     */
    constructor(){
        
        // If class already instatiated, return the initial instance
        if (typeof this.instance === 'object') {
            return this.instance;
        }

        // Set CurrentUser values to false
        this.id = false;
        this.currentUser = false;
        this.isLoggedIn = false;

        // assign class instance to this.instance
        this.instance = this;
        return this;
    }

    /**
     * Called in UserController before any routing to assign Firebase User to Model
     * Also called after user update
     * 
     * @param {Object}      currentUser     Firebase.auth().currentUser
     */
    setUser(currentUser){
        this.id = currentUser.uid;
        this.currentUser = currentUser;
        this.isLoggedIn = true;
    }

    /**
     * Return current user uid
     * 
     * @return {string}     currentUser.uid
     */
    getId() {
        return this.id;
    }

    /**
     * Return current Firebase user
     * 
     * @return {Object}     Firebase.auth().currentUser
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Asynchronous function that wraps 
     * Firebase.auth().signInWithEmailAndPassword()
     * On success, adds user to session
     * On failure, throws error to calling method
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @throws {Error}
     */
    login = async (request, response) => {

        // Extract form data from request
        var user = {
            email: request.body.email,
            password: request.body.password
        }
        // Check is email is valid and password is over 6 chars
        var { valid, errors } = AraDTValidator.loginValid(user);
    
        if (!valid) {
            // Validation failed, so return errors
            throw new Error(errors);
        } else {
            // Firebase email and password login call
            await AraDTDatabase.firebase.auth()
                .signInWithEmailAndPassword(user.email, user.password)
                .then((data) => {
                    // Promise to return token for the next stage
                    return data.user.getIdToken();
                })
                .then((token) => {
                    // Call suceeded, so store user token in session
                    request.session.token = token;
                    response.locals.loggedin = true;
                })
                .catch((error) => {
                    // Throw login error from Firebase to calling method
                    throw new Error(error);
                })
        }
    };

    /**
     * Asynchronous function that wraps 
     * Firebase.auth().createUserWithEmailAndPassword()
     * On success, adds user to session
     * On failure, throws error to calling method
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @throws {Error}
     */
    register = async (request, response) => {
        
        // Extract form data from request
        var user = {
            email: request.body.email,
            password: request.body.password,
            passwordConfirm: request.body.passwordConfirm
        }

        /*
         * Check is email is valid and 
         * password is over 6 chars 
         * and matches passwordConfirm
         */
        var { valid, errors } = AraDTValidator.registerValid(user);

        if (!valid) {
            // Validation failed, so return errors
            throw new Error(errors);
        } else {
            // Firebase email and password registration call
            await AraDTDatabase.firebase.auth()
                .createUserWithEmailAndPassword(user.email, user.password)
                .then((data) => {
                    // Promise to return token for the next stage
                    return data.user.getIdToken();
                })
                .then((token) => {
                    // Call suceeded, so store user token in session
                    request.session.token = token;
                    response.locals.loggedin = true;
                })
                .catch((error) => {
                    // Throw error from Firebase to calling method
                    throw new Error(error);
                });
        }
    };

    /**
     * Asynchronous function that wraps Firebase.auth().updateProfile()
     * On success, adds updated user to session
     * On failure, throws error to calling method
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @throws {Error}
     */
    update =  async (request, response) => {

        // Extract form data from request
        var upDatedUser = {
            email: request.body.email,
            displayName: request.body.displayName
        }
        // Check is email is valid and the user has a display name
        var { valid, errors } = AraDTValidator.updateUserValid(upDatedUser);

        if (!valid) {
            // Validation failed, so return errors
            throw new Error(errors);
        } else {
            // If form includes new avatar, upload this
            if (request.files) {
                upDatedUser.photoURL = this.updateAvatar(request, response);
            }
            // Firebase profile update call
            await this.currentUser.updateProfile(upDatedUser)
                .then(function() {
                    var currentUser = AraDTDatabase.firebase.auth().currentUser;
                    if (currentUser != null) {
                        // Update succeeded, so update UserModel, session, and local variables
                        AraDTUserModel.setUser(currentUser);
                        request.session.user = currentUser;
                        response.locals.user = request.session.user;
                        request.session.save();
                    }
                })
                .catch(function(error) {
                    // Throw error from Firebase to calling method
                    throw new Error(error);
                });
        }
    };
    

    /**
     * Asynchronous function that wraps Firebase.auth().updatePassword()
     * On failure, throws error to calling method
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @throws {Error}
     */
    updatePassword = async (request, response) => {

        // Extract form data from request
        var user = {
            password: request.body.password,
            passwordConfirm: request.body.passwordConfirm
        }
        
        // Check password is over 6 chars and matches passwordConfirm
        var { valid, errors } = AraDTValidator.updatePasswordValid(user);

        if (!valid) {
            // Validation failed, so return errors
            throw new Error(errors);
        } else {
            // Firebase password update call
            await this.currentUser.updatePassword(user.password)
                .catch((error) => {
                    throw new Error(error);
                });
        }        

    };

    /**
     * Simple middleware that destroys session and local variables
     * and redirects user to hoome page
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @returns {Object}    response.redirect call
     */
    logout = async (request, response) => {
        request.session.errors.general = ['You have been logged out'];
        response.locals.loggedin = false;
        request.session.destroy();
        await AraDTDatabase.firebase.auth().signOut()
            .then(function() {
                response.redirect('/');
            })
            .catch(function(error) {
                response.redirect('/');
            });
    }

    /**
     * Simple middleware that checks user is logged in, 
     * then renders ./views/account.ejs.
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @returns {Object}    response.render call
     */
    getAccount(request, response){
        
        if (!request.session.token) {
            response.redirect('/');
        }
        response.render('account');
    }
    
    /**
     * Uses ImageUpload class to check if filetype is allowed
     * then saves avatar to '/public/img/userid.ext'
     * 
     * @param {Object}      request       Express request object
     * @param {Object}      response      Express response object
     * 
     * @throws {Error}
     * 
     * @returns {Object}    response.render call
     */
    updateAvatar(request, response){
        
        var { result, validExtension } = AraDTImageUpload.uploadImage(request.files.avatar, AraDTUserModel.getId());
        if (validExtension) {
            return result;
        } else {
            // Upload failed, so throw error
            throw new Error(result);
        }

    };

    
    /**
     * Gets all users from Firebase
     * 
     * @param {String}     currentUserId        Option to exclude user from returned list
     * 
     * @returns {Array}    array of all registered users
     */
    getUsers = async(currentUserId = false) => {
        var users = [];
        await AraDTDatabase.firebaseAdmin.auth().listUsers()
            .then((data) => {
                // Add users to the array
                data.users.forEach((datum) => {
                    //Exclude current user if passed to getUsers request
                    if (!currentUserId ||
                        datum.uid != currentUserId) {
                            users.push({
                                id: datum.uid,
                                name: datum.displayName,
                                image: datum.photoURL,
                            });
                    }
                });
                if (users.length == 0) {
                    users = false;
                }
            })
            .catch(function(error) {
                //Do not throw error, just log the issue
                console.log('Error fetching user data:', error);
            });
        return users;
    }

}
module.exports = UserModel;