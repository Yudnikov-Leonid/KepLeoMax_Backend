import * as messagesModel from '../models/messagesModel.js'

export const getMessagesByChatId = async (req, res) => {
    const userId = req.userId;
    const chatId = req.query.chatId?.trim();
    const limit = req.query.limit?.trim() ?? 1000;
    const cursor = req.query.cursor?.trim();

    // validataions
    if (!chatId) {
        return res.status(400).json({ message: 'chatId param is required' });
    } else if (isNaN(chatId)) {
        return res.status(400).json({ message: 'chatId must be int' });
    } else if (isNaN(limit)) {
        return res.status(400).json({ message: 'limit must be int' });
    } else if (cursor && isNaN(cursor)) {
        return res.status(400).json({ message: 'offset must be int' });
    }

    // get messages
    const messages = await messagesModel.getAllMessagesByChatId(chatId, limit, cursor);
    messages.forEach(message => {
        message.is_current_user = message.sender_id === userId;
    });
    
    res.status(200).json({ data: messages, limit: limit, cursor: cursor });
}