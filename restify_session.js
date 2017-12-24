"use strict";
const session = require("restify-session");

module.exports = class restify_session_ext extends session {
    constructor(config) {
        super(config);
        this.session.sessionManager = (req, res, next) => {
            if (cfg.debug) {
                cfg.logger.debug(session.name + ': request url: ' + req.url);
              }
              var reqSid = req.headers[session.config.sidHeader.toLowerCase()];
              session.exists(reqSid, function(existErr, active){
                if (existErr) {
                  next();
                } else if (active) {
                  // load the session
                  session.load(reqSid, function(loadErr, data){
                    if (!loadErr) {
                      session.setSessionData(reqSid, data, req, res, next);
                    } else {
                      nextFlow();
                    }
                  });
                } else {
                  session.createSid(function(createErr, sid) {
                    if (!createErr) {
                      session.setSessionData(sid, {}, req, res, next);
                    } else {
                      nextFlow();
                    }
                  });
                }
              });
          
              // For the saveSession feature
              var fakeRes = {setHeader: function(sidHeader, sid){return;}}
              var nextFlow = function(){
                  // Define the saveSession function for every req instance
                  if(!req.saveSession || typeof req.saveSession !== 'function'){
                      req.saveSession = function(cb){
                          if(this.session && this.session.sid)
                              sessionManager.setSessionData(this.session.sid, this.session, this, fakeRes, function(){
                                  if(cb && typeof cb === 'function') cb();
                              });
                          else if(cb && typeof cb === 'function') cb();
                      }
                  }
              
                  // Define the destroySession function for every req instance
                  if(!req.destroySession || typeof req.destroySession !== 'function'){
                      req.destroySession = function(cb){
                          if(this.session && this.session.sid)
                              sessionManager.destroy(this.session.sid, cb);
                          else if(cb && typeof cb === 'function') cb();
                      }
                  }
                  next();
              }
        }
    }
}