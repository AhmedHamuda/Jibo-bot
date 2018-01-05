"use strict";
module.exports = class Setup {
    static checkJiraConfig (session, next) {
        if (session.message.text != "reauthenticate" || session.message.text != "reinitiate" || session.message.text.length > 0) {
            if (!session.userData.jira || !session.userData.jira.host || !session.userData.jira.port || !session.userData.jira.protocol
            || !session.userData.jira.oauth || !session.userData.jira.oauth.access_token || !session.userData.jira.oauth.access_token_secret) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                next();
            }
        } else {
            next();
        }
        
    }

    static checkSetup (session, next) {
        if(session.userData.jira && session.userData.jira.oauth) {
            if (!session.userData.projects || !session.conversationData.issueTypes || !session.conversationData.statuses || !session.conversationData.priorities) {
                session.replaceDialog("user-profile:setup");
            } else {
                next();
            }
        }
    }
} 