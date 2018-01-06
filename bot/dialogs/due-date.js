"use strict";

let util = require('util');
let builder = require('botbuilder');

let lib = new builder.Library('due-date');

lib.dialog('ask', [ 
    (session) => {
        builder.Prompts.time(session, "What's the end date of the tickets?");
    },
    (session, results) => {
        if (results.response) {
            session.conversationData.dueDate = builder.EntityRecognizer.resolveTime([results.response]);
        }
        session.endDialog();
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};