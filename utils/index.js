import fs from 'fs';

let dataDir = './data';
export const checkSubject = function (subject, cb) {
    const checkPath = `${dataDir}/${subject}`;

    fs.stat(checkPath, function (err, stats) {
        cb(null, stats.isDirectory());
    });
};



export const checkerForEntry = function (entry) {
    // Record name should be before the '.'
    var record = entry.split(".")[0];
    return function (cb) {
        checkRecord(subject, record, cb);
    };
};