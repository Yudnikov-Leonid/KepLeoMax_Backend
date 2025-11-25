import { onMessage, onMessageToAi, onReadAll, onReadBeforeTime } from '../services/websocketService.js';

const webSocket = (io, socket) => {
    const userId = socket.userId;

    console.log(`user ${socket.id} with id ${userId} connected`);

    socket.join(userId.toString());

    socket.on('message', async (data) => { 
        onMessage(io, data, userId); 

        if (data.recipient_id == process.env.CHAT_BOT_ID) {
            onMessageToAi(io, data, userId);
        }
    }
    );

    socket.on('read_all', async (data) =>
        onReadAll(io, data, userId)
    );

    socket.on('read_before_time', async (data) =>
        onReadBeforeTime(io, data, userId)
    );

    socket.on('disconnect', () =>
        console.log(`user ${socket.id} with id ${userId} disconnected`)
    );
}

export default webSocket;