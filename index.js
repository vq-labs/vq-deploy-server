require('dotenv').config();

const appRoot = require('app-root-path').path;
const path = require('path');
const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const async = require('async');
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { IncomingWebhook } = require('@slack/client');
const webhook = new IncomingWebhook(process.env.SLACK_HOOK_URL);

const runCommand = (folder, cmd, args = [], cb, endCb) => {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args, {cwd: path.join(appRoot, '../', folder)});

        process.stdout.on('data', data => {
            cb(data);
        });

        process.stderr.on('data', data => {
            cb(undefined, data);
        });

        process.on('error', code => {
            console.log('err here', code);
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

console.log("test 1 asdfasdfasdfasd")


const DeploymentStrategies = {
    "vq-deploy-server": {
        "name": "DEPLOY SERVER",
        "folder": "vq-deploy-server",
        "master": {
            "runSequence": [
                {
                    "module": "GIT",
                    "command": "git",
                    "args": [
                        "pull"
                    ],
                    "successMessage": "GIT pull completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "RUN",
                    "command": "pm2",
                    "args": [
                        "restart",
                        "../ecosystem.config.js",
                        "--only",
                        "vq-deploy-server"
                    ],
                    "successMessage": "Server started running",
                    "onlySuccessMessage": true
                }
            ]
        }
    },
    "vq-marketplace-platform": {
        "name": "API",
        "folder": "vq-marketplace-api",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "BUILD",
                    "command": "npm",
                    "args": [
                        "run",
                        "build:nolint"
                    ],
                    "successMessage": "Build completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started",
                    "onlySuccessMessage": true
                }
            ]
        }
    },
    "vq-marketplace-web-app": {
        "name": "APP",
        "folder": "vq-marketplace-web-app",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "BUILD",
                    "command": "npm",
                    "args": [
                        "run",
                        "build"
                    ],
                    "successMessage": "Build completed"
                },
                {
                    "module": "SERVER",
                    "command": "npm",
                    "args": [
                        "run",
                        "deploy"
                    ],
                    "successMessage": "Server started",
                    "onlySuccessMessage": true
                }
            ]
        }
    },
    "vq-marketplace-landing-page": {
        "name": "LANDING PAGE",
        "folder": "vq-marketplace-landing-page",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "BUILD",
                    "command": "npm",
                    "args": [
                        "run",
                        "build"
                    ],
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started",
                    "onlySuccessMessage": true
                }
            ]
        }
    },
    "vq-labs.com": {
        "name": "VQ-LABS.COM",
        "folder": "vq-labs.com",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "BUILD",
                    "command": "npm",
                    "args": [
                        "run",
                        "build"
                    ],
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started",
                    "onlySuccessMessage": true
                }
            ]
        }
    },
    "vqmarketplace.com": {
        "name": "VQMARKETPLACE.COM",
        "folder": "vqmarketplace.com",
        "master": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed",
                    "onlySuccessMessage": true
                },
                {
                    "module": "BUILD",
                    "command": "npm",
                    "args": [
                        "run",
                        "build"
                    ],
                    "successMessage": "Deploy completed"
                },
                {
                    "module": "SERVER",
                    "command": "",
                    "successMessage": "Server started",
                    "onlySuccessMessage": true
                }
            ]
        }
    }
}

const deploy = (repoName, branchName) => {
    sendMessage(`[DEPLOY][${branchName}@${repoName}] Started running deployment scripts...`);
    const sequencePromises = DeploymentStrategies[repoName][branchName].runSequence.map(sequence => {
        return runCommand(
            DeploymentStrategies[repoName].folder,
            sequence.command,
            sequence.args,
            (data, err) => {
                if (err) {
                    if (!sequence.onlySuccessMessage) {
                        sendMessage(`
                            --[ERROR][${sequence.module}][${branchName}@${repoName}] An error has occurred: ${err}
                        `)
                    }
                }

                if (!sequence.onlySuccessMessage) {    
                    sendMessage(`
                            --[PROGRESS][${sequence.module}][${branchName}@${repoName}] Data: ${data}
                        `)
                }
            },
            (code, reject, resolve) => {
                if (code !== 0) {
                    sendMessage(`
                        --[ERROR][${sequence.module}][${branchName}@${repoName}] Command was not completed. Please try again
                    `);
                    return reject()
                } else {
                    sendMessage(`
                        --[SUCCESS][${sequence.module}][${branchName}@${repoName}] ${sequence.successMessage}
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