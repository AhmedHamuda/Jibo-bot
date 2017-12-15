let _s =  require('underscore.string');
let constant = require("../constants/constants");
let chrono = require("chrono-node");
let _ = require("underscore");

module.exports = class RegexRecognizer {
    getMessageContent(text) {
        //LUIS job in the future!
        let result = {};
        let searchPatts = _.keys(constant.searchOpts);
        _.each(searchPatts, function (opt) {
            if(constant.searchOpts[opt].regex.test(text)) {
                constant.searchOpts[opt].text = text;
            }
        });
        result.subject = getSubject(constant.searchOpts.subject);
        result.status = getStatus(constant.searchOpts.status);
        result.assignee = getAssignee(constant.searchOpts.assignee);
        result.issueType = getIssueType(constant.searchOpts.issueType);
        result.priority = getPriority(constant.searchOpts.priority);
        result.dueDate = getDueDate(constant.searchOpts.dueDate);
        return result;
    }
    
    getSubject(sSubject) {
        let subject = "";
        if(sSubject.text.length > 0) {
            let subject = _.last(sSubject.regex.exec(sSubject.text));
        }
        return subject;
    }
    
    getAssignee(sAssignee) {
        let assignee = "";
        if(sAssignee.text.length > 0) {
            let assignee = _.last(sAssignee.regex.exec(sAssignee.text));
        }
        return assignee;
    }
    
    getDueDate(sDueDate) {
        let dueDate = null;
        if(sDueDate.text.length > 0) {
            let date =  _.last(sDueDate.regex.exec(sDueDate.text));
            date = date.replace(/\./g,"/");
            dueDate = chrono.parseDate(date);
        }
        return dueDate;
    }
    
    getStatus(sStatus) {
        //To do: process and/or operators 
        let status = null;
        if(sStatus.text.length) {
            status = [];
            let m;
            sStatus.regex.lastIndex = 0; //global flag is enabled -> reset the last index after the test or jump to the next match group
            while ((m = sStatus.regex.exec(sStatus.text)) !== null) {
                if (m.index === sStatus.regex.lastIndex) { // This is necessary to avoid infinite loops with zero-width matches
                    sStatus.regex.lastIndex++;
                }
                status = status.concat(m);
            }
            status = _.uniq(status)
            status = _.map(status,(str) => {
                return str.replace(/\w\S*/g, (txt)=> {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            status = _.intersection(status,constant.status);
        }
        return status;
    }
    
    getIssueType(sIssueType) {
        //To do: process and/or operators 
        let issuetypes = null;
        if(sIssueType.text.length) {
            issuetypes = [];
            let m;
            sIssueType.regex.lastIndex = 0; //global flag is enabled -> reset the last index after the test or jump to the next match group
            while ((m = sIssueType.regex.exec(sIssueType.text)) !== null) {
                if (m.index === sIssueType.regex.lastIndex) { // This is necessary to avoid infinite loops with zero-width matches
                    sIssueType.regex.lastIndex++;
                }
                issuetypes = issuetypes.concat(_.uniq(m));
            }
            issuetypes = _.uniq(issuetypes);
            issuetypes = _.map(issuetypes,(str) => {
                let it = str.replace(/\w\S*/g, (txt)=> {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
                return _.findKey(constant.mapping.issuetype, function(value, key) {
                    return value == it ?  key : null ; 
                        }) || it; 
            });
            issuetypes = _.intersection(issuetypes,constant.issuetype);
        }
        return issuetypes;
    }
    
    getPriority(sPriority) {
        //To do: process and/or operators 
        let priority = null;
        if(sPriority.text.length) {
            priority = [];
            let m;
            sPriority.regex.lastIndex = 0; //global flag is enabled -> reset the last index after the test or jump to the next match group
            while ((m = sPriority.regex.exec(sPriority.text)) !== null) {
                if (m.index === sPriority.regex.lastIndex) { // This is necessary to avoid infinite loops with zero-width matches
                    sPriority.regex.lastIndex++;
                }
                priority = priority.concat(_.uniq(m));
            }
            priority = _.uniq(priority);
            priority = _.map(priority,(str) => {
                return str.replace(/\w\S*/g, (txt)=> {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
            priority = _.intersection(priority,constant.priority);
        }
        return priority;
    }

    validateTicketNumber(text) {
        let regex = new RegExp(".*(show)\s*(me)\s*([^\n\r]*)\s*("+_.map(constant.project, (prj) => { return prj+"\d*";}).join("|") + ")\b","i");
        let ticket = null;
        if(text.length > 0) {
            let ticket = _.last(regex.exec(text));
        }
        return ticket;
    }
}