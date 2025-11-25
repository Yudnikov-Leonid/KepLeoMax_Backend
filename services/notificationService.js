import admin from 'firebase-admin';
import { getMessaging } from "firebase-admin/messaging";

admin.initializeApp({
    credential: admin.credential.cert('./kepleomax-firebase-adminsdk.json')
});

export const sendNotification = async (user, title, body, externalData) => {
    const tokens = user.fcm_tokens;
    if (!tokens || tokens.length === 0) return;

    tokens.forEach((token) => {
        const message = {
            data: {
                ...externalData,
                title: title,
                body: body
            },
            // notification: {
            //     title: title,
            //     body: body
            // },
            token: token,
        };
        try {
            getMessaging()
                .send(message)
                .then((response) => {
                    console.log("Successfully sent message:", response);
                })
                .catch((error) => {
                    console.log("Error sending message:", error);
                });
        } catch (e) {
            console.log('failed to send notification to ' + token);
        }

    });
}