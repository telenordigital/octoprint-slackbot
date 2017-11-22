const fs = require('fs');
const octoprint = require('../octoprint');

octoprint.getSnapshot().then((imageStream) => {
    imageStream.pipe(fs.createWriteStream('/tmp/snapshot.jpg'));
});
