const octoprint = require('./octoprint');
const blobUtil = require('blob-util');

function promiseProps(obj) {
    const keys = Object.keys(obj);
    const promises = keys.map(key => obj[key]);
    return Promise.all(promises)
        .then(resArr => resArr.reduce((acc, curr, i) => {
            const key = keys[i];
            acc[key] = curr;
            return acc;
        }, {}))
        .catch((err) => {
            console.error('Promise error', err);
            Promise.reject(err);
        });
}

module.exports = {
    handle({ text, fileInfo }) {
        if (!text) {
            Promise.reject(new TypeError("Message text can't be empty"));
        } else if (text.includes('status')) {
            console.log('status requested');
            return promiseProps({
                version: octoprint.getVersion(),
                connection: octoprint.getConnection(),
            }).then((result) => {
                console.log('status result', result);
                return result;
            }).then(({ version, connection }) => ({
                responseText: `OctoPi Status
                           Server version: ${version.server}
                           API version: ${version.api}

                           Printer connection status: ${connection.current.state}`.replace(/^\s*/gm, ''),
            }));
        } else if (text.includes('snapshot')) {
            return octoprint.getSnapshot()
                .then(imageBlob => ({
                    imageURL: blobUtil.createObjectURL(imageBlob),
                }));
        }
        return Promise.resolve('Yo!');
    },
};

// http://octopi.local/webcam/?action=snapshot
