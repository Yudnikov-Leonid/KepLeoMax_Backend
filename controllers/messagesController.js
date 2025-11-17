import * as messagesModel from '../models/messagesModel.js'

export const getMessagesByChatId = async (req, res) => {
    const userId = req.userId;
    const chatId = req.query.chatId;
    if (!chatId) {
        return res.status(400).json({ message: 'chatId param is required' });
    }

    const limit = req.query.limit ?? 1000;
    const offset = req.query.offset ?? 0;

    const messages = await messagesModel.getAllMessagesByChatId(chatId, limit, offset);
    messages.forEach(message => {
        message.is_current_user = message.sender_id === userId;
    });
    res.status(200).json({ data: messages });
}