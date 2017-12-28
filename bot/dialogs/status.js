"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('status');
const _ =  require('underscore');

lib.dialog('ask', [ 
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.status = [];
        }
        builder.Prompts.choice(session,"please choose a status:",
                _.difference(session.conversationData.statuses, session.conversationData.status),
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
            session.replaceDialog("status:ask", {redo: true});
        }
        else{
            session.endDialog(); 
        }
    }
]);

lib.dialog('check', 
    (session, args) => {
        if(args) {
            try {
                session.conversationData.status = session.conversationData.status || [];
                let original = _.map(session.conversationData.statuses, (status) => {return status.toLowerCase();});
                args = _.map(args, (status) => {return status.toLowerCase();});
                const diff = _.difference(args, original);
                if (diff) {
                    session.send("Requested statuses ("+ diff.join(", ") +") are not available in Jira");
                    session.conversationData.status = _.intersection(args, original) || [];
                    session.replaceDialog("status:ask", {redo: true});
                } else {
                    session.conversationData.status = helpers.checkAndApplyReversedStatus(args);
                    session.endDialog();
                }
            } catch {
                session.send("Oops! an error accurd: %s, while checking the statuses, please try again later", error);
            }
        } else {
            session.endDialog();
        }
});

lib.dialog('list', 
    async (session,args, next) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira({
                oauth: {
                    access_token: session.userData.oauth.accessToken,
                    access_token_secret: session.userData.oauth.accessTokenSecret,
                }
            });
        
            const statuses = await jira.listStatus();
            session.conversationData.statuses = _.map(statuses, (status) => { return status.name;});
            session.endDialog();
        }
        catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the statuses, please try again later", error);
        }
    });


// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};