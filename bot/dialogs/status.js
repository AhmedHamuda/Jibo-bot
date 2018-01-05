"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('status');
const _ =  require('underscore');
const helpers = require("../../common/helpers");

lib.dialog('ask', [
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.status = [];
        }
        let original = _.map(session.conversationData.statuses, (status) => {return status.toLowerCase();});
        let selected = _.map(session.conversationData.status, (status) => {return status.toLowerCase();});
        const diff = _.difference(original, selected);
        if (diff.length > 0) {
            builder.Prompts.choice(session,"please choose a status:",
                diff,
                builder.ListStyle.button);
        } else {
            session.endDialog("you've selected all available statuses");
        }
        
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
        try {
        if(args) {  
                session.conversationData.status = session.conversationData.status || [];
                let original = _.map(session.conversationData.statuses, (status) => {return status.toLowerCase();});
                args = _.isArray(args) ? _.map(args, (status) => {return status.toLowerCase();}): [args];
                const diff = _.difference(args, original);
                if (diff.length > 0) {
                    session.send("Requested statuses ("+ diff.join(", ") +") are not available in Jira");
                    session.conversationData.status = _.intersection(args, original) || [];
                    session.replaceDialog("status:ask", {redo: true});
                } else {
                    session.conversationData.status = helpers.checkAndApplyReversedStatus(original, args);
                    session.endDialog();
                }    
        } else {
            session.endDialog();
        }
    } catch (error) {
        session.endDialog("Oops! an error accurd: %s, while checking the statuses, please try again later", error);
    }
});

lib.dialog('list', 
    async (session,args, next) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira(session.userData.jira);
            const statuses = await jira.listStatus();
            session.conversationData.statuses = _.map(statuses, (status) => { return status.name;});
            session.endDialog();
        }
        catch(error) {
            session.endDialog("Oops! an error accurd: %s, while retrieving the statuses, please try again later", error);
        }
    });

lib.dialog('update', [ 
    (session, args, next) => {
        if(args && args.redo) {
            builder.Prompts.text(session, "Please enter a valid issue number");
        } else if (args && args.entities) {
            const status = builder.EntityRecognizer.findEntity(args.entities, 'status') || undefined;
            if(status) {
                session.conversationData.transitionStatus = _.isArray(status.entity) ? _.first(status.entity) : status.entity; 
            }
            const issueNumber = builder.EntityRecognizer.findEntity(args.entities, 'issueNumber') || undefined;
            if(issueNumber) {
                builder.Prompts.text(session, 'Please enter the issue number');
            } else {
                session.conversationData.issueNumber = helpers.checkIssueNumberFormat(issueNumber.entity.replace(/[^0-9a-zA-Z\-]/gi, ''));
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
    async (session, results, next) => {
        try {
            if (session.conversationData.issueNumber || (results && results.response)) {
                const issueNumber = session.conversationData.issueNumber = session.conversationData.issueNumber || results.response;
                let jira = new Jira(session.userData.jira);
                const result = await jira.listTransitions(issueNumber);
                session.conversationData.transitionStatuses = _.map(result.transitions, (transition) => {
                    return { 
                        name: transition.name,
                        id: transition.id,
                        fields: _.map(Object.keys(transition.fields), (field) => {
                            return {name: field, 
                                    required:transition.fields[field].required,
                                    type: transition.fields[field].schema.type,
                                    values: transition.fields[field].allowedValues,
                                    operations: transition.fields[field].operations,
                                    defaultValue: transition.fields[field].defaultValue
                                };
                            })
                        }
                });
                next();
            } else {
                session.replaceDialog("status:update", {redo: true});
            }
        } catch (error) {
            if(error.statusCode == 404) {
                session.endDialog("Issue doesn't exist or you dont have permission to view it!");
            } else {
                session.endDialog("Oops! An error accurd: %s. Please try again", error.errorMessages || error);
            }
        }
    },
    (session) => {
        session.beginDialog("status:transition");
    },
    async (session, results, next) => {
        try {
            session.userData.oauth = session.userData.oauth || {};
            let jira = new Jira(session.userData.jira);
            const issueNumber =  session.conversationData.issueNumber;
            const transit = session.conversationData.transitionStatus;
            const transationObj = helpers.buildTransitionObj(transit);
            const result = await jira.transitionIssue(issueNumber, transationObj);
            session.endDialog("Successfully change status of issue %s", issueNumber);
        } catch (error) {
            if(error.statusCode == 404) {
                session.endDialog("Issue doesn't exist or you dont have permission to change the status of this issue");
            } else if(error.statusCode == 400) {
                session.send("Provided data is not accepted by Jira");
                session.replaceDialog("status:update");
            } else {
                session.endDialog("Oops! An error accurd: %s. Please try again", error.errorMessages || error);
            }
        }
    }
]).endConversationAction(
    "endStatusUpdate", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$/i,
        confirmPrompt: "This will cancel status update. Are you sure?"
    }
);

lib.dialog("transition",[
    (session, args, next) => {
        if(session.conversationData.transitionStatuses && session.conversationData.transitionStatuses.length > 0) {
            next();
        } else {
            session.endDialog("Status not allowed to be changed for issue %s ", session.conversationData.issueNumber);
        }
    },
    (session, args, next) => {
        if(session.conversationData.transitionStatus) {
            session.beginDialog("status:transitionCheck");
        } else {
            next();
        }
    },
    (session) => {
        const selectedStatus = _.find(session.conversationData.transitionStatuses, (status) => {
            return  status.name.toLowerCase() == session.conversationData.transitionStatus.toLowerCase();
        });
        session.conversationData.transitionStatus = selectedStatus;
        session.beginDialog("transition:setFields");
    },
    (session, results) => {
        session.endDialog();
    }
]);

lib.dialog('transitionCheck', 
    (session) => {
        try {
            let original = _.map(session.conversationData.transitionStatuses, (status) => {return status.name.toLowerCase();});
            const status = session.conversationData.transitionStatus.toLowerCase();
            if (!_.contains(original,status)) {
                session.send("Not allowed to change status to (%s)",status);
                session.replaceDialog("status:transitionAsk");
            } else {
                session.endDialog();
            }    
    } catch (error) {
        session.endDialog("Oops! an error accurd: %s, while checking the statuses, please try again later", error);
    }
});

lib.dialog('transitionAsk', [
    (session, args) => {
        let original = _.map(session.conversationData.transitionStatuses, (status) => {return status.name.toLowerCase();});
            builder.Prompts.choice(session,"please choose a status:",
                original,
                builder.ListStyle.button);
    },
    (session, results) => {
        session.conversationData.transitionStatus = results.response.entity;
        session.endDialog();
    }
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};