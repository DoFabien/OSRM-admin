const fs = require('fs-extra')
const path = require('path');



exports.processing = {isProcessing: false, areaName: undefined, profil: undefined};
exports.dl =  { isDl: false, areaName: undefined}


exports.readDb = async function () {
    const dbPath = './db.json'
    const exists = await fs.pathExists(dbPath);
    if (!exists) {
        await fs.writeFile(dbPath, JSON.stringify(
            {'area': {}, 
            'users': [
                {'id':0,
                'level': 4,
                'login': 'admin',
                'password':'$2b$10$tpHwvC5n9Bhaf2RFVQxf9e0umaj53CYQcZGsnQN3qUkQnjpOtPuLS' // bcrypt admin
                }
            ]}
        ))
    }

    const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));

    return db;
}
// nano ~/.bashrc  => export JWTSECRET="chutt"
exports.JWTSECRET = process.env.JWTSECRET || 'je suis une cle secrette plus si secrette';