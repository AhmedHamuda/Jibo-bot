"use strict";

var util = require('util');
var builder = require('botbuilder');

var lib = new builder.Library('subject');

lib.dialog('ask', [ 
    (session) => {
        builder.Prompts.text(session,"what subject are you looking for?",
                builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response) {
            session.conversationData.subject = results.response;
        }
        session.endDialogWithResult(results);
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};