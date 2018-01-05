"use strict";

const util = require('util');
const builder = require('botbuilder');
const { URL } = require('url');
const lib = new builder.Library('user-profile');

const botURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;

lib.dialog("initiate", [
    (session,args, next) => {
        if (!session.userData.jira || !session.userData.jira.host || !session.userData.jira.port || !session.userData.jira.protocol) {
            if(args && args.redo) {
                builder.Prompts.text(session, "Please enter your jira instance URL (example: https://jira.example.org:81)");
            } else {
                session.send("Hi %s, I'm Jira Assistant bot", session.message.user.name)
                builder.Prompts.text(session, "To get started please enter your jira instance URL (example: https://jira.example.org:81)");
            }
        }
        else {
            session.replaceDialog("auth:authenticate");
        }
    },
    (session,results, next) => {
        try{
            if (results && results.response) {
                session.userData.jira = {};
                const jiraUrl = new URL(results.response);
                session.userData.jira.protocol = jiraUrl.protocol.replace(":","");
                session.userData.jira.host = jiraUrl.hostname;
                session.userData.jira.port = jiraUrl.port;
                session.replaceDialog("auth:authenticate");
            }
            else {
                session.replaceDialog("user-profile:initiate");
            }
        } catch (error) {
            session.send("Parsing url failed!");
            session.replaceDialog("user-profile:initiate", {redo: true});
        }
    }
]).endConversationAction(
    "endUserProfile", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel status update. Are you sure?"
    }
);

lib.dialog("reinitiate", (session, args) => {
    session.userData.jira = undefined;
    session.replaceDialog("user-profile:initiate");
}).triggerAction({
    matches: /^reinitiate$/i
});

lib.dialog("setup", [
    (session, args, next) => {
        session.beginDialog("project:list");
    },
    (session, args) => {
        session.beginDialog("status:list");
    },
    (session, args) => {
        session.beginDialog("priority:list");
    },
    (session, args) => {
        session.beginDialog("issue-type:list");
    },
    (session, args) => {
        session.endDialog();
    },
]);
// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};