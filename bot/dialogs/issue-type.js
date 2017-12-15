let util = require('util');
let builder = require('botbuilder');
let constants = require("../../constants/constants");
let lib = new builder.Library('issue-type');
let _ =  require('underscore');

lib.dialog('ask', [ 
    (session) => {
        session.conversationData.issueType = session.conversationData.issueType || [];
        builder.Prompts.choice(session,"please choose an issue type:",
                _.difference(constants.issuetype, session.conversationData.issueType),
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.issueType.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional issue type?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("issue-type:ask");
        }
        else{
            session.endDialogWithResult(session.conversationData.issueType);
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};