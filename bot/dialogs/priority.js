"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const _ = require("underscore");
const lib = new builder.Library('priority');

lib.dialog('ask', [ 
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.priority = [];
        }
        let original = _.map(session.conversationData.priorities, (status) => {return status.toLowerCase();});
        let selected = _.map(session.conversationData.priority, (status) => {return status.toLowerCase();});
        const diff = _.difference(original, selected);
        if(diff.length > 0) {
            builder.Prompts.choice(session,"please choose a priority:",
                diff,
                builder.ListStyle.button);
        } else {
            session.endDialog("you've selected all available priorities");
        }
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

lib.dialog('check', [
    (session, args) => {
        session.dialogData.args = args;
        session.beginDialog("priority:list");
    },
    (session, args) => {
        try {
            let args = session.dialogData.args;
            if(args) {
                    session.conversationData.priority = session.conversationData.priority || [];
                    let original = _.map(session.conversationData.priorities, (priority) => {return priority.toLowerCase();});
                    args = _.isArray(args) ? _.map(args, (priority) => {return priority.toLowerCase();}): [args];
                    const diff = _.difference(args, original);
                    if (diff.length > 0) {
                        session.send("Requested priorities ("+ diff.join(", ") +") are not available in Jira");
                        session.conversationData.priority = _.intersection(args, original) || [];
                        session.replaceDialog("priority:ask", {redo: true});
                    } else {
                        session.conversationData.priority = args;
                        session.endDialog();
                    }
            } else {
                session.endDialog();
            }
        }
        catch(error) {
            if (error == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! an error accurd: %s, while retrieving the checking priorities, please try again later", error);
            }
        }
    }
]);

lib.dialog('list', 
    async (session) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira(session.userData.jira);
            const priorities = await jira.listPriorities();
            session.conversationData.priorities =  _.map(priorities, (priority) => { return priority.name;});
            session.endDialog();
        }
        catch(error) {
            if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! an error accurd: %s, while retrieving the priorities, please try again later", error);
            }
        } 
    });

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};