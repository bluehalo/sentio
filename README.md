# @asymmetrik/sentio

[![Build Status][travis-image]][travis-url]

> Sentio JS
> Provides a JavaScript library for visualizing and analyzing data.
> Sentio leverages several existing technologies, including [D3.js](http://d3js.org).
> Now supports D3 v5


## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)


## Install 
Install the package and its peer dependencies via npm:
```
npm install d3 @asymmetrik/sentio
```

To build from source:
```
git clone git@github.com:Asymmetrik/sentio.git
cd sentio
npm install
npm run build
```

The artifacts will be located in the ./dist dir.

## Usage
Sentio is built for consumption using module systems or through global import.
 
To import Sentio into the global ```sentio``` variable:
```
<link rel="stylesheet" href="./node_modules/dist/sentio.css" />
<script src="./node_modules/d3/dist/d3.js" charset="utf-8"></script>
<script src="./node_modules/dist/sentio.js" charset="utf-8"></script>
```

Otherwise, you can directly import the components of the library if you're using Typescript or ES6 modules.


## API
Sentio mimics d3's style of using closures to create resources and having shared getter/setter methods.

The general usage pattern is to create the chart and do some initial configuration:
```
var timeline = sentio.chartTimeline()
	.width(500)
	.height(100);
```

Then, you attach the chart to an element on the page,
bind data and/or provide series configuration,
and call the ```redraw()``` method to draw the chart:
```
var timelineDiv = d3.select('#chart');
timeline.init(timelineDiv)
	.data(...)
	.series(...)
	.redraw();
```

For specific components, refer to the documentation in the source files.

### Chart Types
* `chartTimeline` - Static timeline. Allows multiple configurable series, and optional brushing.
* `chartRealtimeTimeline` - Realtime timeline. Same as the regular timeline, but it will automatically scroll the timeline at a realtime rate.
* `chartAutoBrushTimeline` - Specialized brush timeline that updates its extent automatically in response to changes to the brush.
* `chartDonut` - Donut chart. Allows custom color schemes and data series.
* `chartMatrix` - Visualize two dimensional data using a matrix heatmap.
* `chartVerticalBars` - Stacked bar chart that animates changes to the width of the bars as well as the order of the bars. 

## Helpers/Utilities
* `modelBins` - Bin data into configurable bins. 
* `controllerRealtimeBins` - Manage a bin model for use with the realtime timeline. 
* `modelExtent` - Configurable manager of the extent of a data series.
* `modelMultiExtent` - Aggregate multiple data series with one extent.
* `controllerResponsiveUnits` - Generate timeline axis units that match the extent of the timeline. 
* `timelineBrush` - Helper for managing a brush on a timeline.

## Contribute
PRs accepted. If you are part of Asymmetrik, please make contributions on feature branches off of the ```develop``` branch. If you are outside of Asymmetrik, please fork our repo to make contributions.


## License
See LICENSE in repository for details.


[travis-url]: https://travis-ci.org/Asymmetrik/sentio/
[travis-image]: https://travis-ci.org/Asymmetrik/sentio.svg

