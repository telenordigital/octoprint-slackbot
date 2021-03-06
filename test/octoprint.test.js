const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const concat = require('concat-stream');
const fetchMock = require('fetch-mock').restore().sandbox();
require('./fixtures/octoprint-rest-api-mock')(fetchMock);
const proxyquire = require('proxyquire');
const { describe, it } = require('mocha');
const { assert } = require('chai');

const octoprint = proxyquire('../octoprint', {
    'node-fetch': fetchMock,
});

describe('octoprint', () => {
    it('sends API key header', () => octoprint.getVersion());

    it('get version', () => octoprint.getVersion().then((res) => {
        assert.equal(res.server, '1.1.0', 'Server version');
        assert.equal(res.api, '0.1', 'API version');
    }));

    it('get connection', () => octoprint.getConnection().then((res) => {
        assert.equal(res.current.state, 'Operational', 'Printer state');
    }));

    it('get files', () => octoprint.getFiles().then((res) => {
        const file = res.files[0];
        assert.equal(file.name, 'whistle_v2.gcode', 'File name');
        assert.equal(file.gcodeAnalysis.estimatedPrintTime, 1188, 'Estimated print time');
        assert.equal(file.print.success, 23, 'Print success');
    }));

    it('get local files', () => octoprint.getLocalFiles().then((res) => {
        const file = res.files[0];
        assert.equal(file.name, 'whistle_v2.gcode', 'File name');
        assert.equal(file.gcodeAnalysis.estimatedPrintTime, 1188, 'Estimated print time');
        assert.equal(file.print.success, 23, 'Print success');
    }));

    // need to mock form-data (which doesn't use node-fetch)
    it.skip('upload local file', () => {
        const filename = 'cube.gcode';
        const readableStream = fs.createReadStream(path.join(__dirname, 'fixtures', filename));

        return octoprint.uploadLocalFile(filename, readableStream).then((res) => {
            const file = res.files.local;
            assert.equal(file.name, 'cube.gcode', 'Filename');
            assert.isTrue(res.done, 'Done');
        });
    });

    it('get snapshot', () => octoprint.getSnapshot().then((imageStream) => {
        return new Promise((resolve, reject) => {
            imageStream
                .on('error', (error) => {
                    console.error('Error converting binary image stream to buffer', error);
                    reject(error);
                })
                .pipe(concat(resolve));
        }).then((imageBuffer) => {
            const type = fileType(imageBuffer);
            assert.equal(type.mime, 'image/jpeg');
            assert.equal(imageBuffer.length, 504775);
        });
    }));
});
