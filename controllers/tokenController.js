const Token = require("../models/Token");
const jwt = require("jsonwebtoken");

const { Expo } = require("expo-server-sdk");
const expo = new Expo();
// const admin = require("firebase-admin");
// const serviceAccount = require("../barber-demo-218de-firebase-adminsdk-fbsvc-190d9f7677.json");
// Initialize Firebase Admin SDK with service account credentials
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// const { google } = require("googleapis");
// const fetch = require("node-fetch");

// const admin = require("firebase-admin");
// const serviceAccount = require("../barber-demo-218de-firebase-adminsdk-fbsvc-190d9f7677.json");

// // Initialize the Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

exports.postToken = async (req, res) => {
 // API route to save FCM Token
  const { tokenExpo, tokenUser } = req.body.params;

  console.log("tokenExpo",tokenExpo)
  console.log("tokenUser",tokenUser)
  try {
    const token = tokenUser;
    console.log("token",token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // Save the token to MongoDB
    const newToken = new Token({ token: tokenExpo, user: decoded.id });
    await newToken.save();

    res.status(200).send("Token saved successfully");
    console.log("Token saved successfully");
  } catch (error) {
    console.error(error);
    console.error("Error saving token:", error);
    res.status(500).send("Failed to save token");
  }

};

exports.postTokenToFCM = async (req, res) => {
  const projectId = "barber-demo-218de"; // Replace with your actual Firebase project ID
  const { comment, name } = req.body;

  // const message = {
  //   message: {
  //     token: 'DEVICE_FCM_TOKEN', // The FCM token for the device you want to send the message to
  //     notification: {
  //       title: 'Hello',
  //       body: 'This is a message from Firebase!',
  //     },
  //   },
  // };
  // Create OAuth2 client using the Firebase service account
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.fromJSON(serviceAccount);

  // Function to get the OAuth 2.0 Access Token
  const accessToken = async function getAccessToken() {
    try {
      // Get the access token from the OAuth2 client
      const accessTokenValue = await oauth2Client.getAccessToken();
      console.log("Access Token:", accessTokenValue.token);
      return accessTokenValue.token; // You can use this token for your FCM v1 API requests
    } catch (error) {
      console.error("Error getting access token:", error);
    }
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Use OAuth2 token here
      },
      body: JSON.stringify(message),
    }
  );
  const data = await response.json();
  if (data.success) {
    res.status(200).send("Message sent successfully");
    console.log("Message sent successfully");
  } else {
    res.status(500).send("Failed to send message");
    console.error("Error sending message:", data);
  }
};

exports.sendNotification = async (req, res) => {
  // // API route to send push notification
  //   app.post("/api/send-notification", async (req, res) => {});

  const { message, token } = req.body.params;
  console.log("token",token);

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  console.log("decoded+++",decoded);

  try {
    // Fetch all stored tokens from MongoDB
    const tokens = await Token.find({ user: decoded.id });

    // Prepare push notifications payload for each token
    let messages = [];


    for (let token of tokens) {
      if (Expo.isExpoPushToken(token.token)) {
        messages.push({
          to: token.token, // Expo push token
          sound: "default",
          body: message,
        });
      } else {
        console.log(`Invalid Expo push token: ${token.token}`);
      }
    }
    console.log("api/send-notification tokens++", messages);

    if (messages.length > 0) {
      // Send notifications through Expo's service
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error(error);
        }
      }

      console.log("Push notifications sent:", tickets);
      res.status(200).send("Notification sent successfully");
    } else {
      res.status(400).send("No valid Expo tokens found");
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send("Failed to send notification");
  }
};
