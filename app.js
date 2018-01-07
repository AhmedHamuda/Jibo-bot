"use strict";
exports.__esModule = true;
/// <reference path="./typings/index.d.ts" />

require('dotenv-extended').load();
const cluster = require('cluster');
const workers = process.env.WORKERS || require('os').cpus().length;

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
});

//clustering
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    console.log('start cluster with %s workers', workers);

    for (let i = 0; i < workers; ++i) {
        console.log(`Forking process number ${i}...`);
        cluster.fork();
    }

    cluster.on('fork', function(worker) {
        console.log('worker:' + worker.id + " is forked");
    });
    cluster.on('online', function(worker) {
        console.log('worker:' + worker.id + " is online");
    });
    cluster.on('listening', function(worker) {
        console.log('worker:' + worker.id + " is listening");
    });
    cluster.on('disconnect', function(worker) {
        console.log('worker:' + worker.id + " is disconnected");
    });
    cluster.on('exit', (worker) => {
        console.log('worker %s died. restart...', worker.process.pid);
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started...`);
    let server = restify.createServer();

    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser());
    
    server.use(session.sessionManager);
    server.listen(process.env.port || process.env.PORT || 3978, process.env.WEB_HOSTNAME, () => {
        console.log('listening to %s', server.url);
    });
    server.server.setTimeout(60000*10);
    
    server.get("/", (req, res) => { res.send({ hello: 'world' }); });
    server.get("/api/jira/tokenRequest", jiraOAuth.requestToken);
    server.get("/api/jira/callback", jiraOAuth.callback);
    //server.post('/api/jira/webhook', jiraWebhook.webhook);
    server.post('/api/bot/messages', connector.listen());
}

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
});