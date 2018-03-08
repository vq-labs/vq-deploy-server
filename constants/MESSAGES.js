export default {
    // Title is common on all objects so we'll use that that for console.log
    "server": {
        "start": {
            "fallback": (variables) => `[${variables.appName}] has started running on port ${variables.port}`,
            "title": (variables) => `[${variables.appName}] has started running on port ${variables.port}`,
            "color": "good"
        },
        "error": {
            "fallback": (variables) => `[${variables.appName}] An error has ocurred ${variables.error}`,
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
            "mergeFields": (process) => {
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
            "fallback": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Started running deployment scripts...`,
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Started running deployment scripts...`,
            "color": "warning"
        },  
        "error": {
            "fallback": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy failed. Error: ${variables.error}`,
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy failed. Error: ${variables.error}`,
            "color": "danger"
        },
        "success": {
            "fallback": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy completed in ${variables.endTime - variables.startTime} miliseconds`,
            "title": (variables) => `[DEPLOY][${variables.branchName}@${variables.repoName}] Deploy completed in ${variables.endTime - variables.startTime} miliseconds`,
            "color": "good"
        }
    }
}