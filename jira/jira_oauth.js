"use strict";

const fs = require("file-system");
const OAuth = require("oauth").OAuth;
const bot = require("../bot/bot").bot;
const { URL } = require('url');
const path = require("path");

class JiraOAuth {
    static requestToken (req, res, next) {
        if(req.query && 
            req.query.userId && 
            req.query.userName && 
            req.query.channelId &&
            req.query.conversationId &&
            req.query.serviceUrl) {
                const address = JiraOAuth.BuildAddress(req.query);
                bot.loadSession(address, (error, session) => { 
                    if(error) {
                        res.send(error + "in loading session");
                    }else {
                        const jira = session.userData.jira;
                        const jiraUrl = jira.protocol + "://" + jira.host + ":" + jira.port;
                        let oauth = new OAuth(
                            jiraUrl + "/plugins/servlet/oauth/request-token", 
                            jiraUrl + "/plugins/servlet/oauth/access-token", 
                            process.env.JIRA_CONSUMER_KEY,
                            fs.readFileSync(path.join(path.resolve(process.env.USERPROFILE), process.env.PRIV_KEY_DIR, process.env.JIRA_CONSUMER_KEY_SECRET), "utf8"), "1.0",
                            JiraOAuth.BotURL + "/api/jira/callback", "RSA-SHA1");
            
                        oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
                            if (error) {
                                let dialog = bot.findDialog("auth","error");
                                dialog.begin(session);
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
                                    res.redirect(jiraUrl + "/plugins/servlet/oauth/authorize?oauth_token=" + oauthToken, next);
                                });
                            }
                        });
                    }
                });
        } else {
            res.send(500, {error: "Internal Error", description: "Missing required identification data"});
        }
    }

    static callback (req, res, next) {
        console.log(req.session);
        let oauth = new OAuth(
            req.session.oauth._requestUrl,
            req.session.oauth._accessUrl,
            req.session.oauth._consumerKey,
            fs.readFileSync(path.join(path.resolve(process.env.USERPROFILE), process.env.PRIV_KEY_DIR, process.env.JIRA_CONSUMER_KEY_SECRET), "utf8"),
            req.session.oauth._version,
            req.session.oauth._authorize_callback,
            req.session.oauth._signatureMethod
        );

        const address = JiraOAuth.BuildAddress(req.session);
        bot.loadSession(address, (error, session) => { 
            if(error) {
                res.send(error + "in loading session for authorization");
            }else {
                oauth.getOAuthAccessToken(
                    req.session.oauth_token,
                    req.session.oauth_token_secret,
                    req.query.oauth_verifier,
                (error, oauth_access_token, oauth_access_token_secret, results2) => {
                    if (error) {
                        let dialog = bot.findDialog("auth","error");
                        dialog.begin(session);
                        res.send(error + "Error getting OAuth authorization token");
                    } else {
                        session.userData.jira.oauth = {
                            access_token: oauth_access_token,
                            access_token_secret: oauth_access_token_secret,
                        };
                        //session.save();
                        session.beginDialog("welcome:welcome");
                        res.send( "successfully authenticated.");
                    }
                });
            }
        });
    }

    static BuildAddress(source) {
        return {
            id: source.addressId,
            serviceUrl: source.serviceUrl,
            bot: {
                id: source.botId,
                name: bot.name
            },
            channelId: source.channelId,
            conversation: {
                id: source.conversationId,
                serviceUrl: source.serviceUrl
            },
            user: {
                id:source.userId,
                name: source.userName 
            }
        }
    }
}

JiraOAuth.BotURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;
module.exports = JiraOAuth;