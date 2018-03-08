const fs = require('fs');
const appRoot = require('app-root-path').path;

const DeploymentStrategies = require('./DeploymentStrategies.json');

const MessageHandler = require('./MessageHandlerClass');

export class DeployHandler {
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
        // The server restart itself so you only get started... message but no done message.
        // It creates a confusion therefore no messages for the deploy server itself
        if (this.repoName !== process.env.APP_REPO_NAME) {
            MessageHandler.writeMessage(
                undefined,
                MessageHandler.runtime.start,
                { 
                    ...this.getNames()
                });
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

                        console.log(`${stdout}`); // Output stdout of each command run in shell
                        console.log(`${stderr}`); // Output stderr of each command run in shell
                        
                        //Log the end result to console and/or send to Slack
                        if (error !== null) {
                            // Log with error
                            return MessageHandler.writeMessage(
                                undefined,
                                MessageHandler.runtime.error,
                                {
                                    ...this.getNames(),
                                    error
                                }
                            );
                        } else {
                            // Log with time taken to run the script
                            return MessageHandler.writeMessage(
                                undefined,
                                MessageHandler.runtime.success,
                                {
                                    ...this.getNames(),
                                    startTime: startTime,
                                    endTime: new Date().getTime()
                                }
                            );
                        }

                    }
                );
            }
        );
    }
}