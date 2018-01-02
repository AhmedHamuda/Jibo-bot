"use strict";

let util = require('util');
let builder = require('botbuilder');
let constants = require("../../../constants/constants");
let lib = new builder.Library('stream');
let _ =  require('underscore');

lib.dialog('ask', [ 
    (session) => {
        session.conversationData.stream = session.conversationData.stream || [];
        builder.Prompts.choice(session,"please choose a stream:",
                _.difference(constants.stream, session.conversationData.stream),
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.stream.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional stream?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("stream:ask");
        }
        else{
            session.endDialog(); 
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};