const fs = require('fs');
const path = require('path');

async function getUsedPorts() {
    const appsDir = path.join(__dirname, 'apps');
    const portMap = [];

    try {
        // Read all directories in /apps
        const entries = await fs.promises.readdir(appsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const appName = entry.name;
                const composePath = path.join(appsDir, appName, 'compose.yml');

                // Check if compose.yml exists
                try {
                    await fs.promises.access(composePath);
                    
                    // Read compose file
                    const composeContent = await fs.promises.readFile(composePath, 'utf8');
                    
                    // Extract ports using regex
                    // Matches patterns like:
                    // - "3232:3232"
                    // - "${PORT:-8081}:8081"
                    // - "8000:80"
                    const portRegex = /^[\s-]*["']?(?:\$\{[^}]+\}|(\d+)):(?:\d+)(?:\/(?:tcp|udp))?["']?$/gm;
                    
                    let match;
                    while ((match = portRegex.exec(composeContent)) !== null) {
                        const portLine = match[0].trim();
                        
                        // Extract the host port (left side of :)
                        let hostPort;
                        
                        // Check if it's a plain number port
                        const plainPortMatch = portLine.match(/^["']?(\d+):/);
                        if (plainPortMatch) {
                            hostPort = plainPortMatch[1];
                        } else {
                            // Check for environment variable with default
                            const envPortMatch = portLine.match(/\$\{[^:]+:-(\d+)\}/);
                            if (envPortMatch) {
                                hostPort = envPortMatch[1];
                            }
                        }
                        
                        if (hostPort) {
                            portMap.push(`${hostPort}:${appName}`);
                        }
                    }
                    
                } catch (err) {
                    // Skip if compose.yml doesn't exist
                }
            }
        }

        // Sort by port number
        portMap.sort((a, b) => {
            const portA = parseInt(a.split(':')[0]);
            const portB = parseInt(b.split(':')[0]);
            return portA - portB;
        });

        return portMap;

    } catch (error) {
        console.error('Error reading apps directory:', error);
        return [];
    }
}

// Run if called directly
if (require.main === module) {
    getUsedPorts().then(ports => {
        console.log('Used Ports:');
        console.log(ports);
    });
}

module.exports = { getUsedPorts };
