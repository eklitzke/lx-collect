var sys = require("sys");
var http = require("http");

var QUEUES = {};

/* Get a value from the environment, falling back to a default */
exports.getEnv = getEnv =  function (name, value) {
    return (name in process.env ? process.env[name] : value);
}

var LX_HOST = getEnv("LX_HOST", "lexigraph.appspot.com");
var LX_PORT = parseInt(getEnv("LX_PORT", 80));

/**
 * Escape a string in the format specified by the
 * application/x-www-form-urlencoded MIME type.
 * @param str the string to form escape
 */
function formEscape(str) {
    str = new String(str);
    return escape(str.replace(/ /g, '+'));
}

/**
 * Encode a map for a POST request.
 * @param map the map to encode
 */
function formEncode(map) {
    var k;
    var msg = "";

    for (k in map) {
        if (map.hasOwnProperty(k)) {
            msg += '&' + formEscape(k) + '=' + formEscape(map[k]);
        }
    }
    return msg.slice(1);
}

/**
 * Actually upload data to the api
 */
exports.uploadAll = function () {
    var k;
    for (k in QUEUES) {
        if (QUEUES.hasOwnProperty(k) && QUEUES[k].length > 0) {
            q = QUEUES[k];
            var client = http.createClient(LX_PORT, LX_HOST);
            var i;
            var form = "key=" + k;
            for (i = 0; i < q.length; i++) {
                form += "&" + formEncode(q[i]);
            }
            var req = client.request("POST", "/api/new/datapoint",
                                     {"Content-Type": "application/x-www-form-urlencoded; charset=us-ascii",
                                      "Host": LX_HOST,
                                      "Content-Length": form.length,
                                      "Connection": "close",
                                      "User-Agent": "lexigraph-collector/0.1"});
            req.addListener("response", function (response) {
                response.addListener("complete", function () {
                    if (response.statusCode != 200) {
                        sys.debug("Got error response: " + response.statusCode);
                        sys.debug("Headers: " + sys.inspect(response.headers));
                    }
                });
            });
            req.write(form, encoding="ascii");
            req.close();
        }
    }
    // reset the global queue list
    QUEUES = {};
};

// schedule something to go into the queue
function scheduleData(key, dataset, value) {
    var timestamp = parseInt((new Date()).valueOf() / 1000); // unix time
    if (!(key in QUEUES))
        QUEUES[key] = [];
    QUEUES[key].push({"dataset": dataset, "value": value, "timestamp": timestamp});
}


// Schedule a functionto happen at a regular interval.
// XXX: explain how this is different from setInterval
exports.setSchedule = setSchedule = function(func, ival) {
    var f = function () {
        var ts = (new Date()).valueOf();
        func();
        var te = (new Date()).valueOf();
        var diff = te - ts;
        if (diff < ival)
            setTimeout(f, ival - diff);
        else
            process.nextTick(f);
    }
    f();
};

exports.registerModule = function (config, name) {

    var module = require(name);
    var worker = module.worker(config.datasets, function (dataset, value) {
        scheduleData(config.key, dataset, value)
    });
    if (worker === null)
        return;

    // pause 1.5 seconds before first scheduling the worker
    setTimeout(function() { setSchedule(worker, config.interval * 1000); }, 1500);
};
