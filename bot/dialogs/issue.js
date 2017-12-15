const util = require('util');
const builder = require('botbuilder');
const Jira = require("../../jira");
let lib = new builder.Library('issue');
const _ = require('underscore');
const constant = require("../../constants/constants");

let jira = new Jira({
     username: process.env.JIRA_USER,
     password: process.env.JIRA_PASSWORD
});

lib.dialog('getbyid', [
     (session) => {
         session.conversationData.ticket = validateTicketNumber(session.message.text);
         if(!session.conversationData.ticket) {
            builder.Prompts.text(session, 'Sorry, what is the ticket number again?');
        }
    },
    (session,results) => {
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
        const count = await jira.getCount(args);
        if(count >= 10) {
            Object.assign(session.dialogData, args);
            builder.Prompts.choice(session, "looks like there is " + count + " tickets, would you like to add some additinal filters",
            "yes|no",
            builder.ListStyle.button);
        } else if (count == 0) {
            session.send("looks like there is no tickets with the search parameters!");
        } else if (count == -1 ) {
            session.send("Oops! an error accurd while retrieving the tickets, please try again later");
        } 
        else {
            session.replaceDialog("issue:fetch", args);
        }
    },
    (session, results, next) => {
        if (results.response) {
            if(results.response.entity == "yes") {
                session.replaceDialog("filter:/", session.dialogData);
            }
            else{
                session.replaceDialog("issue:fetch", session.dialogData);
            }
        }
        else {
            session.replaceDialog("issue:fetch", session.dialogData);
        }
    },
]);

lib.dialog("fetch", async (session, args) => {
    session.sendTyping();
    const result = await jira.fetchAll(args);
    if (result == "error"){
        session.send("Oops! an error accurd while retrieving the tickets, please try again later");
    }
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
    // session.send(msg).endDialog().cancelDialog("filter:/");
    session.conversationData = null;
    session.endConversation(msg);
});

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};