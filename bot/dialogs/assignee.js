"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('assignee');
const helpers = require("../../common/helpers");

lib.dialog('confirm', [ 
    (session, args) => {
        session.conversationData.assignee = args;
        builder.Prompts.choice(session,`Is "${args}" the assignee you are looking for?`,
        "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.endDialog();
        }
        else {
            session.replaceDialog("assignee:ask");
        }
    }
]);

lib.dialog('ask', [
    (session) => {
        builder.Prompts.text(session,"Please type the assignee name");
    },
    (session, results) => {
        if(results.response) {
            session.conversationData.assignee = results.response;
        }
        session.endDialog();
    }
]);

lib.dialog('assign', [ 
    (session, args) => {
        if(args && args.redo) {
            builder.Prompts.text(session, "Please enter a valid issue number");
         } else if (args && args.entities) {
            const issueNumber = builder.EntityRecognizer.findEntity(args.entities, 'issueNumber') || undefined;
            if(!issueNumber) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.dialogData.issueNumber = helpers.checkIssueNumberFormat(issueNumber.entity.replace(/[^0-9a-zA-Z\-]/gi, ''));
                if(!session.conversationData.issueNumber) {
                    builder.Prompts.text(session, 'Please enter the issue number again');
                } else {
                    next();
                }
            }
         } else {
            builder.Prompts.text(session, 'Please enter the issue number');
         }
    },
    (session, results, next) => {
        if (results && results.response) {
            session.dialogData.issueNumber = results.response;
            builder.Prompts.text(session, 'Please enter the new assignee jira user name');
        } else {
            session.replaceDialog("assignee:assign", {redo: true});
        }
     },
     async (session, results, next) => {
        try {
            if (results && results.response) {
                let jira = new Jira(session.userData.jira);
                const issueNumber =  session.dialogData.issueNumber;
                const assignee = results.response;
                const result = await jira.assign(issueNumber, assignee);
                session.endDialog("Issue %s assigned to %s",issueNumber, assignee);
            } else {
                session.replaceDialog("assignee:assign", {redo: true});
            }
        } catch (error) {
            if(error.statusCode == 404) {
                session.send("Issue or user doesn't exist!")
                session.replaceDialog("assignee:assign", {redo: true});
            } else if(error.statusCode == 401) {
                session.send("Sorry %s, You dont have permission to assign the issue", session.message.address.user.name)
                session.endDialog();
            } else {
                session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
            }
        }
     }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};