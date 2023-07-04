const fs = require('fs');
const request = require("request");
const chalk = require("chalk");
const APIkey = "test";
config = JSON.parse(fs.readFileSync('./config.json', "utf8"));

let tokens = fs.readFileSync('./tokens/oldtokens.txt', 'utf-8').replace(/\r/g, '').split('\n')

API = {
    SolvedCaptchas: [],
    Emails: [],
    Domains: [
        // private email domains
    ],

    GetURL(text)  {
        var matches = text.match(/\bhttps?:\/\/\S+/gi);
        return matches;
    },

    GetRedirect(url, callback) {
        request.get(url, {}, (err, res, body) => {
            callback(res.request.uri.href);
        });
    },

    GetEmails(email, callback) {
        request.get(`http://emaildomain/api/${email}`, {}, (err, res, body) => {
            if (body == "[]") {
                callback(0); 
            } else {
                callback(JSON.parse(body));
            }
        });
    },

    GetEmailDomain() {
        return API.Domains[Math.floor(Math.random()*API.Domains.length)];
    },

    GetEmailAddress() {
        return `${API.RandomString(20)}@${API.GetEmailDomain()}`;
    },

    RandomString(length) {
        let radom13chars = function () {
            return Math.random().toString(16).substring(2, 15)
        }
        let loops = Math.ceil(length / 13)
        return new Array(loops).fill(radom13chars).reduce((string, func) => {
            return string + func()
        }, '').substring(0, length)
    },

    IsValidDomain(domain) {
        return API.Domains.includes(domain);
    },

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

    GetCaptchaStart(key, sitekey, pageurl, callback) {
        request.get(`https://2captcha.com/in.php?key=${key}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${pageurl}&json=1`, {}, (err, res, body) => {
             if (res.statusCode == 200 || res.statusCode == 204) {
                 if (body == "ERROR_NO_SLOT_AVAILABLE") {
                    callback(0);
                 } else {
                    if (JSON.parse(body).status == 1) {
                        callback(JSON.parse(body).request);
                    } else {
                        callback(0);
                    }
                 }
             }
             else {
                 callback(0);
             }
        });
    },

    GetCaptchaEnd(key, id, callback)  {
        request.get(`https://2captcha.com/res.php?key=${key}&action=get&id=${id}&json=1`, {}, (err, res, body) => {
            if (res.statusCode == 200 || res.statusCode == 204) {
                if (JSON.parse(body).status == 1) {
                    callback(JSON.parse(body).request);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    }

}

DiscordAPI = {

    GetFingerprint(proxy, callback) {
        request.get('https://discord.com/api/v8/experiments', {
            headers: {
                'user-agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'x-context-properties' : 'eyJsb2NhdGlvbiI6IkxvZ2luIn0=',
                'x-track' : 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg1LjAuNDE4My4xMjEgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijg1LjAuNDE4My4xMjEiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo5OTk5LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==',
                'x-super-properties' : 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg1LjAuNDE4My4xMjEgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijg1LjAuNDE4My4xMjEiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo2NzgyNSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0='
            },
            proxy: proxy
        }, (err, res, body) => {
            if (body == undefined) {
                API.GetProxy((proxy) => {
                    DiscordAPI.GetFingerprint()
                });
            }
            else {
                if(err) {
                    return
                }
                if (res.statusCode == 200) {
                    callback(JSON.parse(body).fingerprint);
                } else {
                    callback(0);
                }
            }
        });
    },
    GetUserInformationWithProxy(proxy, token, callback)  {
        request.get('https://discord.com/api/v8/users/@me', {
            headers: {
                'authorization' : token,
                'user-agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'x-super-properties' : 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg1LjAuNDE4My4xMjEgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijg1LjAuNDE4My4xMjEiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo2NzgyNSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=',
            },
            proxy: proxy
        }, (err, res, body) => {
            if(err) {
                return
            }
            if (res.statusCode == 200) {
                callback(JSON.parse(body));
            } else {
                callback(0);
            }
        });
    },
    GetUserInformation(token, callback)  {
        request.get('https://discord.com/api/v8/users/@me', {
            headers: {
                'authorization' : token,
                'user-agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'x-super-properties' : 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg1LjAuNDE4My4xMjEgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijg1LjAuNDE4My4xMjEiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo2NzgyNSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=',
            }
        }, (err, res, body) => {
            if (res.statusCode == 401) {
                callback(0);
            } else {
                callback(JSON.parse(body));
            }
        });
    },

    VerifyEmail(proxy, captcha, token, emailtoken, callback) {
        request.post('https://discord.com/api/v8/auth/verify', {
            headers: {
                'content-type' : 'application/json',
                'authorization' : token,
                'user-agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'x-super-properties' : 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg1LjAuNDE4My4xMjEgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijg1LjAuNDE4My4xMjEiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo2NzgyNSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=',
            },
            proxy: proxy,
            body: `{"token":"${emailtoken}","captcha_key":"${captcha}"}`
        }, (err, res, body) => {
            if (body == undefined) {
                API.GetProxy((proxy) => {
                    DiscordAPI.VerifyEmail(proxy, captcha, token, emailtoken, callback);
                });
            }
            else {
                if (res.statusCode == 200) {
                    callback(JSON.parse(body).token);
                } else {
                    callback(0);
                }
            }
        });
    }
}

let i = 0;

let interval = setInterval(function() {
    let token = tokens[i++]
    console.log('[INFO] Requesting proxy...');
    API.GetProxy((proxy) => {
        console.log('[INFO] Received proxy...');
        console.log('[INFO] Gathering Email...');
        DiscordAPI.GetUserInformationWithProxy(proxy, token, (info) => {
        if(info != 0)  {
            setInterval(() => {
                if(!API.Emails.includes(info.email)) {
                    API.GetEmails(info.email, (emails) => {
                        if(emails != 0) {
                            console.log('[INFO] Received Emails... Checking Emails...');
                            var discordemail = emails[0];
                            if(discordemail.from[0].name == "Discord") {
                                console.log('[INFO] Scraping URLs from email body...');
                                var urls = API.GetURL(discordemail.body.text);
                                var discordurl = urls[0].replace('\n', '');
                                console.log('[INFO] Scraped Email Verification URL -> ' + discordurl);
                                API.GetRedirect(discordurl, (redirect) => {
                                    console.log('[INFO] Mitigating Redirect.. Redirected URL -> ' + redirect);
                                    var emailtoken = redirect.split('#')[1].replace('token=', '');
                                    console.log('[INFO] Verifying Email with Email Token -> ' + emailtoken);
                                    console.log('[INFO] Solving Captcha...');
                                    API.GetCaptchaStart(config.twocaptchaAPIKey, "6Lef5iQTAAAAAKeIvIY-DeexoO3gj7ryl9rLMEnn", "https://discord.com/register", (requestid) => {
                                        if(requestid != 0) {
                                            console.log('[INFO] Waiting for captcha to be solved...');
                                            setInterval(() => {
                                                if(!API.SolvedCaptchas.includes(requestid)) {
                                                    API.GetCaptchaEnd(config.twocaptchaAPIKey, requestid, (captcha) => {
                                                        if (captcha != null) {
                                                            console.log('[INFO] Captcha solved. Verifying account...');
                                                            DiscordAPI.VerifyEmail(proxy, captcha, token, emailtoken, (verified) => {
                                                                if (verified != 0) {
                                                                    console.log(chalk.greenBright('[SUCCESS] ' + chalk.white('Email verified account.')))
                                                                    fs.appendFile("./tokens/emailverified.txt", token + '\n', function(err) {
                                                                        if(err) {
                                                                            return
                                                                        }
                                                                    });
                                                                } else {
                                                                    console.log(chalk.redBright('[ERROR] ' + chalk.white('Couldn\'t email verify account.')))
                                                                }
                                                            });
                                                            API.SolvedCaptchas.push(requestid);
                                                        }
                                                    });
                                                }
                                            }, 5000);
                                        } else {
                                            console.log(chalk.red('[ERROR] ' + chalk.white('Couldn\'t start solving the captcha.')))
                                        }
                                    });
                                });
                            } else {
                                console.log(chalk.redBright('[ERROR] ' + chalk.white('Couldn\'t get user information linked to the account, account may be disabled.')))
                            }
                            API.Emails.push(info.email);
                        }
                    });
                }
            }, 2000);
          } 
          else {
            console.log(chalk.red('[ERROR] ' + chalk.white('Couldn\'t get the user information linked to the account, account may be disabled.')))
          }
        });
    });
    if(i == tokens.length) {
        clearInterval(interval)
        console.log('Successfully email verified tokens.')
    }
}, 15000);
