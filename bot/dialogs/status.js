let util = require('util');
let builder = require('botbuilder');
let constants = require("../../constants/constants");
let lib = new builder.Library('status');
let _ =  require('underscore');

lib.dialog('ask', [ 
    (session) => {
        session.conversationData.status = session.conversationData.status || [];
        builder.Prompts.choice(session,"please choose a status:",
                _.difference(constants.status, session.conversationData.status),
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.status.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional status?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("status:ask");
        }
        else{
            session.endDialogWithResult(session.conversationData.status); 
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};