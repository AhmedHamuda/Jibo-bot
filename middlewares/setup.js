"use strict";
class Setup {
    static checkSetup (session, next) {
        if (Setup.allowedActions.indexOf(session.message.text) > -1) {
            next();
        } else if (session.userData.jira && session.userData.jira.host && session.userData.jira.oauth &&
             (!session.userData.projects || !session.conversationData.issueTypes ||
                 !session.conversationData.statuses || !session.conversationData.priorities)) {
            session.beginDialog("user-profile:setup");
        } else if(session.message.text.length == 0 && (!session.userData.jira || !session.userData.jira.host || !session.userData.jira.oauth)) {
            session.beginDialog("user-profile:initiate");
        } else if(!session.userData.jira || !session.userData.jira.host || !session.userData.jira.oauth) {
            session.beginDialog("user-profile:initiate", {redo: true});
        }
         else {
            next();
        }
    }
}

Setup.allowedActions = ["help","reinitiate","reauthenticate"];

module.exports = Setup;