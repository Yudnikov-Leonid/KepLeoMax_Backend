import * as chatsModel from '../models/chatsModel.js';
import * as messagesModel from '../models/messagesModel.js';
import * as usersModel from '../models/usersModel.js';
import { sendNotification } from '../services/notificationService.js';
import { ask } from './aiService.js';

export const onReadBeforeTime = async (io, data, userId) => {
    const chatId = data.chat_id;
    const readMessages = await messagesModel.readMessages(chatId, userId, data.time);
    if (readMessages.length > 0) {
        const otherUserId = await chatsModel.getOtherUserId(userId, chatId);
        // TODO dry
        io.in([userId.toString()]).emit('read_messages', {
            chat_id: chatId,
            sender_id: readMessages[0].sender_id,
            is_current_user: readMessages[0].sender_id == userId,
            messages_ids: readMessages.map(obj => obj.id),
        });
        io.in([otherUserId.toString()]).emit('read_messages', {
            chat_id: chatId,
            sender_id: readMessages[0].sender_id,
            is_current_user: readMessages[0].sender_id == otherUserId,
            messages_ids: readMessages.map(obj => obj.id),
        });
    }
}

export const onReadAll = async (io, data, userId) => {
    data.time = null;
    await onReadBeforeTime(io, data, userId);
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

    let chatId;
    const chat = await chatsModel.getChatOfUsers([userId, otherUserId]);
    if (!chat) {
        console.log(`creating new chat between ${userId} and ${otherUserId}`);
        chatId = await chatsModel.createNewChat([userId, otherUserId]);
    } else {
        chatId = chat.id;
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
    const readMessages = await messagesModel.readMessages(chatId, userId);
    if (readMessages.length > 0) {
        /// TODO dry
        io.in([userId.toString()]).emit('read_messages', {
            chat_id: chatId,
            sender_id: readMessages[0].sender_id,
            is_current_user: readMessages[0].sender_id == userId,
            messages_ids: readMessages.map(obj => obj.id),
        });
        io.in([otherUserId.toString()]).emit('read_messages', {
            chat_id: chatId,
            sender_id: readMessages[0].sender_id,
            is_current_user: readMessages[0].sender_id == otherUserId,
            messages_ids: readMessages.map(obj => obj.id),
        });
    }

    // send notification
    const user = await usersModel.getUserById(userId);
    const otherUser = await usersModel.getUserById(otherUserId);
    sendNotification(otherUser.id, user.username, newMessage.message, {
        chat_id: chatId.toString(),
        type: 'new',
        ids: JSON.stringify([newMessage.id]),
    });
}