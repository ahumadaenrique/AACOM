const fs = require('fs');
const path = require('path');
const https = require('https');

const CLIENT_ID = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GDRIVE_FOLDER_ID;
const FILE_PATH = process.env.ZIP_FILE_PATH;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !FOLDER_ID || !FILE_PATH) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const fileName = path.basename(FILE_PATH);
const fileStats = fs.statSync(FILE_PATH);

async function getAccessToken() {
    console.log("Getting new access token using refresh token...");
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token'
        }).toString();

        const options = {
            hostname: 'oauth2.googleapis.com',
            path: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.access_token) {
                    resolve(json.access_token);
                } else {
                    reject(new Error(`Failed to get token: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function uploadFile(accessToken) {
    console.log(`Starting upload of ${fileName} (${fileStats.size} bytes) to Google Drive folder ${FOLDER_ID}...`);
    
    return new Promise((resolve, reject) => {
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        
        const metadata = {
            name: fileName,
            parents: [FOLDER_ID]
        };

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/zip\r\n\r\n';

        const options = {
            hostname: 'www.googleapis.com',
            path: '/upload/drive/v3/files?uploadType=multipart',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(multipartRequestBody) + fileStats.size + Buffer.byteLength(closeDelimiter)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log("Upload successful!");
                    console.log(data);
                    resolve();
                } else {
                    console.error("Upload failed with status", res.statusCode);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        
        // Write metadata
        req.write(multipartRequestBody);
        
        // Write file contents using stream to avoid loading entire file into memory
        const fileStream = fs.createReadStream(FILE_PATH);
        fileStream.on('data', (chunk) => {
            req.write(chunk);
        });
        fileStream.on('end', () => {
            req.write(closeDelimiter);
            req.end();
        });
        fileStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function deleteOldBackups(accessToken) {
    console.log("Checking for backups older than 120 days...");
    const MAX_DAYS = 120;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);

    return new Promise((resolve, reject) => {
        const query = encodeURIComponent(`'${FOLDER_ID}' in parents and trashed=false`);
        const options = {
            hostname: 'www.googleapis.com',
            path: `/drive/v3/files?q=${query}&fields=files(id,name,createdTime)`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                if (res.statusCode !== 200) {
                    console.error("Failed to list files:", data);
                    return resolve(); // Don't crash the whole script if cleanup fails
                }

                try {
                    const files = JSON.parse(data).files || [];
                    const filesToDelete = files.filter(file => {
                        const fileDate = new Date(file.createdTime);
                        return fileDate < cutoffDate && file.name.startsWith('AACOMSOFT_Backup_');
                    });

                    if (filesToDelete.length === 0) {
                        console.log("No old backups found to delete.");
                        return resolve();
                    }

                    console.log(`Found ${filesToDelete.length} old backup(s) to delete.`);
                    
                    for (const file of filesToDelete) {
                        await deleteFile(accessToken, file.id, file.name);
                    }
                    resolve();
                } catch (e) {
                    console.error("Error parsing files list:", e);
                    resolve();
                }
            });
        });
        req.on('error', (e) => {
            console.error("Network error listing files:", e);
            resolve();
        });
        req.end();
    });
}

async function deleteFile(accessToken, fileId, fileName) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'www.googleapis.com',
            path: `/drive/v3/files/${fileId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const req = https.request(options, (res) => {
            if (res.statusCode === 204) {
                console.log(`Successfully deleted old backup: ${fileName}`);
            } else {
                console.error(`Failed to delete ${fileName} (Status: ${res.statusCode})`);
            }
            resolve();
        });
        req.on('error', () => resolve());
        req.end();
    });
}

async function run() {
    try {
        const token = await getAccessToken();
        await uploadFile(token);
        await deleteOldBackups(token);
    } catch (err) {
        console.error("Backup script failed:");
        console.error(err);
        process.exit(1);
    }
}

run();
