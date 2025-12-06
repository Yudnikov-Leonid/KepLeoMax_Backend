import admin from 'firebase-admin';
import { getMessaging } from "firebase-admin/messaging";
import * as fcmModel from '../models/fcmModel.js';

admin.initializeApp({
    credential: admin.credential.cert('./kepleomax-firebase-adminsdk.json')
});

export const sendNotification = async (userId, title, body, externalData) => {
    const tokens = await fcmModel.getAllTokensByUserId(userId);
    if (!tokens || tokens.length === 0) return;
    tokens.push({user_id: 34343, fcm_token: 'gfdgfdg'});

    tokens.forEach((token) => {
        const message = {
            /// should be in data, not in notification to right handling background notifications
            data: {
                ...externalData,
                title: title,
                body: body
            },
            token: token.fcm_token,
        };
        getMessaging()
            .send(message)
            .then((response) => {
                console.log("Successfully sent message:", response, 'token:', token);
            })
            .catch((error) => {
                console.log("Error sending message:", error);
                if (error.errorCode == "messaging/registration-token-not-registered") {
                    fcmModel.deleteFCMToken(token);
                }
            });
    });
}