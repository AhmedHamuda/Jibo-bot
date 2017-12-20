"use strict";
exports.__esModule = true;
/// <reference path="./typings/index.d.ts" />

require('dotenv-extended').load();
const restify = require("restify");
const connector = require("./bot/bot");
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('listening to %s', server.url);
});
// Listen for messages from users 
server.post('/api/bot/messages', connector.listen());
server.get("/", () => { return "ok"});