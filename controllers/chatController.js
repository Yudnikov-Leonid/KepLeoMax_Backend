import * as chatsModel from '../models/chatsModel.js'
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from '../utills/convertUser.js';
import * as messagesModel from '../models/messagesModel.js'

// TODO refactor
export const getChat = async (req, res) => {
    const userId = req.userId;
    const chatId = req.query.chatId;
    if (!chatId) {
        return res.status(400).json({ message: 'chatId param is required' });
    }
    const chat = await chatsModel.getChatById(chatId);
    if (!chat) {
        return res.status(404).json({ message: `chat with id ${chatId} not found` });
    }
    console.log(`getChat, userId: ${userId}, user_ids: ${chat.user_ids}`);
    if (!chat.user_ids.includes(userId)) {
        return res.status(403).json({ message: `can't get alien chat` });
    }

    const otherUserId = chat.user_ids.filter(id => id != userId)[0];
    const user = await usersModel.getUserById(otherUserId);
    chat.user_ids = undefined;
    chat.other_user = convertUserToSend(user, req);
    const lastMessage = (await messagesModel.getAllMessagesByChatId(chat.id, 1, 0))[0];
    if (lastMessage) {
        const user = await usersModel.getUserById(lastMessage.sender_id);
        lastMessage.user = convertUserToSend(user, req);
        chat.last_message = lastMessage;
        if (lastMessage.sender_id === userId) {
            chat.unread_count = 0;
        } else {
            const unreadMessages = await messagesModel.getUnreadMessages(chat.id);
            chat.unread_count = unreadMessages.length;
        }
    } else {
        chat.last_message = null;
        chat.unread_count = 0;
    }
    return res.status(200).json({ data: chat });
}

export const getChats = async (req, res) => {
    const userId = req.userId;

    const chats = await chatsModel.getAllChatsByUserId(userId);
    for (let i = 0; i < chats.length; i++) {
        const otherUserId = chats[i].user_ids.filter(id => id != userId)[0];
        const user = await usersModel.getUserById(otherUserId);
        chats[i].user_ids = undefined;
        chats[i].other_user = convertUserToSend(user, req);
        const lastMessage = (await messagesModel.getAllMessagesByChatId(chats[i].id, 1, 0))[0];
        if (lastMessage) {
            const user = await usersModel.getUserById(lastMessage.sender_id);
            lastMessage.user = convertUserToSend(user, req);
            chats[i].last_message = lastMessage;
            if (lastMessage.sender_id === userId) {
                chats[i].unread_count = 0;
            } else {
                const unreadMessages = await messagesModel.getUnreadMessages(chats[i].id);
                chats[i].unread_count = unreadMessages.length;
            }
        } else {
            chats[i].last_message = null;
            chats[i].unread_count = 0;
        }
    }
    chats.sort((a, b) => (b.last_message?.created_at ?? 0) - (a.last_message?.created_at ?? 0));
    return res.status(200).json({ data: chats });
}

// doesn't return lastMessage and unread_count
export const getChatWithUser = async (req, res) => {
    const userId = req.userId;
    const otherUserId = req.query.userId;
    if (!otherUserId) {
        return res.status(400).json({ message: 'otherUserId param is required' });
    }

    const chat = await chatsModel.getChatOfUsers([userId, otherUserId]);
    if (!chat) {
        return res.status(404).json({ message: `chat with user ${otherUserId} not found` });
    } else {
        const user = await usersModel.getUserById(otherUserId);
        chat.user_ids = undefined;
        chat.other_user = convertUserToSend(user, req);
        chat.unread_count = 0;
        return res.status(200).json({ data: chat });
    }
}