const Token = require("../models/Token");

const jwt = require("jsonwebtoken");


exports.postToken = async(req,res) => {
    const { tokenExpo, tokenUser } = req.body.params;
    try {

    const findToken = await Token.find({token: tokenExpo});
    if(findToken.length > 0){
        return res.status(321).json({ message: "Token already exist" });
    }else{
    const token = tokenUser._j;

      // Save the token to MongoDB
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      const newToken = new Token({ token: tokenExpo, user: decoded.id });
      await newToken.save();
      res.status(200).send("Token saved successfully");
    }
    } catch (error) {
      console.error("Error saving token:", error);
      res.status(500).send("Failed to save token");
    }
}



exports.postTokenToFCM = async (req,res) => {
    const { comment, name } = req.body;
    const message = {
      message: {
        data: {
          title: "Hello, ",
          body: `${name} says: ${comment}`,
        },
      },
    };
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "key=your_server_key",
      },
      body: JSON.stringify(message),
    });
    const data = await response.json();
    if (data.success) {
      res.status(200).send("Message sent successfully");
      console.log("Message sent successfully");
    } else {
      res.status(500).send("Failed to send message");
      console.error("Error sending message:", data);
    }
}

exports.sendNotification = async (req, res) =>{
      // // API route to send push notification
//   app.post("/api/send-notification", async (req, res) => {});
  
    const { message, token } = req.body.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    console.log("api/send-notification", message);
    try {
      // Fetch all stored tokens from MongoDB
      const tokens = await Token.find({user:decoded.id});
  
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
}


