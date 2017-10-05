const fetch = require('node-fetch');
const FormData = require('form-data');

const config = require('./config');

const baseURI = `http://${config.get('octoprintAddress')}/api/`;
const defaultHeaders = {
    'X-Api-Key': config.get('octoprintApiKey'),
};

function apiRequest(resource) {
    return fetch(`${baseURI}${resource}`, { headers: Object.assign({}, defaultHeaders, { 'Content-Type': 'application/json' }) })
        .then(res => res.json());
}

function apiUpload(resource, filename, readableStream) {
    const form = new FormData();
    form.append('file', readableStream);
    form.append('filename', filename);

    return fetch(`${baseURI}${resource}`, {
        headers: form.getHeaders(defaultHeaders),
        method: 'POST',
        body: form,
    }).then((res) => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return res.json();
        }
        console.error(res.status, res.statusText);
        throw new TypeError("Oops, we haven't got JSON!");
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
};
