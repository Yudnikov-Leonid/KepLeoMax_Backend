import * as messagesModel from '../models/messagesModel.js'

export const getMessagesByChatId = async (req, res) => {
    const userId = req.userId;
    const chatId = req.query.chatId;
    if (!chatId) {
        return res.status(400).json({ message: 'chatId param is required' });
    }

    const messages = await messagesModel.getAllMessagesByChatId(chatId, 1000, 0);
    messages.forEach(message => {
        message.is_current_user = message.sender_id === userId;
    });
    res.status(200).json({ data: messages });
}