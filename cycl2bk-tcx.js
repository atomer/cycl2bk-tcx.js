#!/usr/bin/env node

var fs = require("fs");
var xml2js = require("xml2js");
var glob = require("glob");

var dir = process.argv[2];
if (dir.charAt(dir.length - 1) !== "/") {
    dir += "/";
}

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();
var readFile = function(file) {
    return new Promise(function(resolve, reject) {
        fs.readFile(file, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    file: file,
                    data: data
                });
            }
        });
    });
};
var writeFile = function(data) {
    var xml = builder.buildObject(data.xml);
    return new Promise(function(resolve, reject) {
        fs.writeFile(data.file, xml, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    });
};
var parseXML = function(data) {
    return new Promise(function(resolve, reject) {
        parser.parseString(data.data, function(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    file: data.file,
                    xml: res
                });
            }
        });
    });
}

new Promise(function(resolve, reject) {
    glob(dir + "*.tcx", null, function(err, files) {
        if (err) {
            reject(err);
        } else {
            resolve(files);
        }
    });
})
    .then(function(files) {
        var a = [];
        files.forEach(function(file) {
            a.push(readFile(file));
        });
        return Promise.all(a);
    }, function(err) {
        console.error(err);
    })
    .then(function(results) {
        var a = [];
        results.forEach(function(data) {
            a.push(parseXML(data));
        });
        return Promise.all(a);
    }, function(err) {
        console.error(err);
    })
    .then(function(results) {
        var a = [];
        results.forEach(function(data) {
            var hasCycling = false;
            var Activity;
            data.xml.TrainingCenterDatabase.Activities[0].Activity.forEach(function(Activity) {
                if (Activity.$.Sport === "cycling") {
                    Activity.$.Sport = "Biking";
                    hasCycling = true;
                }
            });
            if (hasCycling) {
                a.push(writeFile(data));
            }
        });
        return Promise.all(a);
    }, function(err) {
        console.error(err);
    })
    .then(function() {
        console.error("complete");
    }, function(err) {
        console.error(err);
    });