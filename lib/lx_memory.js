var fs = require("fs");

// Invokes callback with an object like:
//  { 'MemTotal': { value: 1982224, unit: 'kB' }
//  , 'MemFree': { value: 695896, unit: 'kB' }
//  , 'Buffers': { value: 42948, unit: 'kB' }
//  , 'Cached': { value: 568688, unit: 'kB' }
//  , 'SwapCached': { value: 0, unit: 'kB' }
//  , 'Active': { value: 801068, unit: 'kB' }
//  , 'Inactive': { value: 290044, unit: 'kB' }
//  , 'Active(anon)': { value: 640104, unit: 'kB' }
//  , 'Inactive(anon)': { value: 16, unit: 'kB' }
//  , 'Active(file)': { value: 160964, unit: 'kB' }
//  , 'Inactive(file)': { value: 290028, unit: 'kB' }
//  , 'Unevictable': { value: 0, unit: 'kB' }
//  , 'Mlocked': { value: 0, unit: 'kB' }
//  , 'SwapTotal': { value: 2931852, unit: 'kB' }
//  , 'SwapFree': { value: 2931852, unit: 'kB' }
//  , 'Dirty': { value: 216, unit: 'kB' }
//  , 'Writeback': { value: 0, unit: 'kB' }
//  , 'AnonPages': { value: 479608, unit: 'kB' }
//  , 'Mapped': { value: 129248, unit: 'kB' }
//  , 'Shmem': { value: 160644, unit: 'kB' }
//  , 'Slab': { value: 72464, unit: 'kB' }
//  , 'SReclaimable': { value: 44408, unit: 'kB' }
//  , 'SUnreclaim': { value: 28056, unit: 'kB' }
//  , 'KernelStack': { value: 2424, unit: 'kB' }
//  , 'PageTables': { value: 39068, unit: 'kB' }
//  , 'NFS_Unstable': { value: 0, unit: 'kB' }
//  , 'Bounce': { value: 0, unit: 'kB' }
//  , 'WritebackTmp': { value: 0, unit: 'kB' }
//  , 'CommitLimit': { value: 3922964, unit: 'kB' }
//  , 'Committed_AS': { value: 1702848, unit: 'kB' }
//  , 'VmallocTotal': { value: 34359738367, unit: 'kB' }
//  , 'VmallocUsed': { value: 371144, unit: 'kB' }
//  , 'VmallocChunk': { value: 34359287896, unit: 'kB' }
//  , 'HardwareCorrupted': { value: 0, unit: 'kB' }
//  , 'HugePages_Total': { value: 0 }
//  , 'HugePages_Free': { value: 0 }
//  , 'HugePages_Rsvd': { value: 0 }
//  , 'HugePages_Surp': { value: 0 }
//  , 'Hugepagesize': { value: 2048, unit: 'kB' }
//  , 'DirectMap4k': { value: 12288, unit: 'kB' }
//  , 'DirectMap2M': { value: 2013184, unit: 'kB' }
//  }
function getMemory(callback) {
    fs.readFile("/proc/meminfo", function (err, data) {
        if (err)
            throw err;
        var result = {};
        var lines = data.split("\n");
        var i;
        for (i = 0; i < lines.length; i++) {
            var line = lines[i];
            line = line.split(/\s+/);
            if (line.length < 2)
                continue;
            var name = line[0].replace(/:$/, '')
            var value = parseInt(line[1]);
            if (line.length >= 3) {
                var unit = line[2];
                if (unit == "kB") {
                    value = value / 1024;
                    result[name] = {'value': value};
                } else {
                    result[name] = {'value': value, 'unit': unit};
                }
            } else {
                result[name] = {'value': value}
            }
        }
        callback(result);
    });
}

exports.worker = function (config, schedule) {
    if (!config.memory)
        return null;
    var c = config.memory;

    return (function () {
        getMemory(function (data) {
            if (c.total)
                schedule(c.total, data.MemTotal.value);
            if (c.free)
                schedule(c.free, data.MemFree.value);
            if (c.buffers)
                schedule(c.buffers, data.Buffers.value);
            if (c.cached)
                schedule(c.cached, data.Cached.value);
            if (c.active)
                schedule(c.active, data.Active.value);
            if (c.inactive)
                schedule(c.inactive, data.Inactive.value);
            if (c.mapped)
                schedule(c.mapped, data.Mapped.value);
            if (c.shmem)
                schedule(c.shmem, data.Shmem.value);
            if (c.commit_limit)
                schedule(c.commit_limit, data.CommitLimit.value);
            if (c.commit_as)
                schedule(c.commit_as, data.Committed_AS.value);

            if (c.used)
                schedule(c.used, data.MemTotal.value - data.MemFree.value);
            if (c.resident)
                schedule(c.resident, data.MemTotal.value - data.MemFree.value - data.Buffers.value - data.Cached.value);
        });
    });
}
