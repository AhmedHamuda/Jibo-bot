"use strict";

const util = require('util');
const builder = require('botbuilder');
const _ = require('underscore');
const lib = new builder.Library('text-search');

lib.dialog('/', [
     (session, args, next) => {
        session.dialogData.entities = args.entities;
        session.conversationData.status = null;
        const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || null;
        if(!_.isNull(status)) {
            session.beginDialog("status:check", status.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        session.conversationData.priority = null;
        const priority = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'priority') || null;
        if(!_.isNull(priority)) {
            session.beginDialog("priority:check", priority.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        session.conversationData.issueType = null;
        const issueType = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'issueType') || null;
        if(!_.isNull(issueType)) {
            session.beginDialog("issue-type:check", issueType.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        const subject = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'subject') || null;
        session.conversationData.subject = _.isNull(subject) ? null : subject.entity;
        next();
     },
     (session, args, next) => {
        const dueDate = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'duedate') || null;
        session.conversationData.dueDate = _.isNull(dueDate) ? null : builder.EntityRecognizer.parseTime(dueDate.entity);
        next();
     },
     (session, args, next) => {
        const assignee = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'assignee') || null;
        session.conversationData.assignee =  _.isNull(assignee) ? null : assignee.entity;
        next();
     },
     (session, args, next) => {
        const created = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'created') || null;
        session.conversationData.created = _.isNull(created) ? null : builder.EntityRecognizer.parseTime(created.entity);
        next();
     },
     (session, args, next) => {
        session.conversationData.order = {};
        const orderBy = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'orderBy') || null;
        const orderByDirection = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'orderByDirection') || null;
        session.conversationData.order.orderBy = _.isNull(orderBy) ? null : orderBy.entity;
        session.conversationData.order.orderByDirection = _.isNull(orderByDirection) ? null : orderByDirection.entity;
        next();
     },
     (session, args, next) => {
        session.beginDialog('issue:get');
     }
])
.endConversationAction(
    "endfilter", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel your search. Are you sure?"
    }
);
// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};