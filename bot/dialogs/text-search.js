"use strict";

const util = require('util');
const builder = require('botbuilder');
const _ = require('underscore');
const helpers = require("../../common/helpers");
const lib = new builder.Library('text-search');

lib.dialog('/',[
     (session, args) => {
        session.dialogData.entities = args.entities;
        const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || null;
        session.beginDialog("status:check", status.entity);
     },
     (session) => {
        const priority = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'priority') || null;
        session.beginDialog("priority:check", status.entity);
     },
     (session, args) => {
        const issueType = builder.EntityRecognizer.findEntity(session.dialogData.entities, 'issueType') || null;
     },
     (session, args) => {
        const subject = builder.EntityRecognizer.findEntity(args.entities, 'subject') || null;
     },
     (session, args) => {
        const dueDate = builder.EntityRecognizer.findEntity(args.entities, 'duedate') || null;
     },
     (session, args) => {
        const assignee = builder.EntityRecognizer.findEntity(args.entities, 'assignee') || null;
     },
     (session, args) => {
        const created = builder.EntityRecognizer.findEntity(args.entities, 'created') || null;
     },
     (session, args) => {
        const orderBy = builder.EntityRecognizer.findEntity(args.entities, 'orderBy') || null;
     },
     (session, args) => {
        const orderByDirection = builder.EntityRecognizer.findEntity(args.entities, 'orderByDirection') || null;
     },
        
        const filter = {
            dueDate : _.isNull(dueDate) ? null : builder.EntityRecognizer.parseTime(dueDate.entity),
            created: _.isNull(created) ? null : builder.EntityRecognizer.parseTime(created.entity),
            status:  _.isNull(status) ? null : ,
            priority:  _.isNull(priority) ? null :  helpers.checkAndApplyReversedPriority(priority.entity),
            issueType: _.isNull(issueType) ? null :  issueType.entity,
            subject:  _.isNull(subject) ? null :  subject.entity,
            assignee:  _.isNull(assignee) ? null :  assignee.entity,
        };
        const order = {
            orderBy:  _.isNull(orderBy) ? null : orderBy.entity,
            orderByDirection:  _.isNull(orderByDirection) ? null :  orderByDirection.entity,
        };
        session.beginDialog('issue:get',{filter: filter, order: order});
    },
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