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

#### Metadata

The fields in a dataset's metadata—stored in its `metadata` field—provide the
information necessary for the WebFM viewer to properly render the enclosed
data. All fields of the metadata are optional; however, for certain kinds of
data, certain combinations of omitted metadata may make it so that WebFM does
not have sufficient information to render the data properly.

Metadata may also exist in standalone files (usually named `.metadata`) for
use, *e.g.*, with the `_import` field described below. For example, bundles
may have a unified `.metadata` file `_import`ed by all of the bundle members,
to prevent duplication of large chunks of common metadata. As another example,
WebFM stores a `.metadata` file for each subject, which contains the
subject-specific metadata necessary to do online mapping (`brainImage`,
`sensorGeometry`, *etc.*).

The following are the (presently) meaningful metadata fields:

| Field | Example | Details |
| --- | --- | --- |
| `_import` | `"./.metadata"` | A string (or array of strings) specifying files to import and incorporate as additional metadata. If an array, files will be loaded in the specified order. The server performs these imports when the dataset is requested by a client; as such, this field is never present in the final dataset object served to the client. |
| `_export` | `{"brainImage": "./PYXXNXXX-Brain.png", "sensorGeometry": "./PYXXNXXX-Sensors.csv"}` | The `_export` field is used to denote operations that should be performed by the export utility to produce a final dataset—for example, base64-encoding an image, or converting a spreadsheet to a *u*-*v* map. This field should not be present in a fully formed dataset. |
| `subject` | `"PYXXNXXX"` | The identifier of the subject from whom this data
originated |
| `brainImage` | `"data:image/.png;base64,iVBORw0KG..."` | A string containing the base64-encoded binary image data to be used when displaying the data spatially |
| `sensorGeometry` | `{"CH1": {"u": 0.1, "v": 0.4}, ...}` | A mapping from channel names to *u*-*v* coordinates for placing electrodes on the `brainImage` |
| `montage ` | `["CH01", "CH02", "CH03", ...]` | A list of channel names, specifying both *which* channels should be displayed and, when relevant, *in what order*. |
| `setting` | `{"task": "PictureNaming", "stimulusType": "animals"}` | An object providing details on the context in which the data were collected |
| `kind` | `"event related potential"` | A human-readable description of what kind of data is in this dataset |
| `labels` | `["timeseries", "potential", "bipolar"]` | An array of strings
providing information about how the data should be displayed or interpreted |

#### Contents

...

| Field | Example | Details |
| --- | --- | --- |
| `values` | `{"CH01": [0.0, 0.01, ...], ...}` | Raw values to be plotted as-is; it is implied that no statistical computations should be performed |
| `stats` | ... | Statistical  |

...

### Bundle

...


## License

...


[node]: https://nodejs.org/