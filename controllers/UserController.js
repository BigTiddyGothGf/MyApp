/**
 * UserController Class.
 * 
 * Adds routing middleware for all user functionality.
 * Includes simple Facade methods for Firebase transactions
 * such as login and register.
 *
 * @class
 *
 */
class UserController{

    /**
     * Instantiates class, calls method to set required session variables 
     * for the user and assigns middleware to routes
     */
    constructor(){

        // Set current user variables before each request
        this.setVariables();

        // Add all routing middleware for user endpoints
        AraDTApp.post('/register', this.register);
        AraDTApp.post('/login', this.login);
        AraDTApp.get('/logout', this.logout);
        AraDTApp.get('/account', this.getAccount);
        AraDTApp.post('/account', this.updateAccount);
        AraDTApp.post('/password', this.updatePassword);
    }

    /**
     * Assigns middleware to add Firebase.auth().currentUser to
     * UserModel, request.session, and response.locals variables
     */
    setVariables(){
        AraDTApp.use(async function(request, response, next) {
            // Chesk if user logged in for this session
            if (request.session.token) {
                // We have a logged in user, so request user from Firebase
                var currentUser = await AraDTDatabase.firebase.auth().currentUser;
                if (currentUser != null) {
                    // User returned, so add to session and local variables
                    request.session.user = currentUser;
                    response.locals.user = request.session.user;
                    AraDTUserModel.setUser(currentUser);
                    response.locals.loggedin = true;
                    response.locals.user = currentUser;
                }
            }
            // Pass on to next middleware
            next();
        });
    }

    /**
     * Asynchronous function that handles post form submission to '/login'
     * On success, redirects to '/account'
     * Onfailure, redirects to '/' with error message
     * Requires the following POST form name fields:
     * 
     * @param {string}      request.body.email          email form field
     * @param {string}      request.body.password       password form field
     * 
     * @returns {Object}    response.redirect object
     */
    login = async (request, response) => {
        // Try to see if form submission is valid
        try{
            await AraDTUserModel.login(request, response)
                .then(() => {
                    // Login successful, so redirect to account
                    response.redirect('/account');
                }).catch((error) => {
                    // Firebase login has failed, so return Firebase errors
                    request.session.errors.login = [error.message];
                    response.redirect('/');
                });
        } catch(errors) {
            // Form has failed validation, so return errors
            request.session.errors.login = errors;
            response.redirect('/');
        }
    };


    /**
     * Asynchronous function that handles POST form submission to '/register'
     * On success, redirects to '/account'
     * Onfailure, redirects to '/' with error message
     * Requires the following POST form name fields:
     * 
     * @param {string}      request.body.email              email form field
     * @param {string}      request.body.password           password form field
     * @param {string}      request.body.passwordConfirm    passwordConfirm form field
     * 
     * @returns {Object}    response.redirect object
     */
    register = async (request, response) => {
        // Try to see if form submission is valid
        try{
            await AraDTUserModel.register(request, response)
                .then(() => {
                    // registration successful, so redirect to account
                    response.redirect('/account');
                }).catch((error) => {
                    // Firebase registration has failed, so return Firebase errors
                    request.session.errors.register = [error.message];
                    response.redirect('/');
                });
        } catch(errors) {
            // Form has failed validation, so return errors
            request.session.errors.register = errors;
            response.redirect('/');
        }
    };

    /* YOU NEED TO ADD COMMENTS FROM HERE ON */

    updateAccount =  async (request, response) => {

        var currentUser = AraDTUserModel.getCurrentUser();
        if (currentUser) {
            try{
                await AraDTUserModel.update(request, response)
                    .then(() => {
                        response.locals.errors.profile = ['Your details have been updated'];
                        response.render('account');
                    }).catch((error) => {
                        response.locals.errors.profile = [error.message];
                        response.render('account');
                    });
            } catch(errors) {
                response.locals.errors.profile = errors;
                response.render('account');
            }
        } else {
            this.logout(request, response);
        }

    };
    
    updatePassword = async (request, response) => {

        var currentUser = AraDTUserModel.getCurrentUser();
        if (currentUser) {
            try{
                await AraDTUserModel.updatePassword(request, response)
                    .then(() => {
                        response.locals.errors.password = ['Your password has been updated'];
                        response.render('account');
                    }).catch((error) => {
                        response.locals.errors.password = [error.message];
                        response.render('account');
                    });
            } catch(errors) {
                response.locals.errors.password = errors;
                response.render('account');
            }
        } else {
            this.logout(request, response);
        }

    };

    getAccount(request, response){
        
        if (!request.session.token) {
            response.redirect('/');
        }
        response.render('account');
    }

    logout = async (request, response) => {
        request.session.errors.general = ['You have been logged out'];
        response.locals.loggedin = false;
        request.session.destroy();
        await AraDTDatabase.firebase.auth().signOut().then(function() {
                response.redirect('/');
            }).catch(function(error) {
                response.redirect('/');
            });
    }

}
module.exports = UserController;