'use strict'

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Import dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    // express http server
    app = express().use(bodyParser.json());

// sets up server port
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// client for postgres
const { Client } = require('pg');

// set up postgres client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Get the message array. Will only ever contain one message
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            // maybe use this in database??
            console.log('Sender PSID: ' + sender_psid);
        
            // Check if the event is message or postback, use appropriate
            // handler
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
                databaseTest();
            } else {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });
        
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns '404 Not Found' if event is not from a subscription
        res.sendStatus(404);
    }

});

// GET request
app.get('/webhook', (req, res) => {

    // verify token
    let VERIFY_TOKEN = "Xfgh642u7s"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// test the database
function databaseTest() {
    client.connect();

    client.query('SELECT * FROM reminders;', (err, res) => {
        // if (err) throw err;
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }

        client.end();
    });
}

// Checks for immediate STASH request
function checkStash(received_message) {

    if (received_message.text) {

        toks = received_message.text.split();

        if (toks[0] == 'STASH') {
            console.log("stashing");
        }
    }
}
// Handles message events
function handleMessage(sender_psid, received_message) {
    
    let response;

    //Check for text
    if (received_message.text) {
        // Create payload for a basic text reply
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "Would you like to stash or view?",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Stash",
                            "payload": "stash"
                        },
                        {
                            "type": "postback",
                            "title": "View",
                            "payload": "view",
                        }
                    ]
                }
            }
        }
    // Send the response
    callSendAPI(sender_psid, response);
    
    }    
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set response based on postback payload
    if (payload === "stash") {
        response = {"text": "Stashing!"}
    } else if (payload == "view") {
        response = {"text": "View selected"}
    }

    // Send message back
    callSendAPI(sender_psid, response);
}

// Sends response method via the Send API
function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri":"https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body 
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error('Unable to send message:' + err);
        }
    });
}
