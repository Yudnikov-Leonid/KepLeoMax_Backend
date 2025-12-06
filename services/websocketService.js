import * as chatsModel from '../models/chatsModel.js';
import * as messagesModel from '../models/messagesModel.js';
import * as usersModel from '../models/usersModel.js';
import { sendNotification } from '../services/notificationService.js';
import { ask } from './aiService.js';

export const onReadBeforeTime = async (io, data, userId) => {
    const chatId = data.chat_id;
    const readMessagesIds = await messagesModel.readMessages(chatId, userId, data.time);
    if (readMessagesIds.length > 0) {
        const chat = await chatsModel.getChatById(chatId);
        const otherUserId = chat.user_ids.filter(id => id != userId)[0];
        io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
    }
}

export const onReadAll = async (io, data, userId) => {
    const chatId = data.chat_id;
    const readMessagesIds = await messagesModel.readMessages(chatId, userId);
    if (readMessagesIds.length > 0) {
        const chat = await chatsModel.getChatById(chatId);
        const otherUserId = chat.user_ids.filter(id => id != userId)[0];
        io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
    }
}

export const onMessageToAi = async (io, data, userId) => {
    const message = data.message;
    if (!message) {
        console.log('WSError: otherUserId or message is missing');
        return;
    }

    /// todo optimize
    const chat = await chatsModel.getChatOfUsers([userId, process.env.CHAT_BOT_ID]);
    var messages;
    if (!chat) {
        messages = [];
    } else {
        messages = (await messagesModel.getAllMessagesByChatId(chat.id, 50, 0))
    }
    const answer = await ask(message, messages.reverse());
    const newData = {
        recipient_id: userId,
        message: answer
    };
    onMessage(io, newData, Number(process.env.CHAT_BOT_ID));
}

export const onMessage = async (io, data, userId) => {
    const otherUserId = data.recipient_id;
    const message = data.message;
    if (!otherUserId || !message) {
        console.log('WSError: otherUserId or message is missing');
        return;
    }

    let chatId = await chatsModel.getChatId([userId, otherUserId]);
    if (!chatId) {
        console.log(`creating new chat between ${userId} and ${otherUserId}`);
        chatId = await chatsModel.createNewChat([userId, otherUserId]);
    }
    console.log(`chat id: ${chatId}, userId: ${userId}, otherUserId: ${otherUserId}`);
    const messageId = await messagesModel.createNewMessage(chatId, userId, message);
    const newMessage = await messagesModel.getMessageById(messageId);

    newMessage.is_current_user = true;
    newMessage.other_user_id = otherUserId;
    io.in(userId.toString()).emit('new_message', newMessage);
    newMessage.is_current_user = false;
    newMessage.other_user_id = Number(userId);
    io.in(otherUserId.toString()).emit('new_message', newMessage);
    console.log(`new message ${message} emitet to ${userId}, ${otherUserId}`);

    // read messages
    const readMessagesIds = await messagesModel.readMessages(chatId, userId);
    if (readMessagesIds.length > 0) {
        io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
    }

    // send notification
    const user = await usersModel.getUserById(userId);
    const otherUser = await usersModel.getUserById(otherUserId);
    sendNotification(otherUser.id, user.username, newMessage.message, { chat_id: chatId.toString(), type: 'new', ids: JSON.stringify([newMessage.id]) });
}