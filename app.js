"use strict";
exports.__esModule = true;
/// <reference path="./typings/index.d.ts" />

require('dotenv-extended').load();
const restify = require("restify");
const connector = require("./bot/bot").connector;
const jiraOAuth = require("./bot/bot").jiraOAuth;

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, process.env.WEB_HOSTNAME, () => {
    console.log('listening to %s', server.url);
});
// Listen for messages from users 
server.post('/api/bot/messages', connector.listen());
server.get("/api/jira/callback", jiraOAuth.callback);
server.get("/api/jira/tokenRequest", jiraOAuth.requestToken);
server.get("/", (req, res) => { res.send({ hello: 'world' }); });