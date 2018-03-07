require('dotenv').config();

const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const async = require('async');
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { IncomingWebhook } = require('@slack/client');
const webhook = new IncomingWebhook(process.env.SLACK_HOOK_URL);

const runCommand = (cmd, args = [], cb, endCb) => {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args);

        process.stdout.on('data', data => {
            cb(data);
        });

        process.stderr.on('data', data => {
            cb(undefined, data);
        });

        process.on('close', code => {
            return endCb(code, reject, resolve);
        });
    });
}

const sendMessage = (message) => {
    webhook.send(message, function(err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ', res);
        }
    });
}

const prependNameToMessage = (name, message) => {
    return `[${name}] ${message}`;
}

console.log("test")


const DeploymentStrategies = {
    "vq-deploy-server": {
        "name": "DEPLOY SERVER",
        "master": {
            "runSequence": [
                {
                    "module": "GIT",
                    "command": "git pull",
                    "successMessage": "GIT pull completed"
                },
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "RUN",
                    "command": "node index",
                    "successMessage": "Server started running"
                }
            ]
        }
    },
    "vq-marketplace-platform": {
        "name": "API",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "BUILD",
                    "command": "npm run build:nolint",
                    "successMessage": "Build completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started"
                }
            ]
        }
    },
    "vq-marketplace-web-app": {
        "name": "APP",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "BUILD",
                    "command": "npm run build",
                    "successMessage": "Build completed"
                },
                {
                    "module": "SERVER",
                    "command": "npm run deploy",
                    "successMessage": "Server started"
                }
            ]
        }
    },
    "vq-marketplace-landing-page": {
        "name": "LANDING PAGE",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "BUILD",
                    "command": "npm run build",
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started"
                }
            ]
        }
    },
    "vq-labs.com": {
        "name": "VQ-LABS.COM",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "BUILD",
                    "command": "npm run build",
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started"
                }
            ]
        }
    },
    "vqmarketplace.com": {
        "name": "VQMARKETPLACE.COM",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm install",
                    "successMessage": "Module installation completed"
                },
                {
                    "module": "BUILD",
                    "command": "npm run build",
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started"
                }
            ]
        }
    }
}

const deploy = (repoName, branchName) => {
    sendMessage(`[DEPLOY][${branchName}@${repoName}] Started running deployment scripts...`);
    const sequencePromises = DeploymentStrategies[repoName][branchName].runSequence.map(sequence => {
        return runCommand(
            sequence.command,
            sequence.args,
            (data, err) => {
                if (err) {
                    sendMessage(`
                        --[ERROR][${sequence.name}][${branchName}@${repoName}] An error has occurred: ${err}
                    `)
                }

                sendMessage(`
                        --[PROGRESS][${sequence.name}][${branchName}@${repoName}] Data: ${data}
                    `)
            },
            (code, reject, resolve) => {
                if (code !== 0) {
                    sendMessage(`
                        --[ERROR][${sequence.name}][${branchName}@${repoName}] Command was not completed. Please try again
                    `);
                    return reject()
                } else {
                    sendMessage(`
                        --[SUCCESS][${sequence.name}][${branchName}@${repoName}] ${sequence.successMessage}
                    `)
                    return resolve();
                }

            }
        )
    });

    Promise.all(sequencePromises)
        .then(values => {
            console.log('VALUES', values);
        });
};

http.createServer((req, res) => {
    handler(req, res, (err) => {
        res.statusCode = 404
        res.end('no such location')
    });
}).listen(process.env.SERVER_PORT);

console.log(`[VQ-DEPLOY-SERVER] has started running on port ${process.env.SERVER_PORT}`);

handler.on('error', (err) => {
  console.error('Error:', err.message);
})

handler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");

    deploy(repoName, branchName);
});