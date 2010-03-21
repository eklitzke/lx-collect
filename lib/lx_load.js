var fs = require("fs");

// get the cpu count; only need to do this once
var cpuCount = (function () {
    var data = fs.readFileSync("/proc/cpuinfo");
    var lines = data.split("\n");
    var count = 0;
    var i;
    for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^processor\s+: \d+$/))
            count++;
    }
    return count;
})();

// Invokes callback with an object like
//  { load1: 0.03
//  , load5: 0.09
//  , load15: 0.08
//  , running: 1
//  , total: 304
//  }
function getLoad(callback) {
    fs.readFile("/proc/loadavg", function (err, data) {
        if (err)
            throw err;
        data = data.split(/\s+/);
        var result = {};
        result.load1 = parseFloat(data[0]);
        result.load5 = parseFloat(data[1]);
        result.load15 = parseFloat(data[2]);
        var procs = data[3].split("/");
        result.running = parseInt(procs[0]);
        result.total = parseInt(procs[1]);
        callback(result);
    });
}

exports.worker = function (config, schedule) {
    if (!config.load)
        return null;
    var c = config.load;

    return (function () {
        getLoad(function (data) {
            if (c.load1)
                schedule(c.load1, data.load1)
            if (c.load5)
                schedule(c.load5, data.load5)
            if (c.load15)
                schedule(c.load5, data.load15)
            if (c.cpu_count)
                schedule(c.cpu_count, cpuCount);
        });
    });
}
