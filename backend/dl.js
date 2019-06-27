const rp = require('request-promise');
const fs = require('fs-extra')
const path = require('path');


const areaName = "Grenoble_test"
const bbox = [45.179673,5.732910,45.180535,5.738371]
const pathOut = `./DATA/${areaName}`


var options = {
    method: 'POST',
    uri: 'https://overpass-api.de/api/interpreter',
    body: 
        `[out:xml][timeout:25];
        (node["highway"](${bbox.join(',')});
        way["highway"](${bbox.join(',')});
        relation["highway"](${bbox.join(',')});
        );out;>;
        out skel qt;`
};

rp(options)
    .then(async (osm) => {
        await fs.ensureDir(pathOut)
        await fs.writeFile(path.join(pathOut, 'data.osm'), osm, 'utf8')

        const meta = {
            date : Date.now(),
            name : areaName,
            bbox : bbox
        }
        await fs.writeFile(path.join(pathOut, 'meta.json'), JSON.stringify(meta), 'utf8')
    
        // POST succeeded...
    })
    .catch(function (err) {
        // POST failed...
        console.log(err)
    });