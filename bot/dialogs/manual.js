"use strict";

const builder = require('botbuilder');
const lib = new builder.Library('manual');
const bot = require("../bot").bot;
lib.dialog("ask",
    (session) => {
        session.send("starting conversation with Ahmed Hamuda");
        session.conversationData.manualSupport = true;
        const address = {
            serviceUrl: session.message.address.serviceUrl,
            bot: {
                id: session.message.address.bot.id,
                name: session.message.address.bot.name
            },
            channelId: session.message.address.channelId,
            conversation: {
            },
            user: {
                id:"default-user",
                name: "User"
            }
        }
        bot.loadSession(address, (error, mSession) => {
            if(error){
                console.log(error);
            } else{
                let msg = new builder.Message(mSession);
                msg.text("Hi");
                bot.send(msg);
            }
        })
});

// Export createLibrary() function
module.exports.createLibrary = () => {
    return lib.clone();
};