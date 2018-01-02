"use strict";

let util = require('util');
let builder = require('botbuilder');

let lib = new builder.Library('help');

lib.dialog("/", (session) => {
        let card = new builder.HeroCard(session)
                .title("Guide")
                .subtitle("when using the bot you have multiple choices:")
                .text("1) In case you decide to ask guideness from the bot by choosing yes for guided search please follow the bot questions. \n\n" +
                      "2) In case you ask for a ticket details please type 'show me' followed by the ticket number. \n\n" +
                      "3) In case you prefer the free search type 'get' or 'provide' or 'search' followed with your search parameters, in this case "+
                        "the bot can recognize your intent and analyze the parameters. \n\n",
                        "You can search based on status, assignee, task end date, task type, priority or even by subject which is mentioned in Jira" +
                        "summary.\n\n",
                        "example: get me issues related to CRXXX for which status is open and in progress, priority is high and issue type is story"
                    );
        let msg = new builder.Message(session);
        msg.attachments([card]);
        session.endDialog(msg);
    }
)
.triggerAction({ matches: /.*?(help)\W*(me|us)?\W*/i });

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};