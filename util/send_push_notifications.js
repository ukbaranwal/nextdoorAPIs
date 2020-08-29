const firebaseAdmin = require('firebase-admin');
const serviceAccount = require("../nextdoorpartner-firebase-adminsdk-5jxie-43c8f08a8d.json");

exports.initializeFirebaseApp = () => {
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
        databaseURL: "https://nextdoorpartner.firebaseio.com"
    });
};

exports.sendPushNotification = (registrationToken, title, body, image, data) => {
    message = {
        notification: {
            title: title,
            body: body,
        },
        data: data,
        android: {
            ttl: 360 * 1000,
            notification: {
                image: image,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
        },
        apns: {
            payload: {
                aps: {
                    badge: 42,
                },
            },
        },
        token: registrationToken
    };
    firebaseAdmin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
};

