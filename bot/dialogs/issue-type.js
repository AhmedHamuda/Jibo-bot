"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const _ =  require('underscore');
const lib = new builder.Library('issue-type');


lib.dialog('ask', [
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.issueType = [];
        }
        let original = _.map(session.conversationData.issueTypes, (status) => {return status.toLowerCase();});
        let selected = _.map(session.conversationData.issueType, (status) => {return status.toLowerCase();});
        const diff = _.difference(original, selected);
        if(diff.length > 0) {
            builder.Prompts.choice(session,"please choose a issue types:",
                diff,
                builder.ListStyle.button);
        } else {
            session.endDialog("you've selected all available issue types");
        }
    },
    (session, results) => {
        session.conversationData.issueType.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional issue type?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("issue-type:ask");
        }
        else {
            session.endDialog();
        }
    }
]);

lib.dialog('check', [
    (session, args) => {
        session.dialogData.args = args;
        session.beginDialog("issue-type:list");
    },
    (session, args) => {
        try {
            let args = session.dialogData.args;
            if(args) {
                    session.conversationData.issueType = session.conversationData.issueType || [];
                    let original = _.map(session.conversationData.issueTypes, (issueType) => {return issueType.toLowerCase();});
                    args = _.isArray(args) ? _.map(args, (issueType) => {return issueType.toLowerCase();}) : [args];
                    const diff = _.difference(args, original);
                    if (diff.length > 0) {
                        session.send("Requested issue types ("+ diff.join(", ") +") are not available in Jira");
                        session.conversationData.issueType = _.intersection(args, original) || [];
                        session.replaceDialog("issue-type:ask", {redo: true});
                    } else {
                        session.conversationData.issueType = args;
                        session.endDialog();
                    }
            } else {
                session.endDialog();
            }
        } catch(error) {
            session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
        }
    }
]);

lib.dialog('list', 
    async (session) => {
        try {
            let jira = new Jira(session.userData.jira);
            const issueTypes = await jira.listIssueTypes();
            session.conversationData.issueTypes = _.map(issueTypes, (issueType) => { return issueType.name; });
            session.endDialog();
        }
        catch(error) {
            if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
            }
        } 
});

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};