const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db')
const fs = require('fs-extra');
const saltRounds = 10;


exports.login = async (login, password) => {
    let json = await db.readDb();
    const users = json.users
    const user = users.filter( u=> u.login === login)[0]

    if (!user){
        return {'jwtToken': null, 'error': "Cet utilisateur n'existe pas"}
    }
    const isAuth = await bcrypt.compare(password, user.password);
 
    if (!isAuth){
        return {'jwtToken': null, 'error': "Mauvais password"}
    }

    const token = jwt.sign({ id: user.id, level: user.level, login:user.login }, db.JWTSECRET);
    return { 'jwtToken': token, 'error': null,}

}

exports.changePassword = async (oldPaswword, newPassword, userToken) => {
    let json = await db.readDb();
    const users = json.users
    const userDb = users.filter( u=> u.id === userToken.id)[0]

    if (!userDb){
        return {'status': 'ko', 'error': "Cet utilisateur n'existe pas"}
    }
    const isAuth = await bcrypt.compare(oldPaswword, userDb.password);
 
    if (!isAuth){
        return {'status': 'ko', 'error': "Mauvais password"}
    }

    const newBcrypt = await bcrypt.hash(newPassword, saltRounds)
    userDb.password = newBcrypt

    await fs.writeFile('./db.json', JSON.stringify(json), 'utf8')
    return { 'status': 'ok', 'error': null}
}


exports.addUser = async (login, level, password, userToken) => {
    if (userToken.level < 4 ){
        return { 'status': 'ko', 'error': 'Droits insufisants'} 
    }

    let json = await db.readDb();
    const users = json.users

    const userDb = users.filter( u=> u.login === login)[0];
    if (userDb){
        return { 'status': 'ko', 'error': "L'utilisateur existe déjà"} 
    }

    let maxId = -1;
    for (let i = 0; i < users.length; i++){
        const u = users[i];
        if (maxId < u.id){
            maxId = u.id
        }
    }
    level = parseInt(level);

    const newId = maxId + 1;

    const bcryptPassword = await bcrypt.hash(password, saltRounds);
    const newUser = {id: newId, level: level, login:login, password:bcryptPassword }
    json.users.push(newUser);

    await fs.writeFile('./db.json', JSON.stringify(json), 'utf8');
    return { 'status': 'ok', 'error': null, 'user': newUser}
}