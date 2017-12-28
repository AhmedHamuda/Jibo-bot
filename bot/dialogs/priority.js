"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('priority');
const _ = require("underscore");

lib.dialog('ask', [ 
    (session) => {
        if(!args || !args.redo) {
            session.conversationData.priority = [];
        }
        builder.Prompts.choice(session,"please choose a priority:",
                _.difference(session.conversationData.priorities, session.conversationData.priority),
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.priority.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional priority?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("priority:ask");
        }
        else{
            session.endDialog(); 
        }
    }
]);

lib.dialog('check', 
    (session, args) => {
    if(args) {
        try {
            session.conversationData.priority = session.conversationData.priority || [];
            let original = _.map(session.conversationData.priorities, (priority) => {return priority.toLowerCase();});
            args = _.map(args, (priority) => {return priority.toLowerCase();});
            const diff = _.difference(args, original);
            if (diff) {
                session.send("Requested priorities ("+ diff.join(", ") +") are not available in Jira");
                session.conversationData.priority = _.intersection(args, original) || [];
                session.replaceDialog("priority:ask", {redo: true});
            } else {
                session.conversationData.priority = args;
                session.endDialog();
            }
        }
        catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the checking priorities, please try again later", error);
        } 
    } else {
        session.endDialog();
    }
});

lib.dialog('list', 
    async (session) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira({
                oauth: {
                    access_token: session.userData.oauth.accessToken,
                    access_token_secret: session.userData.oauth.accessTokenSecret,
                }
            });
        
            const priorities = await jira.listPriorities();
            session.conversationData.priorities =  _.map(priorities, (priority) => { return priority.name;});
            session.endDialog();
        }
        catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the priorities, please try again later", error);
        } 
    });

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};