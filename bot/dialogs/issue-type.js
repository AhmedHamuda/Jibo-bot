"use strict";

const util = require('util');
const builder = require('botbuilder');
const _ =  require('underscore');
const lib = new builder.Library('issue-type');


lib.dialog('ask', [
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.issueType = [];
        }
        session.conversationData.issueType = session.conversationData.issueType || [];
        builder.Prompts.choice(session,"please choose an issue type:",
                _.difference( session.conversationData.issueTypes, session.conversationData.issueType),
                builder.ListStyle.button);
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

lib.dialog('check', 
    (session, args) => {
        if(args) {
            try {
                session.conversationData.issueType = session.conversationData.issueType || [];
                let original = _.map(session.conversationData.issueTypes, (issueType) => {return issueType.toLowerCase();});
                args = _.map(args, (issueType) => {return issueType.toLowerCase();});
                const diff = _.difference(args, original);
                if (diff) {
                    session.send("Requested issue types ("+ diff.join(", ") +") are not available in Jira");
                    session.conversationData.issueType = _.intersection(args, original) || [];
                    session.replaceDialog("issue-type:ask", {redo: true});
                } else {
                    session.conversationData.issueType = args;
                    session.endDialog();
                }
            } catch {
                session.send("Oops! an error accurd: %s, while checking the statuses, please try again later", error);
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
        
            const issueTypes = await jira.listIssueTypes();
            session.conversationData.issueTypes = _.map(issueTypes, (issueType) => { return issueType.name; });
            session.endDialog();
        }
        catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the issue types, please try again later", error);
        } 
});

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};