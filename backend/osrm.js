const util = require('util');
const exec = util.promisify(require('child_process').exec);
const OSRM = require('osrm')
const db = require('./db')
const rp = require('request-promise');
const fs = require('fs-extra');
const path = require('path')
const Request = require('request');



const getOsmData = async (bbox) => {
    var options = {
        method: 'POST',
        uri: 'https://overpass-api.de/api/interpreter',
        body:
            `[out:xml][timeout:90];
        (node["highway"](${bbox.join(',')});
        way["highway"](${bbox.join(',')});
        relation["highway"](${bbox.join(',')});
        );out;>;
        out skel qt;`
    };
    try {
        const osm = await rp(options);
        return osm;
    } catch (error) {
        return null // throw
    }
}


exports.dlData = async function (areaName, bbox, user) {
    if (!user || user.level < 2) {
        return { status: 'ko', error: "Vous ne possédez pas les droits" }
    }

    const pathOut = `./DATA/${areaName}`
    const json = await db.readDb();
    if (json.area[areaName]) {
        return { status: 'ko', error: "Ce nom de zone existe déjà" }
    }

    try {
        const osm = await getOsmData(bbox);
        await fs.ensureDir(pathOut)
        await fs.writeFile(path.join(pathOut, 'data.osm'), osm, 'utf8')
        const stats = fs.statSync(path.join(pathOut, 'data.osm'));
        const meta = {
            date: Date.now(),
            bbox: bbox,
            user: user.id,
            type: "overpass",
            size: stats.size
        }

        let json = await db.readDb();

        if (!json['area'][areaName]) {
            json['area'][areaName] = { 'meta': {}, 'profils': {} }
        }
        json['area'][areaName].meta = meta;

        await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')

        return { status: 'ok' }
    } catch (error) {
        return error;
    }
}

const dlPbfGeofabrik = async function (areaName, url, user, isnew = true) {

    if (!user || user.level < 3) {
        return { status: 'ko', error: "Vous ne possédez pas les droits" }
    }

    const pathOut = `./DATA/${areaName}`
    const json = await db.readDb();
    if (json.area[areaName] && isnew) {
        return { status: 'ko', error: "Ce nom de zone existe déjà" }
    }

    await fs.ensureDir(pathOut)

    return new Promise(function (resolve, reject) {
        Request(url)
            .on('end', async () => {
                const stats = fs.statSync(path.join(pathOut, 'data.pbf'));

                const meta = {
                    date: Date.now(),
                    bbox: undefined,
                    user: user.id,
                    url: url,
                    type: "geofabrik",
                    size: stats.size
                }


                if (!json['area'][areaName]) {
                    json['area'][areaName] = { 'meta': {}, 'profils': {} }
                }
                json['area'][areaName].meta = meta;

                await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')
                console.log('newPbf')
                resolve({ status: 'ok' })
            })
            .pipe(fs.createWriteStream(path.join(pathOut, 'data.pbf')))

    })
}
exports.dlPbfGeofabrik = dlPbfGeofabrik;

exports.updateData = async function (areaName, user) {
    const pathOut = `./DATA/${areaName}`
    const json = await db.readDb();
    if (!json.area[areaName]) {
        return { status: 'ko', error: "Cet identifiant de la zone n'existe pas" }
    }

    const userData = json.area[areaName].meta.user;
    if (userData !== user.id && user.level < 4) { // 4 ==> admin
        return { status: 'ko', error: "Vous ne possédez pas les droits" }
    }

    if (json.area[areaName].meta.type === 'geofabrik') {
        const urlPbf = json.area[areaName].meta.url;
        const result = await dlPbfGeofabrik(areaName, urlPbf, user, false)

    } else {
        const bbox = json.area[areaName].meta.bbox;

        try {
            const osm = await getOsmData(bbox);
            await fs.ensureDir(pathOut)

            await fs.writeFile(path.join(pathOut, 'data.osm'), osm, 'utf8')
            const stats = fs.statSync(path.join(pathOut, 'data.osm'));

            const meta = {
                date: Date.now(),
                bbox: bbox,
                user: user.id,
                size: stats.size,
                type: "overpass"
            }

            json['area'][areaName].meta = meta;

            await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')

            return { status: 'Ok' }
        } catch (error) {
            return error;
        }

    }

}

exports.deleteData = async (areaName, user) => {
    const dataPath = path.join('./DATA', areaName)
    const exists = await fs.pathExists(dataPath)

    let json = await db.readDb();
    const userData = json.area[areaName].meta.user;
    if (userData !== user.id && user.level < 4) { // 4 ==> admin
        return { status: 'ko', error: "Vous ne possédez pas les droits" }
    }

    if (!exists) {
        return { status: 'error', 'message': 'les données n\'exitent pas ' }
    }

    if (!json['area'][areaName]) {
        return { status: 'error', 'message': 'Pas de données dans les metas' }
    }
    await fs.remove(dataPath);
    if (osrm[areaName]) {
        delete osrm[area];
    }
    delete json['area'][areaName]
    await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')
    return { status: 'ok' }
}

const prepare = async function (areaName, profileName) { // genere le .osrm
    await fs.ensureDir(path.join('./DATA', areaName, profileName))
    let json = await db.readDb();

    let isPbf = false;
    if (json['area'][areaName].meta.type === 'geofabrik') {
        isPbf = true;
    }

    const fileNameData = isPbf ? 'data.pbf' : 'data.osm'


    // copie de la data vers le dossier profil
    await fs.copy(
        path.join('./DATA', areaName, fileNameData),
        path.join('./DATA', areaName, profileName, fileNameData)
    )

    const pathInputData = path.join('./DATA', areaName, profileName, fileNameData);
    const prepare_cmd = `./node_modules/osrm/lib/binding/osrm-extract ${pathInputData} -p ./profiles/${profileName}.lua`;
    const { stdout, stderr } = await exec(prepare_cmd);

    // plus besoin, on supprime
    await fs.remove(path.join('./DATA', areaName, profileName, fileNameData))

    // return { stdout: stdout, stderr: stderr }
    return { status: 'Ok' }
}

const contract = async function (areaName, profileName) {
    const pathOsrm = path.join('./DATA', areaName, profileName, 'data.osrm')
    const contract_cmd = `./node_modules/osrm/lib/binding/osrm-contract ${pathOsrm}`;
    const { stdout, stderr } = await exec(contract_cmd);

    return { status: 'Ok' }
}

exports.prepareAndContract = async function (areaName, profileName, user) {
    const exists = await fs.pathExists(path.join('./DATA', areaName))
    if (!exists) {
        return { status: 'ko', error: "Areaname n existe pas" }
    }

    if (db.processing.isProcessing) {
        return { status: 'ko', error: "Des données sont en cours de preparation... Une à la fois" }
    }

    const json = await db.readDb();
    const userData = json.area[areaName].meta.user;
    if (userData !== user.id && user.level < 3) { // 4 ==> admin
        return { status: 'ko', error: "Vous ne possédez pas les droits" }
    }

    const meta = {
        date: Date.now(),
        data_date: json['area'][areaName].meta.date
    }

    if (!json['area'][areaName].profils[profileName]) {
        json['area'][areaName].profils[profileName] = { 'meta': {} }
    }
    json['area'][areaName].profils[profileName] = meta;


    db.processing = { isProcessing: true, areaName: areaName, profil: profileName };
    const prepared = await prepare(areaName, profileName);
    const contracted = await contract(areaName, profileName)
    db.processing = { isProcessing: false, areaName: areaName, profil: profileName };
    if (osrm[areaName] && osrm[areaName][profileName]) {
        delete osrm[areaName][profileName];
    }

    await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')

    return { status: 'Ok' }
    // return { stdout: stdout, stderr: stderr }
}

osrm = {};

exports.routing = async (areaName, profileName, coordinates, options = null) => {
    const dataFile = path.join('./DATA', areaName, profileName, 'data.osrm')

    const exists = await fs.pathExists(dataFile)
    if (!exists) {
        return 'Oups'
    }

    for (let k in options) {
        if (options[k] == 'true') {
            options[k] = true;
        }
        if (options[k] == 'false') {
            options[k] = false;
        }
    }

    if (!osrm[areaName]) {
        osrm[areaName] = {};
    }
    if (!osrm[areaName][profileName]) {
        osrm[areaName][profileName] = new OSRM(dataFile);
    }
    // const osrm = new OSRM(dataFile)

    options.coordinates = coordinates;
    // options.annotations = true


    return new Promise(function (resolve, reject) { // callback hell! 
        osrm[areaName][profileName].route(options
            , (err, result) => {
                if (err) {
                    reject(err.toString())

                }
                else resolve(result)
            })
    });
}





exports.deleteProfil = async (areaName, profil) => {
    const dataPath = path.join('./DATA', areaName, profil)
    const exists = await fs.pathExists(dataPath)

    if (!exists) {
        return { status: 'error', 'message': 'les données n\'exitent pas ' }
    }

    let json = await db.readDb();

    if (!json['area'][areaName].profils[profil]) {
        return { status: 'error', 'message': 'Pas de données dans les metas' }
    }
    await fs.remove(dataPath);
    delete json['area'][areaName].profils[profil]
    await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')
    if (osrm[areaName] && osrm[areaName][profileName]) {
        delete osrm[areaName][profileName];
    }
    return { status: 'ok' }
}

