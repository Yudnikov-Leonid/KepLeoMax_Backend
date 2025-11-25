import OpenAI from "openai";
const openAi = new OpenAI();

export const ask = async (message, messages) => {
    try {
        const history = messages.map((msg) => ({
            role: msg.sender_id == process.env.CHAT_BOT_ID ? 'assistant' : 'user',
            content: msg.message,
        }));
        console.log(`history: ${JSON.stringify(history)}`);

        const chatCompletion = await openAi.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                ...history, { role: 'user', content: message }
            ],
        });

        console.log('answer from ai: ' + chatCompletion.choices[0].message.content);

        return chatCompletion.choices[0].message.content;
    } catch (e) {
        console.log(`AI ERROR: ${e}`);
        return 'Something went wrong...';
    }
}

