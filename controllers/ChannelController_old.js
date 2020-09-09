/**
 * ChannelController Class.
 * 
 * Adds routing middleware for all channel functionality.
 *
 * @class ChannelController
 *
 */
class ChannelController{

    constructor(){
        this.setVariables();
        AraDTApp.get('/channels', this.fetchChannels);
        AraDTApp.get('/channel/:channelId', this.showChannel);
        AraDTApp.post('/channels/add', this.addChannel);
        AraDTApp.get('/channels/delete/:channelId', this.deleteChannel);
        AraDTApp.get('/channels/edit/:channelId', this.readChannel);
        AraDTApp.post('/channels/edit/:channelId', this.updateChannel);
    }
    
    /**
     * Transfer variables from sessions to locals.
     */
    setVariables(){
        AraDTApp.use(async (request, response, next) => {
            response.locals.channels = {};
            if (!response.locals.errors){
                response.locals.errors = {};
            }
            if (!request.session.errors.channels){
                request.session.errors.channels = {};
            }
            if (!response.locals.errors.channels){
                response.locals.errors.channels = {};
            }
            next();
        });
    }

    // Ignore this :-)
    showChannel = async (request, response, next) => {
        next();
    }

    
    /**
     * Just gets all channels
     */
    fetchChannels = async (request, response, next) => {
        
        if (!request.session.token) {
           response.redirect('/');
        }
        
        try{
            await this.fetchChannelData(request, response, next);
            await this.fetchEditChannelData(request, response, next);
        } catch(error) {
            response.locals.errors.general = [error.message];
        }

        response.render('channels');
    };

    /**
     * Accepts POST request:
     * Your form should have this:
     *      action="/channels/add" 
     *      method="post" 
     *      enctype="multipart/form-data"
     * 
     * Also these fields:
     *      name
     *      users
     *      files.avatar
     * 
     */
    addChannel = async (request, response, next) => {
        if (!request.session.token) {
            response.redirect('/');
        }
        
        var errors = request.session.errors.channels;
        if (AraDTValidator.isEmpty(request.body.name)) {
            errors.general = ['You need to add a channel name'];
            response.redirect('/channels');
        }
        await AraDTChannelModel.addChannel(request, response)
            .then(() => {
                errors.general = ['Your channel has been created'];
                response.redirect('/channels');
            })
            .catch((error) => {
                errors.general = [error.message];
                response.redirect('/channels');
            });
    };

    /**
     * Fetchs data for the channel you wish to edit:
     * 
     *      all users                                   =   locals.channels.users
     *      channels this user created                  =   locals.channels.owned
     *      channels this user is added to              =   locals.channels.subscribed
     *      the channel data to be edited               =   locals.channels.editChannel
     *      the users that belong to this channel       =   locals.channels.inUsers
     *      the users that don't belong to this channel =   locals.channels.outUsers
     * 
     */
    readChannel = async (request, response, next) => {
        
        if (!request.session.token) {
            response.redirect('/');
        }

        var channelId = request.params.channelId;
        var errors = request.session.errors.channels;
        
        if (!channelId) {
            errors.general = ['You need to specify a channel to edit'];
            response.redirect('/channels');
        }
        try{
            await this.fetchChannelData(request, response, next);
            await this.fetchEditChannelData(request, response, next);
        } catch(error) {
            errors.general = [error.message];
            response.redirect('/channels');
        }
        response.render('channel-edit');
    };

    /**
     * Accepts POST request:
     * Your form should have this:
     *      action="/channels/edit/<%= editChannel.id %>"
     *      method="post" 
     *      enctype="multipart/form-data"
     * 
     * Also these fields:
     *      name
     *      users
     *      files.avatar
     * 
     */
    updateChannel = async (request, response, next) => {

        if (!request.session.token) {
            response.redirect('/');
        }

        var channelId = request.params.channelId;
        var errors = response.locals.errors.channels;

        if (AraDTValidator.isEmpty(request.body.name)) {
            errors.edit = ['You need to specify a name'];
        } else {
            try{
                await AraDTChannelModel.updateChannel(request, response)
                    .then(()=>{
                        errors.edit = ['Your channel has been updated'];
                    })
                    .catch((error) => {
                        errors.edit = [error.message];
                    });
            } catch(error) {
                errors.edit = [error.message];
            }
        }
        try{
            await this.fetchChannelData(request, response, next);
            await this.fetchEditChannelData(request, response, next);
        } catch(error) {
            errors.edit = [error];
        }
        response.render('channel-edit');
    };

    /**
     * Pretty obvious - it does what it says on the box :-)
     * Needs the following type of request:
     * '/channels/delete/:channelId'
     * 
     */
    deleteChannel = async (request, response, next) => {
        
        if (!request.session.token) {
            response.redirect('/');
        }
        
        var errors = request.session.errors.channels;
        errors.general = [];
        var channelId = request.params.channelId;

        if (!channelId) {
            errors.general = ['You need to specify a channel to delete'];
        } else {
            try{
                await AraDTChannelModel.deleteChannel(channelId)
                    .then(() => {
                        errors.general = ['Your channel has been deleted'];
                        response.redirect('/channels');
                    })
                    .catch(() => {
                        errors.general = ['There was a problem deleting your channel'];
                        response.redirect('/channels');
                    });
            } catch(errors) {
                errors.general = ['There was a problem deleting your channel'];
            }
        }
        response.redirect('/channels');
    }

    /**
     * Gets channels, including owned and subscribed
     * Also includes list of users excluding current user to allow 
     * adding of users in channel creation} request 
     */
    fetchChannelData = async (request, response, next) => {
        try{
            var channelData         = response.locals.channels;
            var currentUser         = await AraDTDatabase.firebase.auth().currentUser;
            channelData.users       = await AraDTUserModel.getUsers(currentUser.uid);
            channelData.subscribed  = await AraDTChannelModel.getSubscribedChannels();
            channelData.owned       = await AraDTChannelModel.getOwnedChannels();
            return;
        } catch(error) {
            throw error;
        }
    }


    /**
     * Gets channel to be edited, including owned and subscribed
     * Also includes list of users excluding current user to allow 
     * adding of users in channel creation} request 
     */
    fetchEditChannelData = async (request, response, next) => {
        try{
            var channelData             = response.locals.channels;
            var channelId               = request.params.channelId;
            if (channelId) {
                channelData.editChannel = await AraDTChannelModel.readChannel(channelId);
            }
            return;
        } catch(error) {
            throw error;
        }
    }

}
module.exports = ChannelController;