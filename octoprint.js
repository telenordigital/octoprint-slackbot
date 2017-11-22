const url = require('url');
const fetch = require('node-fetch');
const FormData = require('form-data');
const concat = require('concat-stream');

const config = require('./config');

const baseURI = `http://${config.get('octoprintAddress')}`;
const apiBaseURI = `${baseURI}/api`;
const defaultHeaders = {
    'X-Api-Key': config.get('octoprintApiKey'),
};

function apiRequest(resource) {
    return fetch(`${apiBaseURI}/${resource}`, { headers: Object.assign({}, defaultHeaders, { 'Content-Type': 'application/json' }) })
        .then(res => res.json());
}

function apiUpload(resource, filename, readableStream) {
    const form = new FormData();
    form.append('file', readableStream);
    form.append('filename', filename);

    const u = url.parse(`${apiBaseURI}/${resource}`);
    const headers = form.getHeaders(defaultHeaders);
    return new Promise((resolve, reject) => {
        form.submit({
            path: u.pathname,
            host: u.hostname,
            port: u.port,
            headers,
        }, (err, res) => {
            if (err) { return reject(err); }
            return resolve(res);
        });
    }).then((res) => {
        const contentType = res.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            return new Promise((resolve, reject) => {
                res.pipe(concat({ encoding: 'string' }, resolve));
                res.on('error', reject);
            });
        }
        throw new Error(`Upload failed: ${res.statusCode} ${res.statusMessage}`);
    }).then(body => JSON.parse(body));
}

function snapshot() {
    return fetch(`${baseURI}/webcam/?action=snapshot`, { headers: defaultHeaders })
        .then((res) => {
            if (res.ok) {
                return res.body;
            }
            return Promise.reject(`Not OK response: ${res.status} ${res.statusText}`);
        });
}

module.exports = {
    getVersion() {
        return apiRequest('version');
    },
    getConnection() {
        return apiRequest('connection');
    },
    getFiles() {
        return apiRequest('files');
    },
    getLocalFiles() {
        return apiRequest('files/local');
    },
    uploadLocalFile(filename, readableStream) {
        return apiUpload('files/local', filename, readableStream);
    },
    getSnapshot() {
        return snapshot();
    },
};
