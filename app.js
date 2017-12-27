"use strict";
exports.__esModule = true;
/// <reference path="./typings/index.d.ts" />

require('dotenv-extended').load();
const restify = require("restify");
const connector = require("./bot/bot").connector;
const jiraOAuth = require("./jira/jira_oauth");
const jiraWebhook = require("./jira/jira_webhook");
const sessions = require("./ext/restify_session") 
const session = new sessions({
    debug: true,
    persist: true,
    connection: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST
    }
})


let server = restify.createServer();

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.use(session.sessionManager);
/*
server.use(sessions({
    cookieName: "session",
    secret: "GDSHR2rwaf32",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));
*/
server.listen(process.env.port || process.env.PORT || 3978, process.env.WEB_HOSTNAME, () => {
    console.log('listening to %s', server.url);
});
// Listen for messages from users 

server.get("/", (req, res) => { res.send({ hello: 'world' }); });
server.get("/api/jira/tokenRequest", jiraOAuth.requestToken);
server.get("/api/jira/callback", jiraOAuth.callback);
server.post('/api/jira/webhook', jiraWebhook.webhook);
server.post('/api/bot/messages', connector.listen());