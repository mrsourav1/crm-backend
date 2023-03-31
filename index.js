const express = require('express');
const mongoose = require('mongoose');
const route = require('./src/routes/route')
const cors = require("cors");
const app = express()
const NotifyToken = require('./src/models/notificationModel')

const cookieParser = require('cookie-parser')
app.use(express.json());
app.use(cookieParser())
mongoose.set('strictQuery', false);
const connection_url = "mongodb+srv://Sandeep2847:Sandeep123@cluster0.hqwrkkb.mongodb.net/?retryWrites=true&w=majority"
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));

mongoose.connect(connection_url, {
  useNewUrlParser: true
})
  .then(() => console.log("Database is connected"))
  .catch((err) => console.log(err))

app.use('/', route);

// notify

const FCM = require("fcm-node");
const uuid = require("uuid");

const SERVER_KEY = "AAAALDkNee0:APA91bEAX9la3rHCA9mBXNt3vdbl3KAlB3kKzQmPOb7c9uHnZH3wLXakeWt_tWB0gckCaIWqr_pE9JvqE6eMlX-y2Pe70Ia7Q6Mfnjkehqitw5PXYl_3g3DJRRjl6jNt54eWYR8K-U0g";

app.post("/fcm", (req, res, next) => {
  let fcm = new FCM(SERVER_KEY);
  console.log("req.body", req.body.token);

  try {
    const responses = [];
    for (let i of req.body.token) {
      let message = {
        to: i,
        notification: {
          title: "GoodWill Homz",
          body: "notify",
          sound: "default",
        },
        messageId: uuid.v4(), // generate a unique message ID
      };
      console.log("message.messageId:", message.messageId);
      fcm.send(message, (err, response) => {
        if (err) {
          next(err);
        } else {
          responses.push(response);
          console.log("myresponse", response);
          if (responses.length === req.body.length) {
            res.status(200).json({ status: true, message: "responses" });
          }
        }
      });
    }
  } catch (error) {
    next(error);
    res.status(500).json({ status: false, message: error });
  }
});


// add notification token to database
app.post('/add/notification/token', async (req, res) => {
  console.log("get token", req.body.token);
  let alreadyToken = await NotifyToken.findOne({ "email": req.body.email })
  if (alreadyToken) {
    return res.status(400).json({ status: false, message: "Already have a register token" })
  }
  try {
    let response = await NotifyToken.create(req.body)
    res.status(200).json({ status: true, message: response })
  } catch (error) {
    res.status(400).json({ status: false, message: error })
  }

})

// get all notification token
app.get("/get/allToken", async (req, res) => {
  try {
    let response = await NotifyToken.find()
    res.status(200).json({ status: true, message: response })

  } catch (error) {
    res.status(500).json({ status: false, message: error })

  }
})

// get single notification token
app.post("/single/notification/token", async (req, res) => {
  console.log("wqhjajehcxxh")
  let email = req.body.email;
  try {
    let response = await NotifyToken.findOne({ "email": email })
    if (response) { res.status(200).json({ status: true, message: response }) } else {
      res.status(500).json({ status: false, message: "invalid emailId" })

    }
  } catch (error) {
    res.status(500).json({ status: false, message: error })


  }
})

// notify
const server = app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
})



