let util = require('util');
let builder = require('botbuilder');
let filterOpts = require("../../constants/constants").filterOpts;
let lib = new builder.Library('filter');

lib.dialog('/', [ 
    (session) => {
        builder.Prompts.choice(session,"please choose a filter option:",
                filterOpts,
                builder.ListStyle.button);
    },
    (session, results) => {
        session.beginDialog(results.response.entity + ':ask');
    },
    (session, results) => {
        session.beginDialog('issue:get');
    }
]).endConversationAction(
    "endfilter", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel your search. Are you sure?"
    }
);

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};