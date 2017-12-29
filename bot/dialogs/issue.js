"use strict";

const util = require('util');
const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('issue');
const _ = require('underscore');

let jira;

lib.dialog('getbyid', [
     (session, args) => {
         if(args && args.redo) {
            builder.Prompts.text(session, 'Please enter a valid issue number');
         } else if (args && args.entities) {
            const issueNumber = builder.EntityRecognizer.findEntity(args.entities, 'issueNumber') || null;
            if(_.isNull(issueNumber)) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.dialogData.issueNumber = issueNumber.entity;
            }
         } else {
            builder.Prompts.text(session, 'Please enter the issue number');
         }
    },
    async (session,results) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            jira = new Jira({
                oauth: {
                    access_token: session.userData.oauth.accessToken,
                    access_token_secret: session.userData.oauth.accessTokenSecret,
                }
            });
            const issueNumber = session.dialogData.issueNumber || results.response;
            const issue = await jira.findIssue(issueNumber, "", "id,key,summary,status,assignee,duedate,resolutiondate");
            if (issue) {
                const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
                let card = new builder.HeroCard(session)
                        .title(issue.key)
                        .subtitle(issue.fields.summary)
                        .text(issue.fields.status.name + "\n\n" +
                                "Assignee: " + assignee + "\n\n" +
                                "End date: " + issue.fields.duedate + "\n\n" +
                                "Resolution date: " + issue.fields.resolutiondate
                            );
                let msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
                msg.attachments([card]);
                session.send(msg);
                session.endDialog("Anything else I can help with?");
            } else {
                session.send("No issue found bu number (%s). Please try searching again", issueNumber);
            }
        } catch(error) {
            if(error.statusCode == 404) {
                session.replaceDialog("issue:getbyid", {redo: true});
            } else {
                session.send("Oops! An error accurd: %s. Please try again", error.errorMessage || error);
            }
        }
    }
]);

lib.dialog('getDevStatus', [
    (session, args) => {
        if(args.redo) {
            builder.Prompts.text(session, 'Please enter a valid issue number');
        } else {
            builder.Prompts.text(session, 'Please enter the issue number');
        }
    },
    (session, results) => {
       if (results && results.response) {
            session.dialogData.issueNumber = results.response;
            builder.Prompts.choice(session,"Please choose an application type:",
            ["stash", "bitbucket"],
            builder.ListStyle.button);
       } else {
            session.replaceDialog("issue:getDevStatus", {redo: true});
       }
    },
    (session, results) => {
        session.dialogData.applicationType = results.response.entity;
        builder.Prompts.choice(session,"Please choose an application type:",
        ["repository", "pullrequest"],
        builder.ListStyle.button);
    },
    async (session,results) => {
       try {
           session.dialogData.dataType = results.response.entity;
           session.userData.oauth = session.userData.oauth || {};
           jira = new Jira({
               oauth: {
                   access_token: session.userData.oauth.accessToken,
                   access_token_secret: session.userData.oauth.accessTokenSecret,
               }
           });
           const devStatus = await jira.getDevStatusDetail(
                                    session.dialogData.issueNumber,
                                    session.dialogData.applicationType,
                                    session.dialogData.dataType);
           console.log(devStatus);
           let cards = _.map(issues, (issue,i) => {
               const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
               return new builder.HeroCard(session)
                   .title(issue.key)
                   .subtitle(issue.fields.summary)
                   .text(issue.fields.status.name + "\n\n" +
                           "Assignee: " + assignee + "\n\n" +
                           "End date: " + issue.fields.duedate + "\n\n" +
                           "Resolution date: " + issue.fields.resolutiondate
                       );
           });
           let msg = new builder.Message(session);
           msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
           msg.attachments(cards);
           session.send(msg);
           session.endDialog("Anything else I can help with?");
       } catch(error) {
            if(error.statusCode == 404) {
                session.replaceDialog("issue:getDevStatus", {redo: true});
            } else {
                session.send("Oops! An error accurd: %s. Please try again", error.errorMessage || error);
            }
       }
   }
]);

lib.dialog('getDevSummary', [
    (session, args) => {
        if (args.redo) {
            builder.Prompts.text(session, 'Please type a valid issue Id');
        } else {
            builder.Prompts.text(session, 'Please enter the issue Id');
        }
    },
    async (session,results) => {
       try {
           if(results && result.response) {
                session.userData.oauth = session.userData.oauth || {};
                jira = new Jira({
                    oauth: {
                        access_token: session.userData.oauth.accessToken,
                        access_token_secret: session.userData.oauth.accessTokenSecret,
                    }
                });
                const issueNumber = session.dialogData.issueNumber || results.response;
                const issues = await jira.findIssue(issueNumber, "", "id,key,summary,status,assignee,duedate,resolutiondate");
                let cards = _.map(issues, (issue,i) => {
                    const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
                    return new builder.HeroCard(session)
                        .title(issue.key)
                        .subtitle(issue.fields.summary)
                        .text(issue.fields.status.name + "\n\n" +
                                "Assignee: " + assignee + "\n\n" +
                                "End date: " + issue.fields.duedate + "\n\n" +
                                "Resolution date: " + issue.fields.resolutiondate
                            );
                });
                let msg = new builder.Message(session);
                msg.text("here! ordered by date and priority!")
                msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
                msg.attachments(cards);
                session.send(msg);
                session.endDialog("Anything else I can help with?");
            } else {
                session.replaceDialog("issue:getDevSummary", {redo: true});
            }
       } catch(error) {
            if(error.statusCode == 404) {
                session.replaceDialog("issue:getDevSummary", {redo: true});
            } else {
                session.send("Oops! An error accurd: %s. Please try again", error.errorMessage || error);
            }
       }
   }
]);

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
            
            */
            session.conversationData.projects = session.userData.projects;
            const count = await jira.getCount(session.conversationData);
            if(count >= 10) { 
                builder.Prompts.choice(session, "looks like there is " + count + " tickets, would you like to add some additinal filters",
                "yes|no",
                builder.ListStyle.button);
            } else if (count == 0) {
                session.send("looks like there is no tickets with the search parameters!");
            } else if (count == -1 ) {
                session.send("Oops! an error accurd while retrieving the tickets. Please try again later");
            } 
            else {
                session.replaceDialog("issue:fetch", session.conversationData);
            }
        }
        catch(error) {
            session.send("Oops! An error accurd: %s, while retrieving the tickets. Please try again later", error.errorMessage || error);
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
        session.conversationData.projects = session.userData.projects;
        session.sendTyping();
        const result = await jira.searchJira(session.conversationData);
        let cards = _.map(result.issues, (issue,i) => {
            const assignee = !_.isNull(issue.fields.assignee) ? issue.fields.assignee.displayName : "unassigned";
            return new builder.HeroCard(session)
                .title(issue.key)
                .subtitle(issue.fields.summary)
                .text(issue.fields.status.name + "\n\n" +
                        "Assignee: " + assignee + "\n\n" +
                        "End date: " + issue.fields.duedate + "\n\n" +
                        "Resolution date: " + issue.fields.resolutiondate
                    );
        });
        let msg = new builder.Message(session);
        msg.text("here! ordered by date and priority!")
        msg.attachmentLayout(builder.AttachmentLayout.list/*.carousel*/)
        msg.attachments(cards);
        session.send(msg);
        session.endDialog("Anything else I can help with?");
    }
    catch(error) {
        session.send("Oops! An error accurd: %s, while retrieving the tickets. Please try again later", error.errorMessage || error);
    }
});

// Export createLibrary() function
module.exports.createLibrary =  () => {
    return lib.clone();
};