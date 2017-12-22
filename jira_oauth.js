"use strict";

const fs = require("file-system");
const OAuth = require("oauth").OAuth;

class JiraOAuth {

    static requestToken (req, res) {
        let oauth = new OAuth(
            process.env.JIRA_PROTOCOL + "://" + process.env.JIRA_HOSTNAME + ":" + process.env.JIRA_PORT + "/plugins/servlet/oauth/request-token", 
            process.env.JIRA_PROTOCOL + "://" + process.env.JIRA_HOSTNAME + ":" + process.env.JIRA_PORT + "/plugins/servlet/oauth/access-token", 
            process.env.JIRA_CONSUMER_KEY,
            fs.readFileSync(process.env.PRIV_KEY_PATH, "utf8"), "1.0",
            process.env.PROTOCOL + "://" + process.env.HOSTNAME + ":" + process.env.PORT + "/api/jira/callback", "RSA-SHA1");

        oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
            if (error) {
                console.log(error);
                //console.log(error.data);
                res.send(error + "Error getting OAuth access token");
            } else {
                console.log(req);
                req.session.oauth = oauth;
                req.session.oauth_token = oauthToken;
                req.session.oauth_token_secret = oauthTokenSecret;
                return res.redirect(base_url + "/plugins/servlet/oauth/authorize?oauth_token=" + oauthToken);
            }
        });
    }

    static callback (req, res, callback) {
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
                    res.send({
                        message: "successfully authenticated.",
                        access_token: oauth_access_token,
                        secret: oauth_access_token_secret
                    });
                }
        });
    }
}

module.exports = JiraOAuth;