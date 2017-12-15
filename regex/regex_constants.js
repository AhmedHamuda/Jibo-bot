"use strict";
let _s = require("underscore.string");
const constants = {
    filterOpts: ["subject","status","stream","issue-type","due-date","assignee"],
    searchOpts: { status: {
                    statuses: ["to do", "open","in progress", "resolved", "closed", "reopened", "done", "ready for SIT", "ready for prod"],
                    text: ""
                },
                issueType: {
                    issuetypes: ["story","stories","bug","epic","improvement","new feature","task","deployment request","task","issue","ticket","defect"],
                    text: "",
                },
                priority: {
                    priorities: ["highest","high","medium","low","lowest"],
                    text: "",
                },
                dueDate: {
                    regex: new RegExp(/.*(end date|due date|finish date|close date)\s*([^\n\r]*)\b/),
                    text: "",
                },
                subject: {
                    regex: new RegExp(/.*(related to|related|equals|matches|subject is|subject)\s*([^\n\r]*)\b/),
                    text: "",
                },
                assignee: {
                    regex: new RegExp(/.*(assigned to|assignee is)\s*([^\n\r]*)\b/),
                    text: "",
                },
            },
    status: ["To Do", "Open","In Progress", "Reopened", "Ready for SIT", "Ready for Prod", "Resolved", "Closed", "Done"],
    stream: ["Stream_SCM","Stream_FIN"],
    priority: ["Highest","High","Medium","Low","Lowest"],
    issuetype: ["Story","Bug","Epic","Improvement","New Feature","Task","Deployment Request"],
    project: ["ERPOPSDEV","W3M"],
    mapping: {
        issuetype: {
                Story: "Stories",
                Bug: "Bugs",
                Epic: "Epics",
                Improvement: "Improvements",
                New_Feature: "New Features",
                Task: "Tasks",
                Deployment_Request: "Deployment Request"
            }
    },
    dateFormat: ["this day","this month","this year","next day","next month","next year"]
}
constants.searchOpts.status.regex = new RegExp("(?:|^)("+constants.searchOpts.status.statuses.join("\\b|\\b")+")(?=[\\s]|$)","gi");
constants.searchOpts.issueType.regex =  new RegExp("(?:|^)("+constants.searchOpts.issueType.issuetypes.join("s?\\b|\\b")+")(?=[\\s]|$)","gi");
constants.searchOpts.priority.regex =  new RegExp("(?:|^)("+constants.searchOpts.priority.priorities.join("\\b|\\b")+")(?=[\\s]|$)","gi");
module.exports = constants;