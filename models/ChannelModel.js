/**
 * ChannelModel Class.
 * 
 * Singleton class that wraps Firebase methods for 
 * CRUD commands on channel docs
 *
 * @class
 *
 */
class ChannelModel{


    /**
     * Model constructor. 
     * 
     * On subsequent instantiation, returns initial class.
     */
    constructor(){
        
        // If class already instatiated, return the initial instance
        if (typeof this.instance === 'object') {
            return this.instance;
        }

        // assign class instance to this.instance
        this.instance = this;
        return this;
    }

    /**
     * readChannel method retrieves channel
     * also fetches all users and separates
     * members and non-members
     * 
     * @param {string} channelId channel to fetch from Firebase
     * 
     * @returns {Object} channel data
     */
    readChannel = async (channelId) => {

        //Fetch channel and see if it exists
        var channelDoc = AraDTDatabase.storage.collection('channels').doc(channelId);
        var editChannel = {};
        await channelDoc.get()
            .then((datum) => {
                if (!datum.exists) {
                    //Channel does not exist
                    throw new Error(['This channel does not exist']);
                } else {
                    //Get channel data
                    editChannel = this.getChannelData(datum);
                }
            })
            .catch((error) => {
                throw error;
            });

        //Create initial arrays of users who belong, and users who do not
        var inUsers = [];
        var outUsers = [];
        
        //Loop through all users and assign
        await AraDTUserModel.getUsers()
            .then((data) => {
                data.forEach((datum) => {
                    if (!AraDTValidator.isEmptyObj(editChannel.users) 
                        && editChannel.users.includes(datum.id)) {
                        inUsers.push({
                            id: datum.id,
                            name: datum.name,
                            image: datum.image,
                        });
                    } else {
                        outUsers.push({
                            id: datum.id,
                            name: datum.name,
                            image: datum.image,
                        });
                    }
                });
            })
            .catch(function(error) {
                throw new Error(error);
            });

        //return all user data
        return{
            editChannel,
            inUsers,
            outUsers
        }
    }

    /**
     * updateChannel method stores validated 
     * channel data to Firebase
     * 
     * @param {Object} request Express request object
     * @param {Object} response Express response object
     * 
     * @throws {Object} Error std error class
     */
    updateChannel = async (request, response) => {

        var channelId = request.params.channelId;
        
        try {
            //Build newly updated channel from request object
            var updatedChannel = await this.buildChannel(request);
    
            //Update channel
            var channelDoc = AraDTDatabase.storage.collection('channels').doc(channelId);
            await channelDoc.update(updatedChannel)
                .catch((error) => {
                    throw Error(error);
                });

        } catch(error) {
            throw error;
        }
    }

    /**
     * addChannel method stores validated 
     * channel data to Firebase as a new channel
     * 
     * @param {Object} request Express request object
     * @param {Object} response Express response object
     * 
     * @throws {Object} Error std error class
     */
    addChannel = async (request, response) => {
        
        try {
            //Build new channel from request object
            var newChannel = await this.buildChannel(request);
    
            //Update channel
            await AraDTDatabase.storage.collection('channels')
                .add(newChannel)
                .catch((error) => {
                    throw Error(error);
                });

        } catch(error) {
            throw error;
        }
    }


    /**
     * buildChannel method fetches validated 
     * channel data from POST request object
     * 
     * @param {Object} request Express request object
     * 
     * @throws {Object} Error std error class
     */
    buildChannel = async (request) => {
        
        var currentUser = await AraDTDatabase.firebase.auth().currentUser;
        var slugName = AraDTValidator.makeSlug(request.body.name);
        var image = '';
        var avatar = (request.files && request.files.avatar) ? request.files.avatar : false;
        var users = (request.body.users) ? request.body.users : {};
        
        if (avatar) {
            var { result, validExtension } = AraDTImageUpload.uploadImage(avatar, slugName);
            if (validExtension) {
                image = result;
            } else {
                throw Error(result.result);
            }
        } else if (request.body.avatar) {
            image = request.body.avatar;
        }

        var channelData = {
            owner: currentUser.uid,
            name: request.body.name,
            slug: slugName,
            image: image,
            users: users,
            createdAt: new Date().toISOString()
        }

        return channelData;
    }

    /**
     * channelId method deletes 
     * channel doc from Firebase
     * 
     * @param {String} channelId 
     * 
     */
    deleteChannel = async(channelId) => {

        var currentUser = await AraDTDatabase.firebase.auth().currentUser;
        var channelDoc = AraDTDatabase.storage.collection('channels').doc(channelId);
        await channelDoc.get()
            .then((datum) => {
                if (datum.data().owner == currentUser.uid) {
                    channelDoc.delete();
                    return ['This channel has been deleted'];
                } else {
                    throw new Error(['You do not have authorisation to delete this channel']);
                }
            })
            .catch(() => {
                throw new Error(['This channel does not exist']);
            });
    }

    /**
     * Gets all channels where 
     * the current user 
     * is the owner
     */
    getOwnedChannels = async () => {

        var currentUser = await AraDTDatabase.firebase.auth().currentUser;
        var channels = [];
        await AraDTDatabase.storage.collection('channels')
            .where('owner', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then((data) => {
                data.forEach((datum) => {
                    channels.push(this.getChannelData(datum));
                });
                if (channels.length == 0) {
                    channels = false;
                } else {
                    channels.sort((a, b) => (a.users.length < b.users.length) ? 1 : -1);
                }
            })
            .catch((error) => {
                //Gracefully ignore query error
                console.log('Error fetching channel data:' + error.message);
            });
        return channels;
    }

    /**
     * Gets all channels where 
     * the current user 
     * is a member
     */
    getSubscribedChannels = async () => {

        var currentUser = await AraDTDatabase.firebase.auth().currentUser;
        var channels = [];

        //Filter by channels containing user id
        await AraDTDatabase.storage.collection('channels')
            .where('users', 'array-contains', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then((data) => {
                data.forEach((datum) => {
                    channels.push(this.getChannelData(datum));
                });
                if (channels.length == 0) {
                    channels = false;
                } else {
                    channels.sort((a, b) => (a.users.length < b.users.length) ? 1 : -1);
                }
            })
            .catch((error) => {
                //Gracefully ignore query error
                console.log('Error fetching channel data:' + error.message);
            });
        return channels;
    }

    //Just fetches all channels
    getAllChannels = async () => {

        var channels = [];
        await AraDTDatabase.storage.collection('channels')
            .orderBy('createdAt', 'desc')
            .get()
            .then((data) => {
                data.forEach((datum) => {
                    channels.push(this.getChannelData(datum));
                });
                if (channels.length == 0) {
                    channels = false;
                } else {
                    channels.sort((a, b) => (a.users.length < b.users.length) ? 1 : -1);
                }
            })
            .catch((error) => {
                console.log('Error fetching channel data:' + error.message);
            });
        return channels;
    }

    //Build channel data object from Firebase object
    getChannelData(datum) {
        return {
            id: datum.id,
            slug: datum.data().slug,
            owner: datum.data().owner,
            name: datum.data().name,
            image: datum.data().image,
            users: datum.data().users,
            createdAt: datum.data().createdAt,
        }
    }
}
module.exports = ChannelModel;