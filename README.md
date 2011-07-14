`node-robohash` is intended to implement @e1ven's [Robohash](https://github.com/e1ven/Robohash).

# Status

Only rendering part is implemented.

SVG parsing and rendering code is based on relevant code in [Fabric.js](https://github.com/kangax/fabric.js). I'll add the necessary mentions ASAP.

# Known Issues

Background SVG files are not being rendered correctly, likely because
relevent SVG elements are rendered.

`svg.coffee` module is currently hardwired to handle Robohash SVG files and replaces specific color values with random color. This will be cleaned up and expanded later.

# Installation

    git clone git://github.com/donpark/node-robohash.git
    cd node-robohash
    npm update
    
# Launching

    cd node-robohash
    node app.js

You should see something like [this](https://github.com/donpark/node-robohash/raw/master/doc/example1.png) at [http://localhost:3000](http://localhost:3000):
