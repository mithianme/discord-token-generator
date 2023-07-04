const fs = require('fs');
const request = require("request");
const chalk = require("chalk");
config = JSON.parse(fs.readFileSync('./config.json', "utf8"));

let tokens = fs.readFileSync('./tokens/emailverified.txt', 'utf-8').replace(/\r/g, '').split('\n')

API = {
    PhoneIds: [],

    GetProxies(callback) {
        request.get('https://proxy.webshare.io/api/proxy/list/', 
        {
            headers: {
                'Authorization' : `Token ${config.webshareAPIKey}`
            }
        }, (err, res, body) => {
            callback(JSON.parse(body).results);
        });
    },

    GetProxy(callback) {
        API.GetProxies((proxies) => {
            var proxy = proxies[Math.floor(Math.random()*proxies.length)];
            callback(`http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.ports.http}`);
        });
    },

    CheckBalance(apikey, callback) {
        request.get(`https://onlinesim.ru/api/getBalance.php?apikey=${apikey}`, {}, (err, res, body) => {
            if (res.statusCode == 200 || res.statusCode == 204) {
                callback(JSON.parse(body).balance);
            }
            else {
                callback(0);
            }
        });
    },

    GetNumbers(apikey, callback) {
        request.get(`https://onlinesim.ru/api/getNumbersStats.php?apikey=${apikey}`, {}, (err, res, body) => {
            if (res.statusCode == 200 || res.statusCode == 204) {
                callback(JSON.parse(body));
            }
            else {
                callback(null);
            }
        });
    },

    GetNumberStart(apikey, service, country, callback) {
        request.get(`https://onlinesim.ru/api/getNum.php?apikey=${apikey}&service=${service}&country=${country}`, {}, (err, res, body) => {
            if (res.statusCode == 200 || res.statusCode == 204) {
                callback(JSON.parse(body).tzid);
            } else {
                callback(null);
            }
        });
    },

    GetNumberEnd(apikey, tzid, callback) {
        request.get(`https://onlinesim.ru/api/getState.php?apikey=${apikey}&tzid=${tzid}`, {}, (err, res, body) => {
            if (res.statusCode == 200 || res.statusCode == 204) {
                var resp = JSON.parse(body);
                for(var i = 0; i < resp.length; i++) {
                    if (resp[i].response == "TZ_NUM_WAIT") {
                        callback(resp[i].number);
                    }
                }
                callback(0);
            }
            else {
                callback(0);
            }
        });
    },

    GetNumberCode(apikey, tzid, callback) {
        request.get(`https://onlinesim.ru/api/getState.php?apikey=${apikey}&tzid=${tzid}`, {}, (err, res, body) => {
            if(err) {
                return
            }
            if (res.statusCode == 200 || res.statusCode == 204) {
                if (JSON.parse(body)[0].response == "TZ_NUM_ANSWER") {
                    callback(JSON.parse(body)[0].msg);
                }
                else {
                    callback(0);
                }
            }
            else {
                callback(0);
            }
        });
    }
}

DiscordAPI = {

    SendPhone(proxy, token, phonenumber, callback) {
        request.post('https://discord.com/api/v8/users/@me/phone', {
            headers: {
                'content-type': 'application/json',
                'authorization': token,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.308 Chrome/78.0.3904.130 Electron/7.3.2 Safari/537.36'
            }, 
            proxy: proxy,
            body: `{"phone":"${phonenumber}"}`
        }, (err, res, body) => {
            if (res == undefined) {
                API.GetProxy((proxy) => {
                    DiscordAPI.SendPhone(proxy, token, phonenumber, callback);
                });
            } else {
                if (res.statusCode == 204) {
                    callback(true);
                }
                else if (res.statusCode == 429) {
                    API.GetProxy((proxy) => {
                        DiscordAPI.SendPhone(proxy, token, phonenumber, callback);
                    });
                }
                else {
                    callback(false);
                }
            }
        })
    },

    SendCode(proxy, token, code, callback) {
        request.post('https://discordapp.com/api/v8/users/@me/phone/verify', {
            headers: {
                'content-type': 'application/json',
                'authorization': token,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.308 Chrome/78.0.3904.130 Electron/7.3.2 Safari/537.36'
            }, 
            proxy: proxy,
            body: `{"code":"${code}"}`
        }, (err, res, body) => {
            if (res == undefined) {
                API.GetProxy((proxy) => {
                    DiscordAPI.SendPhone(proxy, token, code, callback);
                });
            } else {
                if (res.statusCode == 204) {
                    callback(true);
                }
                else if (res.statusCode == 429) {
                    API.GetProxy((proxy) => {
                        DiscordAPI.SendPhone(proxy, token, code, callback);
                    });
                }
                else {
                    callback(false);
                }
            }
        })
    }
}

let i = 0;

let interval = setInterval(function() {
    let token = tokens[i++]
    console.log('[INFO] Requesting proxy...');
    API.GetProxy((proxy) => {
        console.log('[INFO] Received proxy...');
        console.log('[INFO] Requesting phone number...');
        API.CheckBalance(config.onlinesimAPIKey, (balance) => {
            if (balance > 10.00) {
                API.GetNumberStart(config.onlinesimAPIKey, "discord", "7", (tzid) => {
                    API.GetNumberEnd(config.onlinesimAPIKey, tzid, (number) => {
                        if (number != 0) {
                            console.log('[INFO] Received phone number -> ' + number);
                            console.log('[INFO] Sending phone number to Discord...');
                            DiscordAPI.SendPhone(proxy, token, number, (sent) => {
                                if(sent) {
                                    console.log('[INFO] Sent phone number to Discord. Waiting for codes...');
                                    setInterval(() => {
                                        if (!API.PhoneIds.includes(tzid)) {
                                            API.GetNumberCode(config.onlinesimAPIKey, tzid, (code) => {
                                                if (code != 0) {
                                                    console.log(`[INFO] Received Code from Discord -> ${code}. Verifying Account...`);
                                                    DiscordAPI.SendCode(proxy, token, code, (sentcode) => {
                                                        if (sentcode) {
                                                            console.log(chalk.greenBright(`[SUCCESS] Verified Account: ${token}`))
                                                            fs.appendFile("./verifiedtokens.txt", token + '\n', function(err) {
                                                                if(err) {
                                                                    return
                                                                }
                                                            });
                                                        } else {
                                                            console.log('[ERROR] Failed to send code to Discord.');
                                                        }
                                                    });
                                                    API.PhoneIds.push(tzid);
                                                }
                                            });
                                        } 
                                    }, 3000);
                                } else {
                                    console.log('[ERROR] Failed to send phone number to Discord');
                                }
                            });
                        }
                    });
                });
            }
            else {
                console.log('Insufficient funds.');
            }
        });
    })
        if(i == tokens.length){
            clearInterval(interval)
            console.log('Successfully phone verified tokens.')
        }
}, 15000);
