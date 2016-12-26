# Sony TV Power control
### Turn on or off your Sony TV with Siri
### Change Volume (create Scenes in Homekit App like "Eve Elgato or euqal)
### Change Channel (create Scenes in Homekit App like "Eve Elgato or euqal)
### to Start Fireplace select Channel 1001 (create Scenes in Homekit App like "Eve Elgato or euqal)
### Please start homebridge first time in Console to Enter RemotePin !

###### Installing
### need following packet´s: ping, base-64,prompt, wake_on_lan 
### 

To install the plugin, head over to the machine with Homebridge set up and run
```
sudo npm install -g homebridge-sonytvremote
```

###### Configuration

To make Homebridge aware of the new plugin, you will have to add it to your configuration usually found in `.homebridge/config.json`. Somewhere inside that file you should see a key named `accessories`. This is where you can add your tv as shown here:

```


"accessories": [
{
"accessory": "SonyTV",
"name": "Fernseher",
"mac": "3C-07-71-DB-E2-A9",
"ip": "192.168.2.3",
"tvsource":"tv:dvbs", // tv:dvbc // tc:dvbt
"maxchannels": 500,
"soundoutput":"speaker",
"onscript":"/home/pi/scripts/dolbyon.sh", // can be empty
"offscript":"/home/pi/scripts/dolbyoff.sh",  // can bee empty
"savefilenameprefix":"/home/pi/sonycookie"  // <- (default when its empty) is a file prefix, not path prefix. Make sure after enter pin in console in sudo mode that file is readable (chmod 777 ..)

} ]

```

