"use strict";

const util = require("util");
const builder = require("botbuilder");
const teams = require("botbuilder-teams");
const apiairecognizer = require('botbuilder-apiai');
const _ = require('underscore');

const botURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;
// Create chat bot 
let connector = new teams.TeamsChatConnector({
    appId: null, //process.env.MICROSOFT_APP_ID || null,
    appPassword: null //process.env.MICROSOFT_APP_PASSWORD || null
});
// this will receive nothing, you can put your tenant id in the list to listen
connector.setAllowedTenants([]);
// this will reset and allow to receive from any tenants
connector.resetAllowedTenants();
let bot = new builder.UniversalBot(connector, {
    localizerSettings: { 
        defaultLocale: "en" 
    }
});

let recognizer = new apiairecognizer(process.env.APIAI_CLIENT_TOKEN);
let intents = new builder.IntentDialog({
     recognizers: [recognizer]
});

bot.dialog('/', intents
    .matches("search_open_conversation","text-search:/")
    .matches("search_personalized", "my-issues:/")
    .matches("help", "help:/")
    .onDefault((session, args) => {
        if (!args) {
            session.replaceDialog("welcome");
        }
        let fulfillment = builder.EntityRecognizer.findEntity(args.entities, 'fulfillment'); 
        if (fulfillment){ 
            let speech = fulfillment.entity; 
            session.send(speech); 
        }else{ 
            session.send('Sorry...not sure how to respond to that');    
        } 
    })
);

bot.dialog("authenticate", [
    (session,args, next) => {
        if (!session.userData.access || !session.userData.access.token) {
            let signIn = new builder.HeroCard(session)
                    .text("Please sign-in to Jira")
                    .buttons([
                        builder.CardAction.openUrl(session, botURL + "/api/jira/tokenRequest", "Sign-in"),
                        builder.CardAction.dialogAction(session, "goodbye", null, "Cancel")
                    ]);

            let msg = new builder.Message(session);
            msg.text("Hi "+ session.message.user.name + ", I cannot recognize you.")
            msg.attachments([signIn]);
            session.send(msg);
        }
        else {
            next();
        }
    },
    (session) => {
        if(session.oauth_access_token && session.oauth_access_token_secret) {
            session.userData.access = {
                token: session.oauth_access_token,
                secret: session.oauth_access_token_secret
            };
            session.replaceDialog("/");
            session.send("Hi" + session.message.user.name + "I'm Jibo, Would you like me to guide you?")
       }
       else{
           session.replaceDialog("authenticate");
       }
    }
]);

bot.dialog("welcome", [
    (session) => {
        builder.Prompts.choice(session, "Hi "+ session.message.user.name +", would you like me to guide you?", "yes|no", builder.ListStyle.button);
    },
    (session, result) => {
        if(result && result.response.entity == "yes") {
            session.send("great! let's begin!").replaceDialog('filter:/');
        }
        else{
            session.send("Understood, please type 'help' to get the user guide!").endDialog();
        }
    }
]);

// Sub-Dialogs
bot.library(require('./dialogs/filter').createLibrary());
bot.library(require('./dialogs/text-search').createLibrary());
bot.library(require('./dialogs/issue').createLibrary());
bot.library(require('./dialogs/issue-type').createLibrary());
bot.library(require('./dialogs/labels/stream').createLibrary());
bot.library(require('./dialogs/due-date').createLibrary());
bot.library(require('./dialogs/status').createLibrary());
bot.library(require('./dialogs/priority').createLibrary());
bot.library(require('./dialogs/subject').createLibrary());
bot.library(require('./dialogs/assignee').createLibrary());
bot.library(require('./dialogs/my-issues').createLibrary());
//bot.library(require('./dialogs/settings').createLibrary());
bot.library(require('./dialogs/help').createLibrary());
bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity) => {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, 'authenticate');
            }
        });
    }
});
bot.endConversationAction('goodbye', "Ok... See you later.", { matches: 'Goodbye' });

module.exports = connector;