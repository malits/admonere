'use strict'

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Import dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    // express http server
    app = express().use(bodyParser.json());

// sets up server port
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

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

// Handles message events
function handleMessage(sender_psid, received_message) {
    console.log(received_message)
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response method via the Send API
function callSendAPI(sender_psid, response) {

}
