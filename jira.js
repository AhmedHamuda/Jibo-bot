"use strict";
const _s =  require('underscore.string');
const _ =  require('underscore');
const dateformat = require("dateformat");
const project = require("./constants/constants").project;
const JiraApi = require("jira-client");

module.exports = class Jira extends JiraApi {

    async getCount(args) {
        _.extend(args, {maxResult: 0, fields: ["none"]});
        const result =  await this.searchJira(args);
        if (result == "error") return result;
        return result.issues.length;
    }

    searchJira (args, options) {
        let query, queryString, orderBy;
        options = options ? options : {}; 
        options.fields = options.fields ? options.fields : ["id", "key", "summary", "status", "assignee", "duedate"];
        args.filter = args.filter || {};
        query = this.parseFilterParams(args.filter);
        orderBy = "order by " + (this.parseOrderParams(args.order) || "priority ASC, duedate ASC, status ASC");
        queryString = _s.sprintf("%s %s", query, orderBy);
        return super.searchJira(queryString, options);
    }
    
    parseFilterParams(args) {
        let paramsArray = [];
        args.subject && paramsArray.push(_s.sprintf("(text ~ '%s*' or project = '%s')", args.subject, args.subject));
        args.assignee && paramsArray.push(_s.sprintf("assignee in (%s)", _.isArray(args.assignee) ? args.assignee.join(",") : args.assignee));
       // project && paramsArray.push(_s.sprintf("project in (%s)",  _.isArray(project) ? project.join(",") : project));
        args.priority && paramsArray.push(_s.sprintf("priority in (%s)", args.priority));
        args.stream && paramsArray.push(_s.sprintf("labels in (%s)", args.stream));
        args.duedate && paramsArray.push(_s.sprintf("(duedate <= %s or duedate is empty)", _s.quote(dateformat(args.duedate,"yyyy/mm/dd"),"'")));
        args.created && paramsArray.push(_s.sprintf("created => %s", _s.quote(dateformat(args.created,"yyyy/mm/dd"),"'")));
        args.status && paramsArray.push(_s.sprintf("status in (%s)", _.map(args.status, (stat) => {
            return _s.quote(stat, "'");
        }).join(",")));
        args.issueType && paramsArray.push(_s.sprintf("issuetype in (%s)", _.map(args.issueType, (is_typ) => {
        return _s.quote(is_typ, "'");
        }).join(",")));

        return paramsArray.join(_s.quote("and", " "));
    }

    parseOrderParams(args) {
        let orderArray = [];
        const orderProps = args.orderBy ? args.orderBy.length : 0;
        const dirOps = args.orderByDirection ? args.orderByDirection.length : 0;
        if(orderProps == dirOps && orderProps > 0) {
            for (var i = 0; i <= orderProps; i++) {
                orderArray.push(args.orderBy[i] + " " + args.orderByDirection[i]);
            }
        }
       
        return orderArray.join(_s.quote(",", " "));
    }
}