var fs = require("fs");
var sys = require("sys");
var api = require("api");

var path = process.argv[process.argv.length - 1];
if (!path.match(/\.json$/)) {
    process.stdio.writeError("invalid (or missing) config file");
    process.exit(1);
}

var data = fs.readFileSync(path);
var i;
var config = eval(data) || [];
for (i = 0; i < config.length; i++) {
    var c = config[i];
    api.registerModule(c, "lx_load");
    api.registerModule(c, "lx_cpu");
    api.registerModule(c, "lx_memory");
}
api.setSchedule(api.uploadAll, 10000);
