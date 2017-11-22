const fs = require('fs');
const path = require('path');

const octoprint = require('../octoprint');

const filename = 'cube.gcode';
const readableStream = fs.createReadStream(path.join(__dirname, 'fixtures', filename));

octoprint
    .uploadLocalFile(filename, readableStream)
    .then((res) => {
        const file = res.files.local;
        console.log(file.name, res.done);
    })
    .catch((err) => {
        console.error('Upload error', err);
    });
