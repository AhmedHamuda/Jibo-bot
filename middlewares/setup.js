"use strict";

class Setup {
    static isAllowed (session, next) {
        if (process.env.MICROSOFT_APP_ID && process.env.MICROSOFT_APP_PASSWORD) {
            const conversationId = session.message.address.conversation.id;
            session.connector.fetchMembers(session.message.address.serviceUrl, conversationId, (err, result) => {
                if (err) {
                    console.log("error: %s", err);
                }
                else {
                    let email = result[0].email; // This is a 1:1 chat
                    let isMember = email.endsWith("@yourdomain.com");
                    if (isMember) {
                    next();
                    }
                    else {
                        session.send("Sorry, you should be a member of %s to use me", process.env.ALLOWED_DOMAIN);
                    }
                }
            });
        } else {
            next();
        }
    }
}

Setup.allowedActions = ["help","reinitiate","reauthenticate"];

module.exports = Setup;