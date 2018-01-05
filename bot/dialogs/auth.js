"use strict";

const util = require('util');
const builder = require('botbuilder');

const lib = new builder.Library('auth');

const botURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;

lib.dialog("authenticate", 
    (session,args, next) => {
        if (!session.userData.jira || !session.userData.jira.oauth || !session.userData.jira.oauth.access_token || !session.userData.jira.oauth.access_token_secret) {
            const addressInfo = session.message.address;
            let altButton = builder.CardAction.dialogAction(session, "goodbye", null, "Cancel");
            let signIn = new builder.HeroCard(session)
                    .text("Please sign-in to Jira")
                    .buttons([
                        builder.CardAction.openUrl(session, botURL 
                                + "/api/jira/tokenRequest?userId=" + addressInfo.user.id
                                + "&userName=" + addressInfo.user.name
                                + "&botId=" + addressInfo.bot.id
                                + "&addressId=" + addressInfo.id
                                + "&channelId=" + addressInfo.channelId
                                + "&conversationId=" + addressInfo.conversation.id
                                + "&serviceUrl=" + addressInfo.serviceUrl, "Sign-in"),
                        altButton
                    ]);

            let msg = new builder.Message(session);
            msg.text("Hi "+ session.message.user.name + ", I cannot recognize you.")
            msg.attachments([signIn]);
            session.endDialog(msg);
        }
        else {
            session.replaceDialog("welcome:welcome");
        }
});

lib.dialog("reauthenticate", (session, args) => {
    if(session.userData.jira) {
        session.userData.jira.oauth = {};
    } 
    session.replaceDialog("auth:authenticate");
}).triggerAction({
    matches: /^reauthenticate$/i
});

lib.dialog("error", [
    (session, args, next) => {
        builder.Prompts.choice("Looks like Application link is missing between me and provided Jira Instance, please choose one of the following",
        ["Reauthenticate", "Reinitiate"],
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results && results.response) {
            const opt = results.response.entity;
            if(opt == "Reauthenticate") {
                session.replaceDialog("auth:reauthenticate");
            } else {
                session.replaceDialog("user-profile:reinitiate");
            }
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};