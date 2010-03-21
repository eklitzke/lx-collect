var fs = require("fs");

var last = {update: 0, value: {}};

var POLL_WAIT = 1000; // wait for 1 second
var MIN_POLL_FREQUENCY = 2 * 1000; // two seconds

function parseCPULine(line) {
    parts = line.split(/\s+/);
    var result = {};
    result["name"] = parts[0];
    result["user"] = parseInt(parts[1]);
    result["nice"] = parseInt(parts[2]);
    result["system"] = parseInt(parts[3]);
    result["idle"] = parseInt(parts[4]);
    result["iowait"] = parseInt(parts[5]);
    result["irq"] = parseInt(parts[6]);
    result["softirq"] = parseInt(parts[7]);
    if (parts[8])
        result["steal"] = parseInt(parts[8]);
    return result;
}

function CPUDifference(lhs, rhs) {
    var k;
    var jiffies = 0;
    var diff = {};
    if (lhs.name != rhs.name)
        throw "cannot compare cpu '" + lhs.name + "' to cpu '" + rhs.name + "'";
    for (k in rhs) {
        if (rhs.hasOwnProperty(k) && k != "name") {
            diff[k] = rhs[k] - lhs[k];
            jiffies += diff[k];
        }
    }
    if (jiffies == 0)
        throw "jiffies = 0";
    for (k in diff) {
        if (diff.hasOwnProperty(k))
            diff[k] = 100 * diff[k] / jiffies;
    }
    return diff;
}

// Invokes callback (possibly after a short delay) with an object like:
//  { cpu: 
//     { user: 49.5
//     , nice: 0
//     , system: 2
//     , idle: 48
//     , iowait: 0
//     , irq: 0.5
//     , softirq: 0
//     , steal: 0
//     }
//  , cpu0: 
//     { user: 2.0408163265306123
//     , nice: 0
//     , system: 0
//     , idle: 97.95918367346938
//     , iowait: 0
//     , irq: 0
//     , softirq: 0
//     , steal: 0
//     }
//  , cpu1: 
//     { user: 96.96969696969697
//     , nice: 0
//     , system: 3.0303030303030303
//     , idle: 0
//     , iowait: 0
//     , irq: 0
//     , softirq: 0
//     , steal: 0
//     }
//  }
function getCPU(callback) {
    fs.readFile("/proc/stat", function (err, data) {
        if (err)
            throw err;
        data = data.split("\n");
        var k;
        var now = new Date().valueOf();
        var value = {};
        var i = 0;
        for (i = 0; i < data.length; i++) {
            var line = data[i];
            if (line.match(/^cpu/)) {
                var r = parseCPULine(line);
                value[r.name] = r;
            }
        };
        var time_diff = now - last.update;
        if (time_diff < 100 || time_diff > MIN_POLL_FREQUENCY) {
            last.update = now;
            last.value = value;
            setTimeout(function () {
                getCPU(callback)
            }, POLL_WAIT);
        } else {
            var diffs = {};
            for (k in value) {
                if (value.hasOwnProperty(k)) {
                    diffs[k] = CPUDifference(last.value[k], value[k]);
                }
            }
            last.update = now;
            last.value = value;
            callback(diffs);
        }
    });
}

exports.worker = function (config, schedule) {
    if (!config.cpu)
        return null;
    var c = config.cpu;

    return (function () {
        getCPU(function (data) {
            data = data.cpu; // XXX: hack until multi-cpu support is available
            if (c.user)
                schedule(c.user, data.user);
            if (c.nice)
                schedule(c.nice, data.nice);
            if (c.system)
                schedule(c.system, data.system);
            if (c.idle)
                schedule(c.idle, data.idle);
            if (c.iowait)
                schedule(c.iowait, data.iowait);
            if (c.irq)
                schedule(c.irq, data.irq);
            if (c.softirq)
                schedule(c.softirq, data.softirq);
            if (c.steal)
                schedule(c.steal, data.steal);
        });
    });
}
