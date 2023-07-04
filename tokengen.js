const fs = require('fs');
const request = require("request");
const chalk = require("chalk");
const setTitle = require("console-title")
const APIkey = "test";
const config = require("./config.json")

let emailverified = 0
let phoneverified = 0
let created = 0

function RandomString(length) {
    let radom13chars = function () {
        return Math.random().toString(16).substring(2, 15)
    }
    let loops = Math.ceil(length / 13)
    return new Array(loops).fill(radom13chars).reduce((string, func) => {
        return string + func()
    }, '').substring(0, length)
}

function getEmail(callback) {
    request.get('http://localhost:1337/api/getemail', {
        headers: {
            'x-api-key' : APIkey
        }
    }, (err, res, body) => {
        if(err) {
            return
        }
        if (res.statusCode == 200) {
            callback(JSON.parse(body).email);
        } else {
            callback(0);
        }
    });
}

function createAccount(username, password, verify, verificationtype) {
    try {
        getEmail((email) => {
            if(email != 0) {
                request.get(`http://localhost:1337/discord/api/createaccount?username=${username}&password=${password}&email=${email}`, {
                    headers: {
                        'x-api-key' : APIkey
                    }
                }, (err, res, body) => {
                    if(err) {
                        return
                    }
                    if (res.statusCode == 200) {
                        if (!verify) {
                            let token = JSON.parse(body).token
                            created++
                            console.log(chalk.greenBright(`[SUCCESS] ` + chalk.white(token)))
                            fs.appendFile("./tokens/tokens.txt", token + '\n', function(err) {
                                if(err) {
                                    return
                                }
                            });
                            } else {
                                let token = JSON.parse(body).token
                                request.get(`http://localhost:1337/discord/api/verifyaccount?token=${token}&type=1`, {
                                    headers: {
                                        'x-api-key' : APIkey
                                    }
                                }, (err, response, body) => {
                                    if(err) {
                                        return
                                    }
                                    if(response.statusCode == 200) {
                                        console.log(chalk.yellowBright('[SUCCESS] Email verified: ' + chalk.white(token)))
                                        emailverified++
                                        fs.appendFile("./tokens/backupemailverified.txt", token + '\n', function(err) {
                                           if(err) {
                                               return
                                           }
                                        });
                                         request.get(`http://localhost:1337/discord/api/verifyaccount?token=${token}&type=2`, {
                                             headers: {
                                                 'x-api-key': APIkey
                                             }
                                         }, (err, response, body) => {
                                             if(err) {
                                                 return
                                             }
                                             if(response.statusCode == 200) {
                                                 phoneverified++
                                                 console.log(chalk.greenBright('[SUCCESS] Email and phone verified: ' + chalk.white(token)))
                                                 fs.appendFile("./tokens/fullyverified.txt", token + '\n', function(err) {
                                                     if(err) {
                                                         return
                                                     }
                                                 });
                                             }
                                         })
                                    }
                                });
                            }
                        }
                    })
                }
                var title = `Discord Token Generator | Email Verified: ${emailverified} | Phone Verified: ${phoneverified} | mithian`
                setTitle(title)
            })
        }
    catch(err) {
        return
    }
}

function startAccountCreator() {
    console.log("[GEN] Generating tokens..");
    createAccount(RandomString(15), RandomString(15), true);
    setInterval(() => {
        createAccount(RandomString(15), RandomString(15), true, 2); 
    }, 15000);
}

startAccountCreator();
