const fs = require('fs');
const appRoot = require('app-root-path').path;

const DeploymentStrategies = require('../constants/DeploymentStrategies.json');

const MessageService = require('./MessageService');

module.exports = class DeployHandler {
    constructor(repoName, branchName) {
        this.repoName = repoName;
        this.branchName = branchName;

        this.folderName = DeploymentStrategies[repoName].folder;
        this.scriptName = DeploymentStrategies[repoName][branchName];
        this.scriptFile = path.join(appRoot, '../', folderName, scriptName);
        this.currentWorkingDirectory = path.join(appRoot, '../', folderName);
    }

    getNames() {
        return {
            repoName: this.repoName,
            branchName: this.branchName
        }
    }

    deploy() {   
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
            fs.constants.S_IXGRP, //give execute/search by group permission. https://nodejs.org/api/fs.html#fs_file_modes
            err => {
                return 
                exec(
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