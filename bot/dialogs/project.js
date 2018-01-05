"use strict";

const builder = require('botbuilder');
const Jira = require("../../jira/jira");
const lib = new builder.Library('project');
const _ = require("underscore"); 
lib.dialog('list',
    async (session,args, next) => {
        try {
            let jira = new Jira(session.userData.jira);
            const projects = await jira.listProjects();
            session.userData.projects =  _.map(projects, (project) => { return project.key;});
            session.endDialog();
        }
        catch(error) {
            session.endDialog("Oops! an error accurd: %s, while retrieving the projects, please try again later", error);
        } 
    });

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};