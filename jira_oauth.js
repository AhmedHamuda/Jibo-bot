"use strict";

const fs = require("file-system");
const OAuth = require("oauth").OAuth;
const Cookies = require("cookies");

class JiraOAuth {
    static requestToken (req, res, next) {
        let oauth = new OAuth(
            JiraOAuth.JiraURL + "/plugins/servlet/oauth/request-token", 
            JiraOAuth.JiraURL + "/plugins/servlet/oauth/access-token", 
            process.env.JIRA_CONSUMER_KEY,
            fs.readFileSync(process.env.PRIV_KEY_PATH, "utf8"), "1.0",
            process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT + "/api/jira/callback", "RSA-SHA1");

        oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
            if (error) {
                console.log(error);
                //console.log(error.data);
                res.send(error + "Error getting OAuth access token");
            } else {
                if(req.session){
                    req.session.setDuration(24 * 60 * 60 * 1000);
                }
                req.session.oauth = oauth;
                req.session.oauth_token = oauthToken;
                req.session.oauth_token_secret = oauthTokenSecret;
                
                let cookies = new Cookies(req, res);
                cookies.set("sessions", req.session);

                console.log(req.session);
                //res.writeHead(302);

                return res.redirect(JiraOAuth.JiraURL + "/plugins/servlet/oauth/authorize?oauth_token=" + oauthToken, next);

            }
        });
    }

    static callback (req, res) {
        let cookies = new Cookies(req, res);
        req.session = cookies.get("sessions");

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
                req.param("oauth_verifier"),
            (error, oauth_access_token, oauth_access_token_secret, results2) => {
                if (error) {
                    console.log("error");
                    console.log(error);
                } else {
                    
                    req.session.oauth_access_token = oauth_access_token;
                    req.session.oauth_access_token_secret = oauth_access_token_secret;
                    if(req.session){
                        req.session.setDuration(24 * 60 * 60 * 1000);
                    }
                    if (req.session.save) {
                        req.session.save();
                    }
                    res.send({
                        message: "successfully authenticated.",
                        access_token: oauth_access_token,
                        secret: oauth_access_token_secret
                    });

                    return res.redirect(JiraOAuth.BotURL + "/api/bot/messages", next);
                }
        });
    }
}

JiraOAuth.JiraURL = process.env.JIRA_PROTOCOL + "://" + process.env.JIRA_HOSTNAME + ":" + process.env.JIRA_PORT;
JiraOAuth.BotURL = process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT;
module.exports = JiraOAuth;