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
                "mac": "D8:5D",
                "ip": "10.0.1.13",
                "tvsource":"tv:dvbs",
                "maxchannels": 18,
                "soundoutput":"speaker"
  }
]

```

