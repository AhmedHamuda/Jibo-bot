"use strict";

const util = require('util');
const builder = require('botbuilder');

const lib = new builder.Library('welcome');

lib.dialog("welcome", [
    /*
    (session) => {
        session.beginDialog("user-profile:setup");
    },
    */
    (session) => {
        session.send("Welcome %s! How may I help you?", session.message.user.name);
        session.endDialog();
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};