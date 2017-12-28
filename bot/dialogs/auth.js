"use strict";

const util = require('util');
const builder = require('botbuilder');

const lib = new builder.Library('auth');

const botURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;

lib.dialog("authenticate", 
    (session,args, next) => {
        if (!session.userData.oauth || !session.userData.oauth.accessToken || !session.userData.oauth.accessTokenSecret) {
            console.log(args);
            let altButton = builder.CardAction.dialogAction(session, "goodbye", null, "Cancel");
            if(env.process.JIRA_USER && env.process.JIRA_PASSWORD) {
                altButton = builder.CardAction.dialogAction(session, "welcome", null, "Proceed without oAuth");
            }
            let signIn = new builder.HeroCard(session)
                    .text("Please sign-in to Jira")
                    .buttons([
                        builder.CardAction.openUrl(session, botURL 
                                + "/api/jira/tokenRequest?userId=" + args.user.id
                                + "&userName=" + args.user.name
                                + "&botId=" + args.bot.id
                                + "&addressId=" + args.id
                                + "&channelId=" + args.channelId
                                + "&conversationId=" + args.conversation.id
                                + "&serviceUrl=" + args.serviceUrl, "Sign-in"),
                        altButton
                    ]);

            let msg = new builder.Message(session);
            msg.text("Hi "+ session.message.user.name + ", I cannot recognize you.")
            msg.attachments([signIn]);
            session.send(msg);
        }
        else {
            session.replaceDialog("welcome:welcome");
        }
});

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};