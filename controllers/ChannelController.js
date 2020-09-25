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
    }
    
    /**
     * Transfer variables from sessions to locals.
     */
    setVariables(){
        AraDTApp.use(async (request, response, next) => {
            response.locals.channel = {};
            await this.fetchChannelsData(request, response, next);
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
    
    addRoutes(){
        AraDTApp.get('/channels', this.fetchChannels);
        AraDTApp.get('/channel/:channelId', this.showChannel);
        AraDTApp.post('/channels/add', this.addChannel);
        AraDTApp.get('/channels/delete/:channelId', this.deleteChannel);
        AraDTApp.get('/channels/edit/:channelId', this.editChannel);
        AraDTApp.post('/channels/edit/:channelId', this.updateChannel);
    }

    showChannel = async (request, response, next) => {
        
        if (!request.session.token) {
           response.redirect('/');
        }

        var channelId = request.params.channelId;
        var errors = request.session.errors.channels;
        
        if (!channelId) {
            errors.general = ['You need to specify a channel'];
            response.redirect('/channels');
        }
        try {
            await this.fetchChannel(request, response, next);
            await this.fetchMessages(request, response, next);
        } catch(error) {
            console.log("################# Channel Error #####################");
            console.log(error);
            errors.general = error;
            response.redirect('/channels');
        }
        response.render('channel');
    }

    
    /**
     * Just gets all channels
     */
    fetchChannels = async (request, response, next) => {
        
        if (!request.session.token) {
           response.redirect('/');
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
        } else {
            await AraDTChannelModel.addChannel(request, response)
                .then(() => {
                    errors.general = ['Your channel has been created'];
                    response.redirect('/channels');
                })
                .catch((error) => {
                    errors.general = [error.message];
                    response.redirect('/channels');
                });
        }
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
    editChannel = async (request, response, next) => {
        
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
            await this.fetchChannel(request, response, next);
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
                    .then(async ()=>{
                        errors.edit = ['Your channel has been updated'];
                        await this.fetchChannel(request, response, next);
                    })
                    .catch((error) => {
                        errors.edit = [error.message];
                    });
            } catch(error) {
                errors.edit = [error.message];
            }
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
        var currentUser = request.session.user;

        if (!channelId) {
            errors.general = ['You need to specify a channel to delete'];
        } else {
            try{
                await AraDTChannelModel.deleteChannel(channelId, currentUser.uid)
                    .then(() => {
                        errors.general = ['Your channel has been deleted'];
                        response.redirect('/channels');
                    })
                    .catch((error) => {
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
    fetchChannelsData = async (request, response, next) => {
        var currentUser = request.session.user
        if (currentUser) {
            try{
                var users = await AraDTUserModel.getUsers();
                response.locals.channels.users = [];
                //Ugly work around to suit edit channel form.
                users.forEach((user) => {
                    if (currentUser.uid != user.uid) {
                        response.locals.channels.users.push({
                            id: user.uid,
                            name: user.displayName,
                            image: user.photoURL
                        });
                    }
                });
                response.locals.channels.subscribed  = await AraDTChannelModel.getSubscribedChannels(request);
                response.locals.channels.owned       = await AraDTChannelModel.getOwnedChannels(request);
                console.log("################# Subscribed Channels Data #####################");
                console.log(response.locals.channels.subscribed);
                console.log("################# Owned Channels Data #####################");
                console.log(response.locals.channels.owned);
                return;
            } catch(error) {
                throw error;
            }
        }
    }

    /**
     * Gets channel to be edited, including owned and subscribed
     * Also includes list of users excluding current user to allow 
     * adding of users in channel creation} request 
     */
    fetchChannel = async (request, response, next) => {
        try{
            var channelId = request.params.channelId;
            if (channelId) {
                response.locals.channel = await AraDTChannelModel.fetchChannel(channelId);
                
                console.log('############### fetchChannel Data ###########');
                console.log(response.locals.channel);
            }
            return;
        } catch(error) {
            throw error;
        }
    }

    /**
     * Gets messages to be displayed
     */
    fetchMessages = async (request, response, next) => {
        try{
            var channelId = request.params.channelId;
            var userId = request.session.user.uid
            if (channelId) {
                response.locals.messages = await AraDTChannelModel.fetchMessages(channelId, userId);
            }
            console.log("################# Message Data #####################");
            console.log(response.locals.messages);
            return;
        } catch(error) {
            throw error;
        }
    }

}
module.exports = ChannelController;