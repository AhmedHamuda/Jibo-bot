"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('project');
const _ = require("underscore");

lib.dialog('ask', [
    (session, args) => {
        if(!args || !args.redo) {
            session.conversationData.project = [];
        }
        let original = _.map(session.conversationData.projects, (proj) => {return proj.toLowerCase();});
        let selected = _.map(session.conversationData.project, (proj) => {return proj.toLowerCase();});
        const diff = _.difference(original, selected);
        if (diff.length > 0) {
            builder.Prompts.choice(session,"please choose a project:",
                diff,
                builder.ListStyle.button);
        } else {
            session.endDialog("you've selected all available projects");
        }
        
    },
    (session, results) => {
        session.conversationData.project.push(results.response.entity);
        builder.Prompts.choice(session,"would you like to choose additional project?",
       "yes|no",
        builder.ListStyle.button);
    },
    (session, results) => {
        if(results.response.entity == "yes") {
            session.replaceDialog("project:ask", {redo: true});
        }
        else{
            session.endDialogWithResult(); 
        }
    }
]);

lib.dialog('check', [
    (session, args) => {
        session.dialogData.args = args;
        session.beginDialog("project:list");
    },
    (session) => {
        try {
            let args = session.dialogData.args;
            if(args) {  
                    session.conversationData.project = session.conversationData.project || [];
                    let original = _.map(session.conversationData.projects, (proj) => {return proj.toLowerCase();});
                    args = _.isArray(args) ? _.map(args, (proj) => {return proj.toLowerCase();}): [args];
                    const diff = _.difference(args, original);
                    if (diff.length > 0) {
                        session.send("Requested project ("+ diff.join(", ") +") are not available in Jira");
                        session.conversationData.project = _.intersection(args, original) || [];
                        session.replaceDialog("project:ask", {redo: true});
                    } else {
                        session.conversationData.project = args;
                        session.endDialog();
                    }    
            } else {
                session.endDialog();
            }
        } catch (error) {
            session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
        }
    }
]);

lib.dialog('list',
    async (session,args, next) => {
        try {
            let jira = new Jira(session.userData.jira);
            const projects = await jira.listProjects();
            session.userData.projects =  _.map(projects, (project) => { return project.key;});
            session.endDialog();
        }
        catch(error) {
            if (error.message == process.env.JIRA_AUTHERR) {
                session.replaceDialog("user-profile:initiate", {redo: true});
            } else {
                session.endDialog("Oops! %s. Please try again", (error.error && _.first(error.error.errorMessages)) || error.message || error);
            }
        } 
    });

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};