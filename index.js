"use strict";
var wol = require("wake_on_lan");
var ping = require("ping");
var http = require('http');
var inherits = require('util').inherits;
var prompt = require('prompt');
var base64 = require('base-64');
var Service;
var Characteristic;
var that;
var VolumeCharacteristic;
var ChannelCharacteristic;
var FIREPLACE_SWITCH;
var cookie = null;
var pwd = null;
var cookiepath = "/usr/local/lib/node_modules/homebridge-sonytvremote/cookie";
var channeltouri = [];
var authok = false; // check if auth is okay
var registercheck = false;
var MAX_CHANNEL = 100; // +1 Start Apps at Channel 1001 == Fireplace
var CommandCanTurnTvOn = true;
//Global public FUNC
function makeVolumeCharacteristic() {
    VolumeCharacteristic = function() {
        Characteristic.call(this, 'Volume', '19E1CF82-E0EE-410D-A23C-E80020354C13');
        this.setProps({
                      format: Characteristic.Formats.INT,
                      unit: Characteristic.Units.NONE,
                      maxValue: 100,
                      minValue: 1,
                      minStep: 1,
                      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
                      });
        this.value = this.getDefaultValue();
    };
    inherits(VolumeCharacteristic, Characteristic);
}

function makeChannelCharacteristic() {
    ChannelCharacteristic = function() {
        Characteristic.call(this, 'Channel', '19E1CF82-E0EE-410D-A23C-E80020354C14');
        this.setProps({
                      format: Characteristic.Formats.INT,
                      unit: Characteristic.Units.NONE,
                      maxValue: MAX_CHANNEL,
                      minValue: 1,
                      minStep: 1,
                      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
                      });
        this.value = this.getDefaultValue();
    };
    inherits(ChannelCharacteristic, Characteristic);
}
var saveCookie = function(cookie) {
    if (cookie != undefined && cookie != null && cookie.length > 0)
        var fs = require('fs');
    var stream = fs.createWriteStream(cookiepath);
    stream.once('open', function(fd) {
                stream.write(cookie);
                stream.end();
                });
}
var loadCookie = function() {
    var fs = require('fs');
    fs.readFile(cookiepath, function(err, data) {
                if (err) {
                return;
                }
                console.log("READ_COOKIE " + data);
                cookie = data.toString();
                });
}
var savePin = function(pin) {
    if (pin != undefined && pin != null && pin.length > 0)
        var fs = require('fs');
    var stream = fs.createWriteStream(cookiepath + "pin");
    stream.once('open', function(fd) {
                stream.write(pin);
                stream.end();
                });
}
var loadPin = function() {
    var fs = require('fs');
    fs.readFile(cookiepath + "pin", function(err, data) {
                if (err) return;
                console.log("READ_PIN " + data);
                pwd = data.toString();
                });
}
var setCookie = function(headers) {
    var setcookie = null;
    try {
        setcookie = headers["set-cookie"];
    } catch (e) {
        setcookie = null;
    }
    if (setcookie != null && setcookie != undefined) {
        setcookie.forEach(
                          function(cookiestr) {
                          console.log( "COOKIE:" + cookiestr );
                          try {
                          cookie = cookiestr.toString().split(";")[0];
                          saveCookie(cookie);
                          } catch (e) {}
                          });
    }
}
//---------------------------------------------------------------------
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    makeVolumeCharacteristic();
    makeChannelCharacteristic();
    homebridge.registerAccessory("homebridge-sonytvremote", "SonyTV", SonyTV);
}

function isNull(object) {
    return object == undefined || null;
}

function SonyTV(log, config) {
    that = this;
    this.log = log;
    this.name = config.name;
    this.mac = config.mac;
    this.ip = config.ip;
    this.comp = config.compatibilityMode;
    this.maxchannels = config.maxchannels;
    this.tvsource = config.tvsource;
    this.favoritspeaker = config.soundoutput;
    this._service = new Service.Switch(this.name);
    this._service.getCharacteristic(Characteristic.On)
    .on('set', this._control.bind(this)).on('get', this.getPowerState.bind(this));
    this._service.addCharacteristic(VolumeCharacteristic)
    .on('get', this.getVolume.bind(this)).on('set', this.setVolume.bind(this));
    this._service.addCharacteristic(ChannelCharacteristic)
    .on('get', this.getChannel.bind(this)).on('set', this.setChannel.bind(this));
    cookie = loadCookie();
    pwd = loadPin();
    //give load Cookie and Pin time, then check every 5 seconds
    setTimeout(that.poweronCheckandInit, 5000);
}

SonyTV.prototype.makeHttpRequest = function(errcallback, resultcallback, url, post_data, canTurnTvOn) {
    var data = "";
    if (isNull(canTurnTvOn))
        canTurnTvOn = false;
    if (!that.power && canTurnTvOn){
        that._control(true,null);
        var timeout = 25000;
        /*if (url === "/sony/appControl")
            timeout = 25000;*/
        setTimeout(function() {
                   that.makeHttpRequest(errcallback,resultcallback,url,post_data,false);
            },timeout);
        return;
    }
    var post_options = that.getpostOptions(url);
    var post_req = http.request(post_options, function(res) {
                                setCookie(res.headers);
                                res.setEncoding('utf8');
                                res.on('data', function(chunk) {
                                       data += chunk;
                                       });
                                res.on('end', function() {
                                       if (!isNull(resultcallback)) {
                                          resultcallback(data);
                                       }
                                       });
                                });
    try {
        post_req.on('error', function(err) {
                    if (!isNull(errcallback)) {
                       errcallback(err);
                    }
                    return;
                    });
        post_req.write(post_data);
        post_req.end();
    } catch (e) {
        if (!isNull(errcallback)) {
            errcallback(e);
        }
    }
}

SonyTV.prototype.getServices = function() {
    /*var informationService = new Service.AccessoryInformation();
    informationService
    .setCharacteristic(Characteristic.Manufacturer, "Sony TV")
    .setCharacteristic(Characteristic.Model, "Bravia KDL42")
    .setCharacteristic(Characteristic.SerialNumber, "12345");
    return [informationService, this._service];*/
    return [this._service];
}
//Check if Device is up and Init Registration and LoadChannel List
//Every 5 Seconds check if Device if up or Down
//check if device Manually activated
SonyTV.prototype.poweronCheckandInit = function() {
    setTimeout(function() {
               that.getPowerState(null);
               if (!authok && that.power && !registercheck) {
               that.checkAndregisterRemoteAccess();
               }
               if (that.power && authok && channeltouri.length == 0) {
               that.getChannelUris(0);
               }
               that.poweronCheckandInit();
               }, 5000);
}
SonyTV.prototype.startFirePlace = function(state, callback) {
    var post_data = "{\"id\":13,\"method\":\"setActiveApp\",\"version\":\"1.0\",\"params\":[{\"uri\":\"kamaji://OPA-FIREPLACE-SCREENSAVER\"}]}";
    //that.log("Load Channel Uris");
    var onError = function(err) {
        callback(null, 0);
    };
    var onSucces = function(data) {
        if (data.indexOf("error") < 0)
            callback(null, state) //sendChannel exapmle 1001
            else callback(null, 0); //on data erroro send channel 0
    };
    that.makeHttpRequest(onError, onSucces, "/sony/appControl", post_data,CommandCanTurnTvOn);
}
SonyTV.prototype.getChannelUris = function(next50from) {
    if (next50from == undefined) {
        next50from = 0;
        channeltouri = [];
    }
    var post_data = "{\"id\":13,\"method\":\"getContentList\",\"version\":\"1.0\",\"params\":[{ \"source\":\"" + that.tvsource + "\",\"stIdx\": " + next50from + "}]}";
    var onError = function(err) {
        return;
    };
    var onSucces = function(data) {
        try {
            var result = JSON.parse(data).result[0];
            var nextchannel = that.maxchannels; // break on errors
            result.forEach(function(channelblock) {
                           channeltouri[Number(channelblock.dispNum).toString()] = channelblock.uri;
                           nextchannel = channelblock.index + 1;
                           //that.log("Add Channel "+Number(channelblock.dispNum).toString() )
                           });
            if (nextchannel < that.maxchannels)
                that.getChannelUris(nextchannel);
        } catch (e) {
            return;
        }
    };
    that.makeHttpRequest(onError, onSucces, "/sony/avContent/", post_data,false);
}
//Check if Device is Registered
//Prompt in Console for PIN for First Registration
SonyTV.prototype.checkAndregisterRemoteAccess = function() {
    registercheck = true;
    var post_data = "{\"id\":8,\"method\":\"actRegister\",\"version\":\"1.0\",\"params\":[{\"clientid\":\"HomeBridge:34c48639-af3d-40e7-b1b2-74091375368c\",\"nickname\":\"homebridge\"},[{\"clientid\":\"HomeBridge:34c48639-af3d-40e7-b1b2-74091375368c\",\"value\":\"yes\",\"nickname\":\"homebridge\",\"function\":\"WOL\"}]]}";
    //var post_options = that.getpostOptions("/sony/accessControl/");
    var onError = function(err) {
        return false;
    };
    var onSucces = function(chunk) {
        if (chunk.indexOf("[]") < 0) {
            prompt.start();
            prompt.get(['pin'], function(err, result) {
                       if (err)
                       return false;
                       savePin(result.pin);
                       pwd = result.pin;
                       return that.checkAndregisterRemoteAccess();
                       });
        } else {
            authok = true;
            return true;
        }
    };
    that.makeHttpRequest(onError, onSucces, "/sony/accessControl/", post_data,false);
}
//Get Channel
SonyTV.prototype.getChannel = function(callback) {
    if (!that.power) {
        callback(null, 0);
        return;
    }
    var post_data = "{\"id\":13,\"method\":\"getPlayingContentInfo\",\"version\":\"1.0\",\"params\":[\"\"]}";
    var onError = function(err) {
        if (!isNull(callback))
            callback(null, 0);
    };
    var onSucces = function(chunk) {
        try {
            var result = JSON.parse(chunk).result[0];
            var channel = Number(result.dispNum);
            that.log("getChannel is "+channel);
            if (!isNull(callback))
                callback(null, channel);
        } catch (e) {
            if (!isNull(callback))
                callback(null, 0);
        }
    };
    that.makeHttpRequest(onError, onSucces, "/sony/avContent/", post_data, false);
}

SonyTV.prototype.setChannel = function(channel, callback) {
    if (!that.power && !CommandCanTurnTvOn) {
        callback(null, 0);
        return;
    }
    if (channel == MAX_CHANNEL + 1) {
        that.startFirePlace(channel, callback);
        return;
    }
    that.log("setChannel"+ channel);
    if (channel == 0) {
        that.getChannel(callback);
        return;
    }
    //
    var uri = channeltouri[channel.toString()];
    if (isNull(uri)) {
        that.getChannel(callback);
        return;
    }
    var post_data = "{\"id\":13,\"method\":\"setPlayContent\",\"version\":\"1.0\",\"params\":[{ \"uri\": \"" + uri + "\" }]}";
    var onError = function(err) {
        if (!isNull(callback))
            callback(null, 0);
    };
    
    var onSucces = function(chunk) {
        if (chunk.indexOf("error") <= 0) {
            callback(null, 0);
        } else {
            that.getChannel(callback);
        }
    };
    that.makeHttpRequest(onError, onSucces, "/sony/avContent/", post_data, CommandCanTurnTvOn);
}

SonyTV.prototype.setVolume = function(volume, callback) {
    //{"id":13,"method":"setAudioVolume","version":"1.0","params":[{"target":"speaker","volume":"50"}]}
    if (!that.power) {
        callback(null, 0);
        return;
    }
    //that.log("setVolume");
    var post_data = "{\"id\":13,\"method\":\"setAudioVolume\",\"version\":\"1.0\",\"params\":[{\"target\":\"" + that.favoritspeaker + "\",\"volume\":\"" + volume + "\"}]}";
    var onError = function(err) {
        if (!isNull(callback))
            callback(null, 0);
    };
    var onSucces = function(chunk) {
        callback(null, volume);
    };
    that.makeHttpRequest(onError, onSucces, "/sony/audio/", post_data,false);
}

SonyTV.prototype.getVolume = function(callback) {
    //that.checkAndregisterRemoteAccess("");
    if (!that.power) {
        callback(null, 0);
        return;
    }
    //this.log("GetVolume");
    var post_data = "{\"id\":4,\"method\":\"getVolumeInformation\",\"version\":\"1.0\",\"params\":[\"1.0\"]}";
    var onError = function(err) {
        if (!isNull(callback))
            callback(null, 0);
    };
    var onSucces = function(chunk) {
        var _json = null;
        try {
            _json = JSON.parse(chunk);
        } catch (e) {
            if (!isNull(callback))
                callback(null, 0);
            return;
        }
        for (var i = 0; i < _json.result[0].length; i++) {
            //that.log(i);
            var volume = _json.result[0][i].volume;
            var typ = _json.result[0][i].target;
            if (typ === that.favoritspeaker) {
                //that.log("Vol:" + volume);
                if (!isNull(callback))
                    callback(null, volume);
                return;
            }
        }
        if (!isNull(callback))
            callback(null, 0);
    };
    that.makeHttpRequest(onError, onSucces, "/sony/audio/", post_data, false);
}

SonyTV.prototype.getPowerState = function(callback) {
    var onError = function(err) {
        if (!isNull(callback))
            callback(null, false);
        that.power = false;
    };
    var onSucces = function(chunk) {
        var _json = null;
        try {
            _json = JSON.parse(chunk);
            if (!isNull(_json) && !isNull(_json.result[0]) && _json.result[0].status === "active") {
                that.power = true;
                if (!isNull(callback))
                    callback(null, true);
            } else {
                that.power = false;
                if (!isNull(callback))
                    callback(null, false);
            }
        } catch (e) {
            if (!isNull(callback))
                callback(e, false);
            that.power = false;
        }
        
    };
    //that.log("PING for alive Test");
    try {
        ping.sys.probe(that.ip, function(isAlive) {
                       if (isAlive) {
                       var post_data = "{\"id\":2,\"method\":\"getPowerStatus\",\"version\":\"1.0\",\"params\":[]}";
                       that.makeHttpRequest(onError, onSucces, "/sony/system/", post_data,false);
                       } else {
                       that.power = false;
                       if (!isNull(callback)) {
                          callback(null, isAlive);
                       that.log("TV is off (PING FALSE)");
                       }
                       }
                       });
    } catch (globalExcp) {
        that.power = false;
        if (!isNull(callback)) {
            callback(null, false);
        }
    }
}


SonyTV.prototype.createIRRC = function(command) {
    return "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http:\/\/schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http:\/\/schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:X_SendIRCC xmlns:u=\"urn:schemas-sony-com:service:IRCC:1\"><IRCCCode>" + command + "</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>";
}

SonyTV.prototype.getpostOptions = function(url) {
    /* if (url != "/sony/accessControl/")
     that.checkAndregisterRemoteAccess();*/
    if (url == "")
        url = "/sony/IRCC";
    var post_options = null;
    if (that.comp == "true") {
        post_options = {
        host: 'closure-compiler.appspot.com',
        port: '80',
        path: url,
        method: 'POST',
        headers: {}
        };
    } else {
        // An object of options to indicate where to post to
        post_options = {
        host: that.ip,
        port: '80',
        path: url,
        method: 'POST',
        headers: {}
        };
    }
    if (!isNull(cookie)) {
        post_options.headers.Cookie = cookie; // = { 'Cookie': cookie };
    }
    if (!isNull(pwd)) {
        var encpin = 'Basic ' + base64.encode(":" + pwd);
        post_options.headers.Authorization = encpin; //':  encpin  };
    }
    return post_options;
}

SonyTV.prototype._control = function(state, callback) {
    that.log("setPower");
    var onError = function(err) {
        that.getPowerState(callback);
    };
    var onSucces = function(chunk) {
        that.getPowerState(callback);
    };
    if (state) {
        wol.wake(this.mac, function(error) {
                 if (error) {
                 //that._service.setCharacteristic(Characteristic.On, false);
                 that.log("Error when sending packets", error);
                 that.getPowerState(callback);
                 } else {
                 that.log("Packets wakeup sent");
                 that.power = true;
                 that.getPowerState(callback);
                 }
                 });
    } else { //Send PowerOff IRCODE
        var post_data = that.createIRRC("AAAAAQAAAAEAAAAvAw==");
        that.makeHttpRequest(onError, onSucces, "", post_data,false);
    }
}


