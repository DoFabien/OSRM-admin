const express = require('express')
const bodyParser = require("body-parser");
const _osrm = require('./osrm')
const db = require('./db')
const auth = require('./auth')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const Cookie = require('cookie')

const app = express()


const server = require('http').createServer(app);
const io = require('socket.io')(server, { path: '/ws' });
// io.on('connection', () => { /* … */ });




app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.on('connection', async (client) => {
    const cookie = client.request.headers.cookie
    // var cookies = cookie.parse(cookie);
    // const parsedCookie = Cookie.parse(cookie)
    // if (parsedCookie.OsrmAdmin) {
    //     const user = jwt.verify(parsedCookie.OsrmAdmin, db.JWTSECRET);
    // }

    const data = await db.readDb()

    io.to(client.id).emit('newData', data.area);
    io.to(client.id).emit('isProcessing', db.processing)
    io.to(client.id).emit('dl', db.dl)


    // io
})

const tokenUser = (req) => {
    const token = req.cookies.OsrmAdmin;
    if (!token) {
        return undefined;
    }
    const users = jwt.verify(token, db.JWTSECRET);
    return users;
}

app.get('/meta/', async (req, res) => {
    io.emit('new-message', 'COUCOU')

    // const users = tokenUser(req);
    let json = await db.readDb();
    res.send(json.area);
});

// nouvelle data
app.post('/data/', async (req, res) => {
    const user = tokenUser(req);
    const bboxStr = req.body.bbox;
    const areaName = req.body.areaName;

    if (!bboxStr || !areaName) {
        res.send(400, 'Error!, pas de bbox ou de nom de la région')
        return;
    }
    const bbox = bboxStr.split(',').map(c => parseFloat(c));

    _osrm.dlData(areaName, bbox, user)
    .then( async result => {
        db.dl = { isDl: false, areaName: areaName }
        io.emit('dl', db.dl)

        const data = await db.readDb()

        io.emit('newData', data.area)
    })

 
    res.send({ isDl: true, areaName: areaName })
})

app.post('/data/pbf', async (req, res) => {
    const user = tokenUser(req);
    const pbfurl = req.body.pbfurl;
    const areaName = req.body.areaName;

    db.dl = { isDl: true, areaName: areaName }
    io.emit('dl', db.dl)
    
    if (!pbfurl || !areaName) {
        res.send(400, {'error': 'Error!, pas d url ou de nom de la région'})
        return;
    }
    _osrm.dlPbfGeofabrik(areaName,pbfurl,user)
        .then( async result => {
            db.dl = { isDl: false, areaName: areaName }
            io.emit('dl', db.dl)

            const data = await db.readDb()

            io.emit('newData', data.area)
        })

    res.send({ isDl: true, areaName: areaName })
})


// Update data
app.put('/data/', async (req, res) => {
    const user = tokenUser(req);
    const areaName = req.body.areaName;
    // const bbox = JSON.parse
    db.dl = { isDl: true, areaName: areaName }
    io.emit('dl', db.dl)
    _osrm.updateData(areaName, user)
        .then(async result => {
            db.dl = { isDl: false, areaName: areaName }
            io.emit('dl', db.dl)

            const data = await db.readDb()

            io.emit('newData', data.area)
        })
        .catch(error => {
            console.log(error)
            db.dl = { isDl: false, areaName: areaName }
            io.emit('dl', db.dl)
        })

    res.send({ isDl: true, areaName: areaName })

})

// http://localhost:3000/osmData/delete/test
app.delete('/data/:areaName', async (req, res) => {
    const user = tokenUser(req);
    const areaName = req.params.areaName;
    const result = await _osrm.deleteData(areaName, user);
    const data = await db.readDb()
    io.emit('newData', data.area)
    res.send(result)
});



// add ou update profil
app.put('/profil/', async (req, res) => {
    const user = tokenUser(req);
    const profil = req.body.profil;
    const areaName = req.body.areaName;

    // db.processing = {'isProcessing':true,'areaName':areaName, 'profil':profil }
    io.emit('isProcessing', { 'isProcessing': true, 'areaName': areaName, 'profil': profil })

    _osrm.prepareAndContract(areaName, profil, user)
        .then(async prepared => {
            // db.processing = {'isProcessing':false,'areaName':areaName, 'profil':profil }
            io.emit('isProcessing', db.processing)
            const data = await db.readDb()
            io.emit('newData', data.area)

        })
        .catch(error => {
            // db.processing = {'isProcessing':false,'areaName':areaName, 'profil':profil, 'error':error };
            io.emit('isProcessing', db.processing)
        })

    res.send({ 'isProcessing': true, 'areaName': areaName, 'profil': profil, 'message': 'Preparation des données en cours' });
});

app.delete('/profil/:areaName/:profil', async (req, res) => {
    const areaName = req.params.areaName; // todo auth
    const profil = req.params.profil;

    const result = await _osrm.deleteProfil(areaName, profil);

    const data = await db.readDb()
    io.emit('newData', data.area)
    // const routes = await _osrm.routing(areaName, profil, coords, req.query)
    res.send(result)
});


// http://localhost:3000/routing/test/car/5.736247,45.17814;5.735071,45.180550?geometries=geojson
app.get('/routing/:areaName/:profil/:coords', async (req, res) => {
    const profil = req.params.profil;
    const areaName = req.params.areaName;
    const coordsStr = req.params.coords;
    const coords = coordsStr.split(';')
        .map(c => {
            return c.split(',')
                .map(cc => parseFloat(cc));
        })

    try {
        const routes = await _osrm.routing(areaName, profil, coords, req.query)
        res.send(routes)
    } catch (error) {
        
        res.send({ error: error })
    }


});




// http://localhost:3000/auth/login?login=admin&password=admin
app.get('/auth/login', async (req, res) => {
    const login = req.query.login;
    const password = req.query.password;
    result = await auth.login(login, password);
    res.send(result)
});

app.put('/auth/password', async (req, res) => {
    const user = tokenUser(req);
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    result = await auth.changePassword(oldPassword, newPassword, user);
    res.send(result)
});

app.post('/user', async (req, res) => {
    const user = tokenUser(req);
    const login = req.body.login;
    const level = req.body.level;
    const password = req.body.password;
    result = await auth.addUser(login, level, password, user);
    res.send(result)
});


server.listen(3000, function () {
    console.log('app listening on port 3000!')
})