"use strict";
const axios = require ('axios');
const _s =  require('underscore.string');
const _ =  require('underscore');
const dateformat = require("dateformat");
const project = require("./constants/constants").project;

module.exports = class Jira {
    constructor(userAuth) {
        this.axiosInstance = axios.create({
            baseURL: process.env.JIRA_HOSTNAME + process.env.JIRA_REST_API_PATH,
            timeout: 10000,
            headers: {
                'Authorization': 'Basic ' + new Buffer(userAuth.username + ':' + userAuth.password).toString('base64'),
                "Accept": "application/json"
            },
        })
    }

    async getCount(args, callback) {
        _.extend(args, {maxResult: 0});
        const result = await this.fetchAll(args);
        if (result == "error") return result;
        return result.issues.length;
    }

    async fetchAll (args, callback) {
        let query,path, maxResult, fields, orderBy;
        query = this.parseFilterParams(args.filter);
        maxResult = args.maxResult ? _s.sprintf("&maxResults=%s", args.maxResult) : '';
        fields = args.maxResult ? "&fields=none" : "&fields=id,key,summary,status,assignee,duedate";
        orderBy = "order by " + (this.parseOrderParams(args.order) || "priority ASC, duedate ASC, status ASC");
        path = _s.sprintf("/search?jql=%s%s%s"
                    ,encodeURIComponent(query + " " + orderBy)
                    ,fields
                    ,maxResult);
       let result;
        try {
            result = await this.axiosInstance.get(path);
            return result.data;
        }
        catch(error) {
            //log error
            console.log(error);
            result = "error";
            return result;
        }
        
    }

    async getById(args, callback) {
        let path = _s.sprintf("/issue/%s?fields=id,key,summary,status,dueDate,assignee"
                    ,args.id);
        let result;
        try {
            result = await this.axiosInstance.get(path);
            return result.data;
        }
        catch(error) {
            //log error
            console.log(error);
            result = "error";
            return result;
        }
    }

    parseFilterParams(args) {
        let paramsArray = [];
        args.subject && paramsArray.push(_s.sprintf("summary ~ '%s*'", args.subject));
        args.assignee && paramsArray.push(_s.sprintf("assignee in (%s)", _.isArray(args.assignee) ? args.assignee.join(",") : args.assignee));
        project && paramsArray.push(_s.sprintf("project in (%s)",  _.isArray(project) ? project.join(",") : project));
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
        const orderProps = args.orderBy.length;
        const dirOps = args.orderByDirection.length;
        if(orderProps == dirOps) {
            for (var i = 0; index < orderProps; i++) {
                orderArray.push(args.orderBy[i] + " " + args.orderByDirection[i]);
            }
        }
       
        return orderArray.join(_s.quote(",", " "));
    }
}