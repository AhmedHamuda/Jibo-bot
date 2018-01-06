"use strict";

const util = require('util');
const builder = require('botbuilder');
const _ = require('underscore');
const lib = new builder.Library('text-search');

lib.dialog('/', [
     (session, args, next) => {
        session.dialogData.entities = args.entities;
        session.conversationData.status = undefined;
        const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || undefined;
        if(status) {
            session.beginDialog("status:check", status.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        session.conversationData.priority = undefined;
        const priority = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'priority') || undefined;
        if(priority) {
            session.beginDialog("priority:check", priority.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        session.conversationData.issueType = undefined;
        const issueType = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'issueType') || undefined;
        if(issueType) {
            session.beginDialog("issue-type:check", issueType.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        session.conversationData.project = undefined;
        const project = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'project') || undefined;
        if(project) {
            session.beginDialog("project:check", project.entity);
        } else {
            next();
        }
     },
     (session, args, next) => {
        const subject = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'subject') || undefined;
        session.conversationData.subject = subject && subject.entity;
        next();
     },
     (session, args, next) => {
        const dueDate = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'duedate') || undefined;
        session.conversationData.dueDate = dueDate && builder.EntityRecognizer.parseTime(dueDate.entity);
        next();
     },
     (session, args, next) => {
        const assignee = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'assignee') || undefined;
        session.conversationData.assignee =  assignee && assignee.entity;
        next();
     },
     (session, args, next) => {
        const created = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'created') || undefined;
        session.conversationData.created = created && builder.EntityRecognizer.parseTime(created.entity);
        next();
     },
     (session, args, next) => {
        session.conversationData.order = {};
        const orderBy = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'orderBy') || undefined;
        const orderByDirection = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'orderByDirection') || undefined;
        session.conversationData.order.orderBy = orderBy && orderBy.entity;
        session.conversationData.order.orderByDirection = orderByDirection && orderByDirection.entity;
        next();
     },
     (session, args, next) => {
        session.beginDialog('issue:get');
     }
])
.endConversationAction(
    "endTextSearch", "Searching cancelled.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel your search. Are you sure?"
    }
);
// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};