"use strict";
const session = require("restify-session");

module.exports = class restify_session_ext extends session {
    constructor(config) {
        super(config);
        this.sessionManager = (req, res, next) => {
            if (this.config.debug) {
                this.config.logger.debug(session.name + ': request url: ' + req.url);
            }
            req.session = {};
            let reqSid = req.query.oauth_token;
            
            if(reqSid) {
                this.exists(reqSid, function(existErr, active){
                    if (existErr) {
                        next();
                    } else if (active) {
                        this.load(reqSid, function(loadErr, data){
                            if (!loadErr) {
                                this.setSessionData(reqSid, data, req, res, next);
                            } else {
                                next();
                            }
                        });
                    } else {
                        next();
                    }
                });
            } else {
                next();
            }

            req.saveSession = (reqSid, callback) => {
                this.setSessionData(reqSid, req.session, req, res, callback, next);
            }

            this.setSessionData = (sid, data, req, res, callback, next) => {
                if (!sid) {
                  next();
                  return;
                }
                if (!data) {
                  data = {};
                }
                data.sid  = sid;
                this.save(sid, data, (err, status) => {
                  if (!err) {
                    req.session = data;
                  }
                  callback();
                });
            }
        }
    }
}