module.exports = {
    // Title is common on all objects so we'll use that for console.log
    "server": {
        "start": {
            "title": (variables) => `[${variables.appName}] has started running on port ${variables.port}`,
            "color": "good"
        },
        "error": {
            "title": (variables) => `[${variables.appName}] An error has ocurred ${variables.error}`,
            "color": "danger"
        },
        "status": {
            "title": `*[SERVER STATUS]* Listing all PM2 instances`,
            "online": {
                "title": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is running`,
                "color": "good"
            },
            "stopped": {
                "title": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is stopped`,
                "color": "danger"
            },
            "stopping": {
                "title": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is stopping`,
                "color": "warning"
            },
            "launching": {
                "title": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is being launched`,
                "color": "warning"
            },
            "errored": {
                "title": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} has been errored`,
                "color": "danger"
            },
            "details": (process) => {
                    return [
                        {
                            "title": "Memory",
                            "value": process.memory,
                            "short": false
                        },
                        {
                            "title": "CPU",
                            "value": process.cpu,
                            "short": false
                        },
                        {
                            "title": "Status",
                            "value": process.status.replace(/\b\w/g, l => l.toUpperCase()),
                            "short": false
                        },
                        {
                            "title": "Uptime",
                            "value": process.uptime,
                            "short": false
                        }
                    ]
            },
        }
    },
    "runtime": {
        "start": {
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Started running deployment scripts...`,
            "color": "warning"
        },  
        "error": {
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy failed. Error: ${variables.error}`,
            "color": "danger"
        },
        "success": {
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy completed in ${variables.endTime - variables.startTime} miliseconds`,
            "color": "good"
        },
        "skip": {
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Skipping deploy as no deployment strategy has been found for ${variables.repoName} repository ${variables.branchName} branch`,
            "color": "warning"
        }
    }
}