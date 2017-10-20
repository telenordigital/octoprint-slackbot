const fs = require('fs');
const path = require('path');

const Busboy = require('busboy');
const config = require('../../config');
const Response = require('node-fetch').Response;

const defaultOpts = {
    headers: {
        'Content-Type': 'application/json',
    },
};

function respond(response, opts) {
    return (fetchMock, method, path) => {
        fetchMock.mock(Object.assign(defaultOpts, { method, matcher: `end:/api/${path}`, response }, opts));
    };
}

const api = {
    connection: {
        get: respond({
            current: {
                state: 'Operational',
                port: '/dev/ttyACM0',
                baudrate: 250000,
                printerProfile: '_default',
            },
            options: {
                ports: ['/dev/ttyACM0', 'VIRTUAL'],
                baudrates: [250000, 230400, 115200, 57600, 38400, 19200, 9600],
                printerProfiles: [{ name: 'Default', id: '_default' }],
                portPreference: '/dev/ttyACM0',
                baudratePreference: 250000,
                printerProfilePreference: '_default',
                autoconnect: true,
            },
        }),
    },
    version: {
        get: respond({
            api: '0.1',
            server: '1.1.0',
        }),
    },
    files: {
        get: respond({
            files: [
                {
                    name: 'whistle_v2.gcode',
                    path: 'whistle_v2.gcode',
                    type: 'machinecode',
                    typePath: ['machinecode', 'gcode'],
                    hash: '...',
                    size: 1468987,
                    date: 1378847754,
                    origin: 'local',
                    refs: {
                        resource: 'http://octopi.local/api/files/local/whistle_v2.gcode',
                        download: 'http://octopi.local/downloads/files/local/whistle_v2.gcode',
                    },
                    gcodeAnalysis: {
                        estimatedPrintTime: 1188,
                        filament: {
                            length: 810,
                            volume: 5.36,
                        },
                    },
                    print: {
                        failure: 4,
                        success: 23,
                        last: {
                            date: 1387144346,
                            success: true,
                        },
                    },
                },
                {
                    name: 'whistle_.gco',
                    path: 'whistle_.gco',
                    type: 'machinecode',
                    typePath: ['machinecode', 'gcode'],
                    origin: 'sdcard',
                    refs: {
                        resource: 'http://octopi.local/api/files/sdcard/whistle_.gco',
                    },
                },
                {
                    name: 'folderA',
                    path: 'folderA',
                    type: 'folder',
                    typePath: ['folder'],
                    children: [],
                    size: 1334,
                },
            ],
            free: '3.2GB',
        }),
    },
    'files/local': {
        get: respond({
            files: [
                {
                    name: 'whistle_v2.gcode',
                    path: 'whistle_v2.gcode',
                    type: 'machinecode',
                    typePath: ['machinecode', 'gcode'],
                    hash: '...',
                    size: 1468987,
                    date: 1378847754,
                    origin: 'local',
                    refs: {
                        resource: 'http://octopi.local/api/files/local/whistle_v2.gcode',
                        download: 'http://octopi.local/downloads/files/local/whistle_v2.gcode',
                    },
                    gcodeAnalysis: {
                        estimatedPrintTime: 1188,
                        filament: {
                            length: 810,
                            volume: 5.36,
                        },
                    },
                    print: {
                        failure: 4,
                        success: 23,
                        last: {
                            date: 1387144346,
                            success: true,
                        },
                    },
                },
            ],
            free: '3.2GB',
        }),
        post: respond(null, {
            headers: {},
            matcher: (url, opts) => opts.body.toString().includes('FormData'),
            response: (url, opts) => new Promise((resolve, reject) => {
                const multipart = new Busboy({ headers: opts.headers });
                const filenames = [];
                let timeoutTimer;

                multipart.on('file', (fieldname, file) => {
                    file.on('data', () => {});
                });
                multipart.on('field', (fieldname, val) => {
                    if (fieldname === 'filename') {
                        filenames.push(val);
                    }
                });
                multipart.on('finish', () => {
                    clearTimeout(timeoutTimer);
                    if (filenames.length !== 1) {
                        reject(Error(`Expected 1 file, but got ${filenames.length}`));
                        return;
                    }

                    resolve({
                        status: 200,
                        body: {
                            files: {
                                local: {
                                    name: filenames[0],
                                    origin: 'local',
                                    refs: {
                                        resource: `http://octopi.local/api/files/local/${filenames[0]}`,
                                        download: `http://octopi.local/downloads/files/local/${filenames[0]}`,
                                    },
                                },
                            },
                            done: true,
                        },
                        headers: {
                            'content-type': 'application/json',
                        },
                    });
                });
                opts.body.pipe(multipart);
                timeoutTimer = setTimeout(reject, 200, Error('Upload timeout'));
            }),
        }),
    },
};

module.exports = (fetchMock) => {
    // Respond 401 Unauthorized if wrong API key
    fetchMock.mock((url, opts) => {
        const apiKey = opts.headers['X-Api-Key'] || opts.headers['x-api-key'];
        return apiKey !== config.get('octoprintApiKey');
    }, 401);

    // Add mock response handlers for paths defined in api above
    Object.keys(api).forEach((path) => {
        const apiPath = api[path];
        const methods = Object.keys(apiPath);
        methods.forEach((method) => {
            apiPath[method](fetchMock, method.toUpperCase(), path);
        });
    });

    fetchMock.mock({
        method: 'get',
        matcher: 'end:/webcam/?action=snapshot',
        response: new Response(fs.createReadStream(path.join(__dirname, 'benchy.jpg')), { status: 200, statusText: 'OK', headers: { 'Content-Type': 'image/jpeg' } }),
    });
};
