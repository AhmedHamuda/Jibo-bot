"use strict";

const _s = require("underscore.string");
const chrono = require("chrono-node");
const _ = require("underscore");
//helpers:
module.exports = class helpers { 
    static checkAndApplyReversedStatus(all, statuses) {
        const index = _.findIndex(statuses, (status) => {
            return status.indexOf("not");
        });
        if(index > 0) {
            let diff = all;
            _.each(statuses, (status) => {
                if (status.indexOf("not") > 0) {
                    let unStatus = status.replace("not ","");
                    diff = _.without(statuses, unStatus);
                }
            });
            return diff;
        }
        return statuses;
    }

    static getDate(dateEntity) {
        if(dateEntity) {
            let date = dateEntity.entity.replace(/\./g,"/");
            return chrono.parseDate(date);
        }
        return null;
    }

    static buildTransitionObj(transition) {
        let transitionObj = {
            transition: {
                id: transition.id
            },
        };
        let fields = _.filter(transition.fields, (field) => {
            if(field.value) {
                return field;
            }
        });
        let fieldsObj = _.object(_.map(fields, _.values));
        transitionObj.fields = fieldsObj;
        return transitionObj;
    }

    static checkIssueNumberFormat(issueNumber) {
        return issueNumber.toUpperCase().match("^[A-Z\_]+\-[0-9]+") ? issueNumber : undefined;
    }
}