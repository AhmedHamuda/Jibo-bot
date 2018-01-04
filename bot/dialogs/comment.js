"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('comment');
const _ = require("underscore");
const helpers = require("../../common/helpers");

lib.dialog('add', [ 
    (session, args, next) => {
        if(args && args.redo) {
            builder.Prompts.text(session, "Please enter a valid issue number");
         } else if (args && args.entities) {
            session.dialogData.entities = args.entities;
            const issueNumber = builder.EntityRecognizer.findEntity(args.entities, 'issueNumber') || undefined;
            if(!issueNumber) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.dialogData.issueNumber = helpers.checkIssueNumberFormat(issueNumber.entity.replace(/[^0-9a-zA-Z\-]/gi, ''));
                if(!session.conversationData.issueNumber) {
                    builder.Prompts.text(session, 'Please enter the issue number again');
                } else{
                    next();
                }
            }
         } else {
            builder.Prompts.text(session, 'Please enter the issue number');
         }
    },
    (session, results, next) => {
        if(!session.dialogData.issueNumber) {
            if (results && results.response) {
                session.dialogData.issueNumber = results.response;
                builder.Prompts.text(session, 'Please enter your comment');
            } else {
                session.replaceDialog("comment:add", {redo: true});
            }
        } else {
            builder.Prompts.text(session, 'Please enter your comment');
        }
     },
     async (session, results, next) => {
        try {
            if (results && results.response) {
                session.userData.oauth = session.userData.oauth || {};
                let jira = new Jira({
                    oauth: {
                        access_token: session.userData.oauth.accessToken,
                        access_token_secret: session.userData.oauth.accessTokenSecret,
                    }
                });
                const issueNumber =  session.dialogData.issueNumber;
                const comment = results.response;
                const result = await jira.addComment(issueNumber, comment);
                session.endDialog("Comment (%s) added to issue %s",comment, issueNumber);
            } else {
                session.replaceDialog("comment:add", {redo: true});
            }
        } catch (error) {
            if(error.statusCode == 404) {
                session.send("Issue doesn't exist!")
                session.replaceDialog("comment:add", {redo: true});
            } else if(error.statusCode == 401) {
                session.send("Sorry %s, You dont have permission to add comment to this issue", session.message.address.user.name)
                session.endDialog();
            } else {
                session.endDialog("Oops! An error accurd: %s. Please try again", error.errorMessages || error);
            }
        }
     }
]);


lib.dialog('get', [ 
    (session, args, next) => {
        if(args && args.redo) {
            builder.Prompts.text(session, "Please enter a valid issue number");
         } else if (args && args.entities) {
            session.dialogData.entities = args.entities;
            const issueNumber = builder.EntityRecognizer.findEntity(args.entities, 'issueNumber') || undefined;
            if(!issueNumber) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.dialogData.issueNumber = helpers.checkIssueNumberFormat(issueNumber.entity.replace(/[^0-9a-zA-Z\-]/gi, ''));
                if(!session.conversationData.issueNumber) {
                    builder.Prompts.text(session, 'Please enter the issue number again');
                } else {
                    next();
                }
            }
         } else {
            builder.Prompts.text(session, 'Please enter the issue number');
         }
    },
     async (session, results, next) => {
        try {
            if (session.dialogData.issueNumber || (results && results.response)) {
                session.userData.oauth = session.userData.oauth || {};
                let jira = new Jira({
                    oauth: {
                        access_token: session.userData.oauth.accessToken,
                        access_token_secret: session.userData.oauth.accessTokenSecret,
                    }
                });
                const issueNumber =  session.dialogData.issueNumber || results.response;
                const result = await jira.getComments(issueNumber);
                if(result){
                    let cards = _.map(result.comments, (comment,i) => {
                        return new builder.HeroCard(session)
                            .title(comment.author.displayName)
                            .subtitle(
                                "Created: " +comment.created + "\n\n" +
                                "Updated: " + comment.updated
                            )
                            .text(comment.body);
                    });
                    let msg = new builder.Message(session);
                    msg.attachmentLayout(builder.AttachmentLayout.list)
                    msg.attachments(cards);
                    session.send(msg);
                    session.endDialog("Anything else I can help with?");
                } else {
                    session.endDialog("There is no comment on issue %s", issueNumber);
                }
            } else {
                session.replaceDialog("comment:get", {redo: true});
            }
        } catch (error) {
            if(error.statusCode == 404) {
                session.send("Issue or user doesn't exist!")
                session.replaceDialog("comment:get", {redo: true});
            } else if(error.statusCode == 401) {
                session.send("Sorry %s, You dont have permission to assign the issue", session.message.address.user.name)
                session.endDialog();
            } else {
                session.endDialog("Oops! An error accurd: %s. Please try again", error.errorMessages || error);
            }
        }
     }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};