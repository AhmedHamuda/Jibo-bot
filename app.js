"use strict";
exports.__esModule = true;
/// <reference path="./typings/index.d.ts" />

require('dotenv-extended').load();
const restify = require("restify");
const sessions = require("client-sessions");
const connector = require("./bot/bot");
const jiraOAuth = require("./jira_oauth");

let server = restify.createServer();
server.use(restify.bodyParser());
server.use(sessions({
    cookieName: "session",
    secret: "GDSHR2rwaf32",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));

server.listen(process.env.port || process.env.PORT || 3978, process.env.WEB_HOSTNAME, () => {
    console.log('listening to %s', server.url);
});
// Listen for messages from users 
server.post('/api/bot/messages', connector.listen());
server.get("/api/jira/callback", (req,res) => {
    console.log(req.session);
    jiraOAuth.callback(req,res);
});
server.get("/api/jira/tokenRequest", (req,res) => {
    jiraOAuth.requestToken(req, res);
});
server.get("/", (req, res) => { res.send({ hello: 'world' }); });