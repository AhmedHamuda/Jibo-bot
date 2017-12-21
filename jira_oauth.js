"use strict";

const fs = require("file-system");
const OAuth = require("oauth").OAuth;

class JiraOAuth {

    constructor () {
        this.oauth = new OAuth(
            process.env.JIRA_HOSTNAME + "/plugins/servlet/oauth/request-token", 
            process.env.JIRA_HOSTNAME + "/plugins/servlet/oauth/access-token", 
            process.env.JIRA_CONSUMER_KEY,
            fs.readFileSync(process.env.PRIV_KEY_PATH, "utf8"), "1.0",
            "http://localhost:" + process.env.PORT + "/jira/callback", "RSA-SHA1");
    }

    static requestToken (req, res) {
        this.oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
            if (error) {  
                console.log(error.data);
                response.send("Error getting OAuth access token");
            } else {
                req.session.oa = oa;
                req.session.oauth_token = oauthToken;
                req.session.oauth_token_secret = oauthTokenSecret;
                return res.redirect(base_url + "/plugins/servlet/oauth/authorize?oauth_token=" + oauthToken);
            }
        });
    }

    static callback (req, res, callback) {
        this.oauth.getOAuthAccessToken(
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

//let JiraOAuth = new JiraOAuth();
module.exports = JiraOAuth;