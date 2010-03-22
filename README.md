Introduction
============

This is a data collector for lexigraph. It just uses functions exposed by the
public API, so there's really nothing special here. That said, it does have a
few compelling features:

* Batched updates -- all updates are batched so that updates happen at most once
  every ten seconds. This is much more efficient than sending dozens of
  non-batched updates that each update just a single dataset.

* Efficient -- all code here is implemented using node.js, and all processing
  happens in process (by reading various things out of /proc). This means that
  there's no additional overhead to e.g. invoke external processes to find out
  CPU usage.

* Asynchronous -- all code is run as part of a single asynchronous event loop,
  which means that there's no way that any module can block any of the other
  modules from running. Since this asyncrhonicity all happens within a single
  process, the CPU/memory overhead of threaded solutions is absent.

* Extensible -- all of the collector code is implemented using a plugin system,
  so it's easy to modify the plugins or add your own.

I've made an attempt to make the plugins somewhat modular, so you should be able
to pull out just the stuff that interacts with /proc if you want to use it for
your own purposes. Also, this code is probably easier to decipher than reading
the C code for procps.

Everything here is released under a two-clause BSD license (see the LICENSE
file). Enjoy.
