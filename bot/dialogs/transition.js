"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('transition');
const _ =  require('underscore');
const helpers = require("../../common/helpers");

lib.dialog("setFields", [
    (session, args) => {
        if(session.conversationData.transitionStatus &&
            session.conversationData.transitionStatus.fields &&
            session.conversationData.transitionStatus.fields.length > 0) {
                const fields = session.conversationData.transitionStatus.fields;
                const field = _.find(fields,(field)=>{ if(!field.value) { return field}});
                if (field) {
                    switch (field.type) {
                        case "array":
                        session.beginDialog("transition:multivalue", {field: field});
                        break;
                        case "date":
                        session.beginDialog("transition:date", {field: field});
                        break;
                        default:
                        session.beginDialog("transition:text", {field: field});
                        break;
                    }
                }else {
                    session.endDialogWithResult();
                }
        } else {
            session.endDialogWithResult();
        }
    },
    (session, args)=> {
        let field = _.findWhere(session.conversationData.transitionStatus.fields,{name: args.name}); 
        field.value = args.value; 
        session.replaceDialog("transition:setFields");
    }
]);

lib.dialog("multivalue", [
    (session, args) => {
        session.dialogData.field = args.field;
        if(session.dialogData.field &&
            session.dialogData.field.allowedValues &&
            session.dialogData.field.allowedValues.length > 0) {
            builder.Prompts.choice(session,"Please choose a value for" + session.dialogData.field.name + ":",
                field.allowedValues,
                builder.ListStyle.button);
        } else {
            session.endDialogWithResult(field);
        }
    },
    (session, results) => {
        if(results && result.response) {
            session.dialogData.field.value = result.response.entity;
            session.endDialogWithResult(session.dialogData.field);
        } else {
            session.replaceDialog("transition:multivalue", { field: session.dialogData.field });
        }
    },
]);

lib.dialog("date", [
    (session, args) => {
        session.dialogData.field = args.field;
        if(session.dialogData.field) {
            builder.Prompts.time(session,"Please enter a value for" + session.dialogData.field.name + ":");
        } else {
            session.endDialogWithResult(field);
        }
    },
    (session, results) => {
        if(results && result.response) {
            session.dialogData.field.value = builder.EntityRecognizer.parseTime(result.response);
            session.endDialogWithResult(session.dialogData.field);
        } else {
            session.replaceDialog("transition:date", { field: session.dialogData.field });
        }
    },
]);

lib.dialog("text", [
    (session, args) => {
        session.dialogData.field = args.field;
        if(session.dialogData.field) {
            builder.Prompts.text(session,"Please enter a value for" + session.dialogData.field.name + ":");
        } else {
            session.endDialogWithResult(field);
        }
    },
    (session, results) => {
        if(results && result.response) {
            session.dialogData.field.value =result.response;
            session.endDialogWithResult(session.dialogData.field);
        } else {
            session.replaceDialog("transition:date", { field: session.dialogData.field });
        }
    },
]);

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};