"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('issue-link');
const _ = require('underscore');
const helpers = require("../../common/helpers");

lib.dialog('get', [
    (session, args, next) => {
        if (args && !args.redo) {
            session.conversationData.issueType = undefined;
            session.dialogData.entities = args.entities;
            const issueType = builder.EntityRecognizer.findEntity(args.entities, 'issueType') || undefined;
            if(issueType) {
                session.beginDialog("issue-type:check", issueType.entity);
            } else {
                next(args);
            }
        } else {
            next(args);
        }
     },
     (session, args, next) => {
         if(args && args.redo) {
            builder.Prompts.text(session, "Issue number doesn't exist. Please enter a valid issue number");
         } else if (session.dialogData.entities) {
            const issueNumber = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'issueNumber') || undefined;
            if(!issueNumber) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.dialogData.issueNumber = helpers.checkIssueNumberFormat(issueNumber.entity.replace(/[^0-9a-zA-Z\-]/gi, ''));
                if(!session.conversationData.issueNumber) {
                    builder.Prompts.text(session, 'Please enter the issue number again');
                } else{
                    next();
                }
            }
         } else {
            builder.Prompts.text(session, 'Please enter the issue number');
         }
    },
    async (session,results) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira(session.userData.jira);
            const issueNumber = session.dialogData.issueNumber || results.response;
            const issue = await jira.findIssue(issueNumber, "", "issuelinks");
            let issuelinks = issue.fields.issuelinks;
            if (issuelinks) {
                if(session.conversationData.issueType) {
                    issuelinks = _.filter(issuelinks, (issue) => {
                        if (_.contains(session.conversationData.issueType, issue.inwardIssue.fields.issuetype.name.toLowerCase())) {
                            return issue;
                        }
                    });
                }
                let cards = _.map(issuelinks, (issue,i) => {
                    const assignee = !_.isUndefined(issue.inwardIssue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
                    return new builder.HeroCard(session)
                        .title(issue.inwardIssue.key)
                        .subtitle(issue.inwardIssue.fields.summary)
                        .text(issue.inwardIssue.fields.issuetype.name + 
                                "-" +
                              issue.inwardIssue.fields.status.name + "\n\n"
                            );
                });
                let msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
                msg.attachments(cards);
                session.send(msg);
                session.endDialog("Anything else I can help with?");
            } else {
                session.send("There is no links for issue %s", issueNumber);
            }
        } catch(error) {
            if(error.statusCode == 404) {
                session.replaceDialog("issue-link:get", {redo: true});
            } else if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! An error accurd: %s. Please try again", error.errorMessages || error);
            }
        }
    }
]);

module.exports.createLibrary =  () => {
    return lib.clone();
};