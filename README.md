# webfm

> A web-based functional mapping utility.

...

## Prerequisites

In order to run WebFM, you'll need:

1. A working [Node][node] installation
2. ( ... BCI2000 / BCI2000Web dependencies ... )

...

## Installation

Installing WebFM requires two steps:

1. Installing the Node dependencies *via* `npm` for the *server* and for the
   *client*
2. Building the client application scripts

### Node

Let `{webfm}` denote the path to the root of the WebFM repository. First, navigate to `{webfm}` and run

```
npm install
```

This will install the dependencies for the WebFM server.

For the client, navigate to `{webfm}/app` and once again run

```
npm install
```

### Build

To build the client application scripts, navigate to `{webfm}/app` and run

```
./build
```

To test that everything has installed properly, navigate to `{webfm}` and run

```
node webfm
```

You should see

```
Serving {webfm}/public on 54321:tcp
```

If you encounter issues starting the server on the default port, you can
specify a port that works with the `-p` option:

```
node webfm -p 8080
```

## Data formats

WebFM has two distinct ways of packaging data: **datasets**, which encapsulate
one viewable record—one spatial map, one event-related activity/connectivity
map, *etc.*—and **bundles**, which wrap together multiple related datasets
into a unified unit.

### Dataset

Datasets, which have the `.fm` file extension, 

Datasets contain two kinds of information: **metadata**, which are extra bits
of information that give the data needed (or useful) context; and
**contents**, which are the actual data points of interest.

#### metadata

...

| Key | Example | Details |
| --- | --- | --- |
| `_import` | `./.metadata` | A string (or array of strings) specifying files to import and use as additional metadata. If an array, files will be loaded in the specified order |
| `feature` | `event related potential` | Test. |


#### contents

...

### Bundle

...


## License

...


[node]: https://nodejs.org/