"use strict";

const util = require("util");
const builder = require("botbuilder");
const teams = require("botbuilder-teams");
const apiairecognizer = require('botbuilder-apiai');
const redis = require("redis");
const RedisStorage = require("botbuilder-redis-storage");
const Setup = require("../middlewares/setup");
// Redis client
const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, {prefix: "bot-storage:" });
const storage = new RedisStorage(redisClient);
// Create chat bot 
const connector = new teams.TeamsChatConnector({
    appId: null, //process.env.MICROSOFT_APP_ID || null,
    appPassword: null //process.env.MICROSOFT_APP_PASSWORD || null
});
// this will receive nothing, you can put your tenant id in the list to listen
connector.setAllowedTenants([]);
// this will reset and allow to receive from any tenants
connector.resetAllowedTenants();
const bot = new builder.UniversalBot(connector, {
    localizerSettings: { 
        defaultLocale: "en" 
    }
});
bot.set("storage", storage);

bot.use({
    botbuilder: (session, next) => {
        next();
        //ManualSupport.SaveUserData(session, next);
    },
    send: (event, next) => {
        next();
        //ManualSupport.logOutgoingMessage(event, next);
    }
})


const recognizer = new apiairecognizer(process.env.APIAI_CLIENT_TOKEN);
const intents = new builder.IntentDialog({
     recognizers: [recognizer]
});

bot.dialog('/', intents
    .matches("search_all_issues","text-search:/")
    .matches("search_my_issues", "my-issues:/")
    .matches("find_issue", "issue:getByKey")
    .matches("find_issue_links", "issue-link:get")
    .matches("assign_issue", "assignee:assign")
    .matches("add_issue_comment", "comment:add")
    .matches("get_issue_comment", "comment:get")
    .matches("set_issue_status", "status:update")
    .matches("issue_dev_status", "issue:getDevStatus")
    .matches("issue_dev_summary", "issue:getDevSummary")
    .matches("help", "help:/")
    .onDefault([
        (session, args) => {
            let fulfillment = builder.EntityRecognizer.findEntity(args.entities, 'fulfillment');
            /*
            session.conversationData.userAtempts = session.conversationData.userAtempts || 0;
            session.conversationData.userAtempts++;
            */
            if (fulfillment && fulfillment.entity && fulfillment.entity.length > 0 && session.conversationData.userAtempts < 5) {
                let speech = fulfillment.entity; 
                session.send(speech); 
            } else {
                session.send("Sorry...not sure how to respond to that");
                /*
                builder.Prompts.choice(session,"Sorry...not sure how to respond to that, would you like to contact support?",
                "yes|no",
                builder.ListStyle.button);
                */
            } 
        },
        (session, results) => {
            if(results.response.entity == "yes") {
                session.replaceDialog("ask");
            }
            else {
                session.endDialog("Please type 'help' for guideness"); 
            }
        }
    ])
);
/*
bot.dialog("ask",
    (session) => {
        session.send("starting conversation with Ahmed Hamuda");
        session.conversationData.manualSupport = true;
        const address = {
            serviceUrl: session.message.address.serviceUrl,
            bot: {
                id: session.message.address.bot.id,
                name: session.message.address.bot.name
            },
            channelId: session.message.address.channelId,
            user: {
                id:"default-user",
                name: "User"
            }
        }
        bot.loadSession(address, (error, mSession) => {
            if(error){
                console.log(error);
            } else{
                let msg = new builder.Message(mSession);
                msg.text("Hi");
                bot.send(msg);
            }
        })
});
*/
// Sub-Dialogs
bot.library(require('./dialogs/user-profile').createLibrary());
bot.library(require('./dialogs/auth').createLibrary());
bot.library(require('./dialogs/welcome').createLibrary());
bot.library(require('./dialogs/filter').createLibrary());
bot.library(require('./dialogs/text-search').createLibrary());
bot.library(require('./dialogs/issue').createLibrary());
bot.library(require('./dialogs/issue-type').createLibrary());
bot.library(require('./dialogs/issue-link').createLibrary());
bot.library(require('./dialogs/due-date').createLibrary());
bot.library(require('./dialogs/status').createLibrary());
bot.library(require('./dialogs/transition').createLibrary());
bot.library(require('./dialogs/priority').createLibrary());
bot.library(require('./dialogs/project').createLibrary());
bot.library(require('./dialogs/subject').createLibrary());
bot.library(require('./dialogs/assignee').createLibrary());
bot.library(require('./dialogs/my-issues').createLibrary());
bot.library(require('./dialogs/comment').createLibrary());
//bot.library(require('./dialogs/manual').createLibrary());
//bot.library(require('./dialogs/settings').createLibrary());
bot.library(require('./dialogs/help').createLibrary());
bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity) => {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, 'user-profile:initiate', message.address);
            }
        });
    }
});
bot.endConversationAction('goodbye', "Ok... See you later.", { matches: 'Goodbye' });

module.exports = {bot: bot, connector: connector};