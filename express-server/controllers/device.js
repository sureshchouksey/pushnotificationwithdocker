let FCM = require('fcm-node');
let admin = require("firebase-admin");
let Device = require('../models/device');
let fs = require('fs')
  , Log = require('log')
  , log = new Log('debug', fs.createWriteStream('my.log'));


let serviceAccount = require("../opus-neo-firebase-adminsdk-c65n3-a3f2c53c2f.json");
let otherServiceAccout = require("../flopusneo-firebase-adminsdk-1b5iw-c9e958ac2c.json");
let defaultConfig = 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://opus-neo.firebaseio.com"
});

let otherAdminApp = admin.initializeApp({
  credential: admin.credential.cert(otherServiceAccout),
  databaseURL: "https://opus-neo.firebaseio.com"
},"Other");

// Get all
exports.getAll = (req, res) => {
  log.info('Request body of getAll Service',req);
  Device.find({}, (err, docs) => {
    if (err) { return log.error(err); }
    log.info("Search result of getAll Service", docs);
    res.json(docs);
  });
}

// Get by id
exports.get = (req, res) => {
  log.info('Request body of get Service',req);
  Device.find({ username: req.params.username, deviceId: req.params.deviceId }, (err, obj) => {
    if (err) { return log.error(err); }
    log.info("Search result of get Service", obj[0]);
    res.json(obj[0]);
  });
}

// Count all
exports.count = (req, res) => {
  Device.count((err, count) => {
    if (err) { return log.error(err); }
    res.json(count);
  });
}

// Insert
exports.insert = (req, res) => {
  var obj = new Device(req.body);
  obj.save((err, item) => {
    // 11000 is the code for duplicate key error
    if (err && err.code === 11000) {
      res.sendStatus(400);
    }
    if (err) {
      return log.error(err);
    }
    res.status(200).json(item);
  });
}

exports.update = (req, res) => {
  log.info('Request body of Registration Service',req.body);
  let query = { "username": req.body.username, "deviceId": req.body.deviceId };
  Device.findOneAndUpdate(query, req.body, { upsert: true }, (err) => {
    if (err) { return log.error(err); }
    log.info('New device successfully register for FCM');
    res.sendStatus(200);
  });
}

 //Delete by id
 exports.delete = (req, res) => {
     Device.remove({_id : req.params.id}, (err, result) => {
       res.json({ message: "Device successfully deleted!", result });
     });
   }

exports.deleteAll = (req, res) => {
  log.info('Request body of deleteAll Service',req);
  Device.remove({}, (err) => {
    if (err) { return log.error(err); }
    log.info('All device sucessfully deleted!');
    res.sendStatus(200);
  })
}

exports.searchDevice = (req, res) => {
  log.info('Request body of searchDevice Service',req);
  let searchDevice = req.body;
  Device.find(searchDevice, (err, docs) => {
    if (err) { return log.error(err); }
    log.info('Search result based on device',docs);
    res.json(docs);
  });
}

exports.SearchByUsers = (req, res) => {
  log.info('Request body of SearchByUsers Service',req);
  let userList = req.body.username;
  Device.find({ 'username': { $in: userList } }, (err, docs) => {
    log.info('Search result based on users',docs);
    res.json(docs);
  })
}

exports.sendMessage = (req, res) => {
  log.info('Request body of sendMessage Service',req);
  let objMsg = req.body;    
  Device.find({ username: objMsg.username, deviceId: objMsg.deviceId }, (err, obj) => {
    if (err) { return log.error(err); }
    let serverKey = obj[0].apiKey;
    let fcm = new FCM(serverKey);
    log.info("FCM ServerKey", serverKey);
    let message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
      to: obj[0].registrationToken,
      collapse_key: 'your_collapse_key',
      notification: objMsg.notification,
      data: {  //you can send only notification or only data(or include both) 
        my_key: 'my value',
        my_another_key: 'my another value'
      }
    };
    log.info("Input send to FCM", message);
    fcm.send(message, function (err, response) {
      if (err) {        
        log.error("Message not send", err);
      } else {        
        log.info("Successfully sent with response", response);
        res.json({ message: 'send message successfully!' });
      }
    });

  });
}

// Send message to multiple devices of multiple users
exports.sendToDevice = (req, res) => {
 
  log.info('Request body of sendToDevie Service',req);
  let userList = req.body.username;  
  let registrationTokens = [];  
  let payload = {
    notification: req.body.notification
  };

  Device.find({ 'username': { $in: userList } }, (err, obj) => {
    if (err) { return log.error(err); }
    registrationTokens = obj.map(a => a.registrationToken);
    let adminApp ={};
    if(req.body.packageName === 'opusNeo'){
      adminApp = admin;
    }
     if(req.body.packageName === 'opusNeoTwo'){
      adminApp = otherAdminApp;
    }
    // Send a message to the devices corresponding to the provided
    // registration tokens.
      log.info('registrationTokens:Input parameter of send messaging service in FCM',registrationTokens);
      log.info('payload:Input parameter of send messaging service in FCM',payload);        
      adminApp.messaging().sendToDevice(registrationTokens, payload)
      .then(function (response) {
        // See the MessagingDevicesResponse reference documentation for
        // the contents of response.
        log.info("Successfully sent message:", response);
        res.json(response);
      })
      .catch(function (error) {
        log.error("Error sending message:", error);
      });
  });
}

// Send message to multiple devices of multiple users with multiple notification in single Payload
exports.sendToDeviceWithMultipleNotification = (req, res) => {
  log.info('Request body of sendToDeviceWithMultipleNotification Service',req);
  let payLoadList = req.body;
  let responseList = [];
  payLoadList.forEach((item, index) => {    
    let payload = {
      notification: item.notification
    };
    Device.find({ 'username': { $in: item.username } }, (err, obj) => {
      if (err) { return log.error(err); }
      registrationTokens = obj.map(a => a.registrationToken);      
      // Send a message to the devices corresponding to the provided
      // registration tokens.
       let adminApp ={};
      if(item.packageName === 'opusNeo'){
        adminApp = admin;
      }
      if(item.packageName === 'opusNeoTwo'){
        adminApp = otherAdminApp;
      }
      log.info('registrationTokens:Input parameter of send messaging service in FCM',registrationTokens);
      log.info('payload:Input parameter of send messaging service in FCM',payload);        
      adminApp.messaging().sendToDevice(registrationTokens, payload)
        .then(function (response) {
          // See the MessagingDevicesResponse reference documentation for
          // the contents of response.
          responseList.push(response);          
          if (payLoadList.length == responseList.length) {
            log.info('responseList', responseList);
            res.json(responseList);
          }          
        })
        .catch(function (error) {
          log.error("Error sending message:", error);
        });
    });
  })

}


exports.subscribeToTopic = (req, res) => {
  log.info('Request body of subscribeToTopic Service',req);
  // Subscribe the device corresponding to the registration token to the
  // topic.    
  let topic = req.body.topic;
  let registrationToken = [];
  Device.find({ username: req.body.username }, (err, obj) => {
    if (err) { return log.error(err); }
    registrationToken = obj.map(a => a.registrationToken);    
    log.info('registrationToken:Input parameter of subscribeToTopic service in FCM',registrationToken);
    log.info('topic:Input parameter of subscribeToTopic service in FCM',topic);        
    admin.messaging().subscribeToTopic(registrationToken, topic)
      .then(function (response) {
        // See the MessagingTopicManagementResponse reference documentation
        // for the contents of response.
        res.json(response);
        log.info("Successfully subscribed to topic:", response);        
      })
      .catch(function (error) {
        log.error("Error subscribing to topic:", error);        
      });
  });

}

exports.sendForTopic = (req, res) => {
  log.info('Request body of sendForTopic Service',req);
  let topic = req.body.topic;
  let payload = {
    notification: req.body.notification
  };
  log.info('payload:Input parameter of sendToTopic service in FCM',payload);
  log.info('topic:Input parameter of sendToTopic service in FCM',topic);        
  admin.messaging().sendToTopic(topic, payload)
    .then(function (response) {
      // See the MessagingTopicResponse reference documentation for the
      // contents of response.
      res.sendStatus(200);
      log.info("Successfully sent message:", response);      
    })
    .catch(function (error) {
      log.error("Error sending message:", error);      
    });
}

exports.unsubscribeToTopic = (req, res) => {
  let topic = req.body.topic;
  let registrationToken = [];
  Device.find({ username: req.body.username }, (err, obj) => {
    if (err) { return log.error(err); }    
    registrationToken = obj.map(a => a.registrationToken);
    admin.messaging().unsubscribeFromTopic(registrationToken, topic)
      .then(function (response) {
        // See the MessagingTopicManagementResponse reference documentation
        // for the contents of response.
        log.info("Successfully unsubscribed from topic:", response);        
      })
      .catch(function (error) {
        log.error("Error unsubscribing from topic:", error);        
      });
  });
}

exports.readLogFile = (req,res)=>{
  let stream = fs.createReadStream(__dirname + '/my.log')
  , log = new Log('debug', stream);
  log.on('line', function(line){
    res.send(line);
  });
}


