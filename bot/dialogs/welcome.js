"use strict";

const util = require('util');
const builder = require('botbuilder');

const lib = new builder.Library('welcome');

lib.dialog("welcome", [
    (session, args, next) => {
        session.beginDialog("project:list");
    },
    (session, args) => {
        session.beginDialog("status:list");
    },
    (session, args) => {
        session.beginDialog("priority:list");
    },
    (session, args) => {
        session.beginDialog("issue-type:list");
    },
    (session, args) => {
        builder.Prompts.choice(session, "Welcome "+ session.message.user.name +"! would you like me to guide you?", "yes|no", builder.ListStyle.button);
    },
    (session, result) => {
        if(result && result.response.entity == "yes") {
            session.send("great! let's begin!").replaceDialog('filter:/');
        }
        else{
            session.send("Understood, please type 'help' to get the user guide!").endDialog();
        }
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};