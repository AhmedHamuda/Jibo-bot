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
        if(index > -1) {
            let diff = all;
            _.each(statuses, (status) => {
                if (status.indexOf("not")) {
                    let unStatus = status.replace("not ","");
                    diff = _.without(status, unStatus);
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
}