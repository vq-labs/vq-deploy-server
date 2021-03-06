const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path').path;
const exec = require('child_process').exec;

const DeploymentStrategies = require('../constants/DeploymentStrategies.json');

const MessageService = require('./MessageService');

module.exports = class DeployService {
    constructor(repoName, branchName) {
        this.repoName = repoName;
        this.branchName = branchName;


        this.folderName = DeploymentStrategies[repoName].folder;
        if (this.folderName) {
            this.scriptName = DeploymentStrategies[repoName][branchName];
            if (this.scriptName) {
                this.scriptFile = path.join(appRoot, '../', this.folderName, this.scriptName);
                this.currentWorkingDirectory = path.join(appRoot, '../', this.folderName);
            }
        }
    }

    getNames() {
        return {
            repoName: this.repoName,
            branchName: this.branchName
        }
    }

    deploy() {   
        if (this.folderName && this.scriptName) {
            return this._deploy();
        } else {
            MessageService.writeMessage(
                undefined,
                MessageService.runtime.skip,
                Object.assign(
                    {},
                    this.getNames()
                )
            );
        }
    }
    
    // simulating a private variable
    _deploy() {
        // The deploy server restart itself when commited so you only get 'started...' message but no 'success' message
        // you get the 'deploy server started' message but still
        // it creates a confusion therefore no start message for the deploy server itself
        // the below check only exists here for the start message as the success message is ignored when it is restarted
        if (this.repoName !== process.env.APP_REPO_NAME) {
            MessageService.writeMessage(
                undefined,
                MessageService.runtime.start,
                Object.assign(
                    {},
                    this.getNames()
                )
            );
        }

        const startTime = new Date().getTime();
        // Make sure to make the file executable
        return fs.chmod(
            this.scriptFile,
            0o755, // owner: read, write, execute; group: read and execute, others: read and execute
            err => {
                return exec(
                    this.scriptFile, // Run shell script
                    {
                        // Take the project directory as base to run the sh commands
                        cwd: this.currentWorkingDirectory
                    },
                    (error, stdout, stderr) => {

                        // the below logs are not sent to Slack because they spam the Slack channel.
                        console.log(`${stdout}`); // Output stdout of each command run in shell
                        console.log(`${stderr}`); // Output stderr of each command run in shell
                        
                        //Log the end result to console and/or send to Slack
                        if (error !== null) {
                            // Log with error
                            return MessageService.writeMessage(
                                undefined,
                                MessageService.runtime.error,
                                Object.assign(
                                    {},
                                    this.getNames()
                                )
                            );
                        } else {
                            // Log with time taken to run the script
                            return MessageService.writeMessage(
                                undefined,
                                MessageService.runtime.success,
                                Object.assign(
                                    {},
                                    this.getNames(),
                                    {
                                        startTime: startTime,
                                        endTime: new Date().getTime() 
                                    }
                                )
                            );
                        }

                    }
                );
            }
        );
    }
}