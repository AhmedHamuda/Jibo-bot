"use strict";

const builder = require('botbuilder');
const _ = require("underscore");
const helpers = require("../../common/helpers");
let lib = new builder.Library('my-issues');

lib.dialog('/', [ 
    (session,args, next) => {
        const dueDate = builder.EntityRecognizer.findEntity(args.entities, 'duedate') || null;
        const created = builder.EntityRecognizer.findEntity(args.entities, 'created') || null;
        const subject = builder.EntityRecognizer.findEntity(args.entities, 'subject') || null;
        const priority = builder.EntityRecognizer.findEntity(args.entities, 'priority') || null;
        const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || null;
        const issueType = builder.EntityRecognizer.findEntity(args.entities, 'issueType') || null;
        const filter = {
            dueDate : _.isNull(dueDate) ? null : builder.EntityRecognizer.parseTime(dueDate.entity),
            created: _.isNull(created) ? null : builder.EntityRecognizer.parseTime(created.entity),
            status:  _.isNull(status) ? null : helpers.checkAndApplyReversedStatus(status.entity),
            priority:  _.isNull(priority) ? null :  helpers.checkAndApplyReversedPriority(priority.entity),
            issueType: _.isNull(issueType) ? null :  issueType.entity,
            subject:  _.isNull(subject) ? null :  subject.entity,
            assignee:  _.isNull(assignee) ? null :  assignee.entity,
        };
        Object.assign(session.conversationData, filter);
        if (!session.userData.jiraUserName)
            builder.Prompts.text(session,"What is your jira user name?");
        else
            next();
    },
    (session, results) => {
        if(results.response) {
            session.userData.jiraUserName = results.response;
        }
        session.conversationData.assignee = session.userData.jiraUserName;
        session.replaceDialog("issues:fetch");
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