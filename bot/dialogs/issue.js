"use strict";

const util = require('util');
const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('issue');
const _ = require('underscore');

let jira;

lib.dialog('getbyid', [
     (session) => {
         session.conversationData.ticket = validateTicketNumber(session.message.text);
         if(!session.conversationData.ticket) {
            builder.Prompts.text(session, 'Sorry, what is the ticket number again?');
        }
    },
    (session,results) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            jira = new Jira({
                oauth: {
                    access_token: session.userData.oauth.accessToken,
                    access_token_secret: session.userData.oauth.accessTokenSecret,
                }
            });
            const id = session.conversationData.ticket || results.response;
            const issues = jira.getById({id: id});
            if (issues == "error"){
                session.send("Oops! an error accurd while retrieving the tickets, please try again later");
            }
            let cards = _.map(issues, (issue,i) => {
                const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
                return new builder.HeroCard(session)
                    .title(issue.key)
                    .subtitle(issue.fields.summary)
                    .text(issue.fields.status.name + "\n\n" +
                            "Assignee: " + assignee + "\n\n" +
                            "End date: " + issue.fields.dueDate
                        );
            });
            let msg = new builder.Message(session);
            msg.text("here! ordered by date and priority!")
            msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
            msg.attachments(cards);
            // session.send(msg).endDialog().cancelDialog("filter:/");
            session.conversationData = null;
            session.endConversation(msg);
        } catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the tickets, please try again later", error);
        }
    }
]).triggerAction({ matches: /^(show me)\b/i })
.endConversationAction(
    "endfilter", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel your search. Are you sure?"
    }
);


lib.dialog('get', [
    async (session,args, next) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            jira  = new Jira({
                oauth: {
                    access_token: session.userData.oauth.accessToken,
                    access_token_secret: session.userData.oauth.accessTokenSecret,
                }
            });
            /*
            Object.assign(session.dialogData, args);
            Object.assign(session.dialogData.filter.project, session.userData.projects)
            */
            const count = await jira.getCount(session.conversationData);
            if(count >= 10) { 
                builder.Prompts.choice(session, "looks like there is " + count + " tickets, would you like to add some additinal filters",
                "yes|no",
                builder.ListStyle.button);
            } else if (count == 0) {
                session.send("looks like there is no tickets with the search parameters!");
            } else if (count == -1 ) {
                session.send("Oops! an error accurd while retrieving the tickets, please try again later");
            } 
            else {
                session.replaceDialog("issue:fetch", session.conversationData);
            }
        }
        catch(error) {
            session.send("Oops! an error accurd: %s, while retrieving the tickets, please try again later", error);
        }
        
    },
    (session, results, next) => {
        if (results.response) {
            if(results.response.entity == "yes") {
                session.replaceDialog("filter:/", session.conversationData);
            }
            else{
                session.replaceDialog("issue:fetch", session.conversationData);
            }
        }
        else {
            session.replaceDialog("issue:fetch", session.conversationData);
        }
    },
]);

lib.dialog("fetch", async (session, args) => {
    try {
        session.userData.oauth = session.userData.oauth || {};
        jira  = new Jira({
            oauth: {
                access_token: session.userData.oauth.accessToken,
                access_token_secret: session.userData.oauth.accessTokenSecret,
            }
          });
        //args = Object.assign(args || session.dialogData, session.userData.projects);
        session.sendTyping();
        const result = await jira.searchJira(session.conversationData);
        let cards = _.map(result.issues, (issue,i) => {
            const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
            return new builder.HeroCard(session)
                .title(issue.key)
                .subtitle(issue.fields.summary)
                .text(issue.fields.status.name + "\n\n" +
                        "Assignee: " + assignee + "\n\n" +
                        "End date: " + issue.fields.dueDate
                    );
        });
        let msg = new builder.Message(session);
        msg.text("here! ordered by date and priority!")
        msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
        msg.attachments(cards);
        session.send(msg).endDialog(); //.cancelDialog("filter:/");
    }
    catch(error) {
        session.send("Oops! an error accurd: %s, while retrieving the tickets, please try again later", error);
    }
});

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};