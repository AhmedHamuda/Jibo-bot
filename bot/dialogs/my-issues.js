"use strict";

const builder = require('botbuilder');
const _ = require("underscore");
const helpers = require("../../common/helpers");
let lib = new builder.Library('my-issues');

lib.dialog('/', [ 
    (session,args, next) => {
        session.dialogData.args = args;
        if (!session.userData.jiraUserName)
            builder.Prompts.text(session,"What is your jira user name?");
        else
            next();
    },
    (session, results) => {
        session.userData.jiraUserName = results.response;
        session.conversationData.assignee = session.userData.jiraUserName;
        if(!session.dialogData.args.entities.status) {
            session.dialogData.args.entities.status = {
                entity : ["Open","in progress","Reopened"]
            };
        }
    },
    (session) => {
        session.beginDialog("text-search:/", session.dialogData.args);
    }
])
.endConversationAction(
    "endfilter", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel your search. Are you sure?"
    }
);

module.exports.createLibrary =  () => {
    return lib.clone();
};