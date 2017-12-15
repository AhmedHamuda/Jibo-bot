const constant = require("../constants/constants");
const _s = require("underscore.string");
const chrono = require("chrono-node");
const _ = require("underscore");
const constants = require("../constants/constants");
//helpers:
module.exports = { 
    checkAndApplyReversedStatus : (statuses) => {
        const index = _.findIndex(statuses, (status) => {
            return status.indexOf("not");
        });
        if(index > -1) {
            let status = constants.status;
            _.each(statuses, (status) => {
                if (status.indexOf("not")) {
                    let unStatus = status.replace("not ","");
                    status = _.without(status, unStatus);
                }
            });
            return statuses;
        }
        return statuses;
    },
    checkAndApplyReversedPriority : (priorities) => {
        const index = _.findIndex(priorities, (priority) => {
            return priority.indexOf("not");
        });
        if(index > -1) {
            let priority = constants.priority;
            _.each(priorities, (priority) => {
                if (priority.indexOf("not")) {
                    let unPriority = priority.replace("not ","");
                    priority = _.without(priority, unPriority);
                }
            });
            return priorities;
        }
        return priorities;
    },
    getDate : (dateEntity) => {
        if(dateEntity) {
            let date = dateEntity.entity.replace(/\./g,"/");
            return chrono.parseDate(date);
        }
        return null;
    }
}