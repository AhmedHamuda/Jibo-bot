"use strict";

const bot = require("../bot/bot").bot;

module.exports = class JiraWebhook {
static webhook (req, res, next) {
        console.log(req);
        //bot.beginDialog(Address,"webhook:/");
        res.send({
            message: "ok",
        });
    }
}