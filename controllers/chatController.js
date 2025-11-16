import * as chatsModel from '../models/chatsModel.js'
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from '../utills/convertUser.js';
import * as messagesModel from '../models/messagesModel.js'

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
    if (!chat.user_ids.includes(userId)) {
        return res.status(403).json({ message: `can't get someone else's chat` });
    }

    const otherUserId = chat.user_ids.filter(id => id != userId)[0];
    const user = await usersModel.getUserById(otherUserId);
    chat.user_ids = undefined;
    chat.other_user = convertUserToSend(user, req);
    const lastMessage = (await messagesModel.getAllMessagesByChatId(chat.id, 1, 0))[0];
    if (lastMessage) {
        lastMessage.is_current_user = lastMessage.sender_id === userId;
        chat.last_message = lastMessage;
    } else {
        chat.last_message = null;
    }
    return res.status(200).json({data: chat});
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
            const isCurrentUser = lastMessage.sender_id === userId;
            lastMessage.is_current_user = isCurrentUser;
            chats[i].last_message = lastMessage;
            if (isCurrentUser) {
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
    //chats.sort((a, b) => (b.lastMessage?.created_at ?? 0) - (a.lastMessage?.created_at ?? 0));
    return res.status(200).json({ data: chats });
}

// doesn't return lastMessage 
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
        return res.status(200).json({ data: chat });
    }
}