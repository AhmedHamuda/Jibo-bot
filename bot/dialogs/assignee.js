let util = require('util');
let builder = require('botbuilder');

let lib = new builder.Library('assignee');

lib.dialog('ask', [ 
    (session) => {
        builder.Prompts.text(session,"please list the assignee list separated by coma",
                builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response) {
            session.conversationData.assignee = results.response;
        }
        session.endDialogWithResult(results);
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};