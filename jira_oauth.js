"use strict";

const fs = require("file-system");
const OAuth = require("oauth").OAuth;
const bot = require("./bot/bot").bot;

class JiraOAuth {
    static requestToken (req, res, next) {
        let oauth = new OAuth(
            JiraOAuth.JiraURL + "/plugins/servlet/oauth/request-token", 
            JiraOAuth.JiraURL + "/plugins/servlet/oauth/access-token", 
            process.env.JIRA_CONSUMER_KEY,
            fs.readFileSync(process.env.PRIV_KEY_PATH, "utf8"), "1.0",
            JiraOAuth.BotURL + "/api/jira/callback", "RSA-SHA1");

        oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
            if (error) {
                console.log(error);
                res.send(error + "Error getting OAuth access token");
            } else {
                req.session.oauth = oauth;
                req.session.oauth_token = oauthToken;
                req.session.oauth_token_secret = oauthTokenSecret;
                req.session.userId = req.query.userId;
                req.session.userName = req.query.userName;
                req.session.botId = req.query.botId;
                req.session.channelId = req.query.channelId;
                req.session.conversationId = req.query.conversationId;
                req.session.addressId = req.query.addressId;
                req.session.serviceUrl = req.query.serviceUrl;
                req.saveSession(req.session.oauth_token, () => {
                    console.log(req.session);
                    res.redirect(JiraOAuth.JiraURL + "/plugins/servlet/oauth/authorize?oauth_token=" + oauthToken, next);
                });
                
            }
        });
    }

    static callback (req, res, next) {
        console.log(req.session);
        let oauth = new OAuth(
            req.session.oauth._requestUrl,
            req.session.oauth._accessUrl,
            req.session.oauth._consumerKey,
            fs.readFileSync(process.env.PRIV_KEY_PATH, "utf8"),
            req.session.oauth._version,
            req.session.oauth._authorize_callback,
            req.session.oauth._signatureMethod
        );

        oauth.getOAuthAccessToken(
                req.session.oauth_token,
                req.session.oauth_token_secret,
                req.query.oauth_verifier,
            (error, oauth_access_token, oauth_access_token_secret, results2) => {
                if (error) {
                    console.log("error");
                    console.log(error);
                } else {
                    const address = {
                        id: req.session.addressId,
                        serviceUrl: req.session.serviceUrl,
                        bot: {
                            id: req.session.botId,
                            name: bot.name
                        },
                        channelId: req.session.channelId,
                        conversation: {
                            id: req.session.conversationId,
                            serviceUrl: req.session.serviceUrl
                        },
                        user: {
                            id: req.session.userId,
                            name: req.session.userName 
                        }
                    }
                    bot.loadSession(address, (error, session) => { 
                        if(error) {
                            console.log(error);
                        }else {
                            session.userData.oauth = {
                                accessToken: oauth_access_token,
                                tokenSecret: oauth_access_token_secret,
                            };
                            session.save();
                            let dialog = bot.findDialog("welcome","welcome");
                            dialog.begin(session);
                            res.send({
                                message: "successfully authenticated.",
                                access_token: oauth_access_token,
                                secret: oauth_access_token_secret
                            });
                        }
                    });
                }
        });
    }
}

JiraOAuth.JiraURL = process.env.JIRA_PROTOCOL + "://" + process.env.JIRA_HOSTNAME + ":" + process.env.JIRA_PORT;
JiraOAuth.BotURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;
module.exports = JiraOAuth;