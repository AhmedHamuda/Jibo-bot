"use strict";

var util = require('util');
var builder = require('botbuilder');

var lib = new builder.Library('subject');

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