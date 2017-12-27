"use strict";
const _s =  require('underscore.string');
const _ =  require('underscore');
const dateformat = require("dateformat");
const JiraApi = require("jira-client");
const fs = require("file-system").fs;
const path = require("path");
module.exports = class Jira extends JiraApi {

    constructor(config) {
        config = config || {}; 
        let conf = {
            protocol: process.env.JIRA_PROTOCOL,
            host: process.env.JIRA_HOSTNAME,
            username: process.env.JIRA_USER,
            password: process.env.JIRA_PASSWORD,
            apiVersion: process.env.JIRA_REST_API_Version,
            port: process.env.JIRA_PORT,
            strictSSL: false,
            oauth: {
                consumer_key: process.env.JIRA_CONSUMER_KEY,
                consumer_secret: fs.readFileSync(path.join(path.resolve(process.env.USERPROFILE), ".ssh", process.env.JIRA_CONSUMER_KEY_SECRET)),
            }
        };
        Object.assign(conf.oauth, config.oauth);
        super(conf);
    }

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
        args.project && paramsArray.push(_s.sprintf("project in (%s)",  _.isArray( args.project) ?  args.project.join(",") :  args.project));
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
        args = args || {};
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