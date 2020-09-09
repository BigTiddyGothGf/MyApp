/**
 * Socket Class.
 *
 * @class
 *
 */
class Socket{

    constructor(){

        AraDTIO.on('connection', async (socket) => {
            
            socket.on('join', (data) => {
                console.log('############## JOIN ALERT ####################');
                console.log(data);
                socket.join(data.channel.uid);
                socket.to(data.channel.uid).emit('alert', `${data.user.name} has joined the channel ${data.channel.name}!`);
            });

            socket.on('typing', async (data) => {
                socket.to(data.channel.uid).emit('typing', data.user.uid);
            });

            socket.on('messageOut', async (msgData) => {
                console.log('############## MSG OUT ####################');
                console.log(msgData);
                socket.to(msgData.channel.uid).emit('messageIn', msgData);
                this.addMessage(msgData);
            });

            socket.on('disconnect', function(data){
                console.log('############## DISCONNECT ALERT ####################');
                console.log(data);
            });
        });
    }

    addMessage = async (data) => {
        
        var msgData = {
            user: data.user,
            channel: data.channel,
            userId: data.user.uid,
            channelId: data.channel.uid,
            msg: data.msg,
            time: data.time
        }
        try {
            //add new Message
            await AraDTDatabase.storage.collection('messages')
                .add(msgData)
                .catch((error) => {
                    throw Error(error);
                });

        } catch(error) {
            console.log('############## SAVE MSG ERROR ####################');
            console.log(error);
        }
    }

}
module.exports = Socket;