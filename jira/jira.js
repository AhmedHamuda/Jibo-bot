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
        let oauth;
        if (process.env.JIRA_CONSUMER_KEY_SECRET && process.env.JIRA_CONSUMER_KEY) {
            oauth = {
                consumer_key: process.env.JIRA_CONSUMER_KEY,
                consumer_secret: fs.readFileSync(path.join(path.resolve(process.env.USERPROFILE), process.env.PRIV_KEY_DIR, process.env.JIRA_CONSUMER_KEY_SECRET)),
            };
        } else {
            throw new Error("missing OAuth consumer key and consumer secret");
        }
        Object.assign(oauth, config.oauth);
        let conf = {
            apiVersion: process.env.JIRA_REST_API_Version,
            strictSSL: false,
        };
        Object.assign(conf, config);
        conf.oauth = oauth;
        if(!oauth.access_token || !oauth.access_token_secret) {
            throw new Error(process.env.JIRA_AUTHERR);
        } else {
            super(conf);
        }
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
        options.fields = options.fields ? options.fields : ["id", "key", "summary", "status", "priority", "assignee", "duedate", "resolutiondate", "issuetype"];
        query = _.isObject(args) ? this.parseFilterParams(args) : args;
        orderBy = args.order && args.order.orderBy ? "order by " + (this.parseOrderParams(args.order)): "";
        queryString = _s.sprintf("%s %s", query, orderBy);
        return super.searchJira(queryString, options);
    }
    
    parseFilterParams(args) {
        let paramsArray = [];
        args.subject && paramsArray.push(_s.sprintf("(text ~ '%s*')", args.subject, args.subject));
        args.assignee && paramsArray.push(_s.sprintf("assignee in (%s)", _.isArray(args.assignee) ? args.assignee.join(",") : args.assignee));
        if(args.project) {
            paramsArray.push(_s.sprintf("project in (%s)",  _.isArray(args.project) ? args.project.join(",") :  args.project));
        }else if (args.projects && args.projects.length > 0) {
            paramsArray.push(_s.sprintf("project in (%s)", args.projects.join(",")));
        }
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
        } else {
            orderArray = args.orderBy;
        }
       
        return orderArray.join(_s.quote(",", " "));
    }

    assign(issueId, username, options = {}) {
        return this.doRequest(this.makeRequestHeader(this.makeUri({
          pathname: `/issue/${issueId}/assignee`,
        }), {
          body: {
            name: username,
            ...options,
          },
          method: 'PUT',
          followAllRedirects: true,
        }));
    }

    getComments(issueId, options= {}){
        return this.doRequest(this.makeRequestHeader(this.makeUri({
            pathname: `/issue/${issueId}/comment`,
            query: {
                ...options
              },
          })));
    }
}