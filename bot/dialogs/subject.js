"use strict";

var util = require('util');
var builder = require('botbuilder');

var lib = new builder.Library('subject');

lib.dialog('confirm', [ 
    (session, args) => {
        session.conversationData.subject = args;
        builder.Prompts.choice(session,`Is "${args}" the subject you are looking for?`,
        "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.endDialog();
        }
        else {
            session.replaceDialog("subject:ask");
        }
    }
]);

lib.dialog('ask', [ 
    (session) => {
        builder.Prompts.text(session,"What subject are you looking for?");
    },
    (session, results) => {
        if(results.response) {
            session.conversationData.subject = results.response;
        }
        session.endDialog();
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};