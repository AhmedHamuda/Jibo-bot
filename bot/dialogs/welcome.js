"use strict";

const util = require('util');
const builder = require('botbuilder');

const lib = new builder.Library('welcome');

lib.dialog("welcome", [
    (session, args, next) => {
        session.beginDialog("project:list");
    },
    (session, args) => {
        session.beginDialog("status:list");
    },
    (session, args) => {
        session.beginDialog("priority:list");
    },
    (session, args) => {
        session.beginDialog("issue-type:list");
    },
    (session, args) => {
        session.send("Welcome "+ session.message.user.name +"! I'm Jibo, Jira assistant bot. How may I help you?");
        session.delay(60*1000);
        session.send("Type 'help' for guidness");
        session.endDialog();
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};