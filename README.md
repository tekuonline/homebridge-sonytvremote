# Sony TV control

###### Instalation

To install the plugin, head over to the machine with Homebridge set up and run
```
sudo npm install -g https://github.com/tekuonline/homebridge-sonytvremote.git
```

###### Configuration

To make Homebridge aware of the new plugin, you will have to add it to your configuration usually found in `.homebridge/config.json`. Somewhere inside that file you should see a key named `accessories`. This is where you can add your tv as shown here:

```


"accessories": [
{
                "accessory": "SonyTV",
                "name": "Living room TV",
                "mac": "7E-D3-BC-61-1D-58",
                "ip": "10.0.1.13",
                "tvsource":"tv:dvbs",
                "maxchannels": 18,
                "soundoutput":"speaker",
                "cookiepath":"/usr/node_modules/homebridge-sonytvremote/cookie"
  }
]

```
###### Note: Cookie must be a file with read write access:
``` 
sudo chmod 777 /usr/local/lib/node_modules/homebridge-sonytvremote/cookie
```
######
*where cookiepath might differ based on user setup.

