let util = require('util');
let builder = require('botbuilder');
let constants = require("../../constants/constants");
let lib = new builder.Library('priority');
let _ =  require('underscore');

lib.dialog('ask', [ 
    (session) => {
        session.conversationData.priority = session.conversationData.priority || [];
        builder.Prompts.choice(session,"please choose a priority:",
                _.difference(constants.priority, session.conversationData.priority),
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.priority.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional priority?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("priority:ask");
        }
        else{
            session.endDialogWithResult(session.conversationData.priority); 
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};