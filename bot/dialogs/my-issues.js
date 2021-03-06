"use strict";

const builder = require('botbuilder');
const _ = require("underscore");
const Jira = require("../../jira/jira");
const lib = new builder.Library('my-issues');

lib.dialog('/', [ 
    async (session,args, next) => {
        try {
            let jira = new Jira(session.userData.jira);
            const me = await jira.getCurrentUser();
            args.entities.assignee = {
                entity: me.key
            };
            next(args);
        } catch (error) {
            if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
            }
        }
    },
    async (session, args) => {
        try {
            const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || undefined;
            if(status && !_.contains(status.entity, "open")) {
                session.replaceDialog("text-search:/", args);
            } else {
                let jira = new Jira(session.userData.jira);
                const openOnly = status && _.contains(status.entity, "open") || false;
                const result = await jira.getUsersIssues(args.entities.assignee.entity, openOnly);
                let cards = _.map(result.issues, (issue,i) => {
                    const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
                    return new builder.HeroCard(session)
                        .title(issue.key)
                        .subtitle(issue.fields.summary)
                        .text(issue.fields.issuetype.name + "-" + issue.fields.status.name + "\n\n" +
                                "Priority: " + issue.fields.priority.name + "\n\n" +
                                "End date: " + issue.fields.duedate + "\n\n" +
                                "Resolution date: " + issue.fields.resolutiondate
                            );
                });
                let msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
                msg.attachments(cards);
                msg.text("Total of %s tickets", cards.length);
                session.send(msg);
                session.endDialog("Anything else I can help with?");
            }
        } catch (error) {
            if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
            }
        }
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