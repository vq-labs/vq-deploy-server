require('dotenv').config();

const appRoot = require('app-root-path').path;
const path = require('path');
const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const Promise = require("bluebird");
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { IncomingWebhook } = require('@slack/client');
const webhook = new IncomingWebhook(process.env.SLACK_HOOK_URL);

const runCommand = (folder, cmd, args = []) => {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args, {cwd: path.join(appRoot, '../', folder)});

        process.stdout.on('data', data => {
            if (data) {
                //console.log(data);
            }
        });

        process.stderr.on('data', data => {
            if (data) {
                //console.log(data);
            }
        });

        process.on('error', code => {
            if (code) {
                //console.log(code);
            }
        });

        process.on('close', code => {
            if (code !== 0) {
                return reject();
            }
            return resolve(code, cmd);
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
                    ]
                },
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ]
                },
                {
                    "module": "RUN",
                    "command": "pm2",
                    "args": [
                        "restart",
                        "../ecosystem.config.js",
                        "--only",
                        "vq-deploy-server"
                    ]
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
                    "successMessage": "Module installation completed"
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
                    "successMessage": "Server started"
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
                    "successMessage": "Module installation completed"
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
                    "successMessage": "Server started"
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
                    "successMessage": "Module installation completed"
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
                    "successMessage": "Server started"
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
                    "successMessage": "Module installation completed"
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
                    "successMessage": "Server started"
                }
            ]
        }
    },
    "vqmarketplace.com": {
        "name": "VQMARKETPLACE.COM",
        "folder": "vqmarketplace.com",
        "VM-32": {
            "runSequence": [
                {
                    "module": "INSTALL",
                    "command": "npm",
                    "args": [
                        "install"
                    ],
                    "successMessage": "Module installation completed"
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
                    "successMessage": "Server started"
                }
            ]
        }
    }
}

const deploy = (repoName, branchName) => {
    sendMessage(`[DEPLOY][${branchName}@${repoName}] Started running deployment scripts...`);
    const results = [];

/*     if (code !== 0) {
        results.push(`
            --[ERROR][${sequence.module}][${branchName}@${repoName}] Command was not completed. Please try again
        `);
        return reject()
    } else {
        results.push(`
            --[SUCCESS][${sequence.module}][${branchName}@${repoName}] ${sequence.successMessage}
        `)
        return resolve();
    } */

    const sequencePromises = DeploymentStrategies[repoName][branchName]["runSequence"].map(sequence => {
        return runCommand(
            DeploymentStrategies[repoName].folder,
            sequence.command,
            sequence.args
        )
    });

    Promise.each(
        sequencePromises)
        .then(values => {
            console.log('VALUES', values)
            //sendMessage(results.join("\n"));
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