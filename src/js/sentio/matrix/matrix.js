var sentio = {}; // TODO: implement preferred namespacing/structure 
sentio.matrix = function(){
	"use strict";

    var _config;
	var _counter = 0;
	var _dayMs = 60000*60*24;
	var _data = {};
    var _settings = {
        color :		["#a60000", "#e7e7e7", "#008500"],
        margin :	{ top: 50, right: 50, bottom: 10, left: 225 },
        boxDim :	16,
        boxMargin :	1,
        highlight :	2,
        duration: 500,

        // TODO: messing around with tooltip because it wasn't showing up well... styling prob?
        generateTooltip: function(series, element) {
            return "<div class='s-tooltip-title'>"
                + "<div>" + series.label + "</div>"
                + "<div>" + element[0] + "</div>"
                + "<div>" + element[1] + "</div>"
                + "</div>";
        },
        tooltipWidth: 160,
        tooltipHeight: 80
    };

	var _instance = function (selection) {};

    _instance.data = function(d) {
        if(!arguments.length) {
            return _data;
        }
        _data = d || {};
        return _instance;
    };

	_instance.init = function(d3Container) {
        d3Container.attr("class", "sentio matrix");

        // Add the svg element
        var svg = d3Container.append("svg");
        var gXAxis2 = svg.append("g").attr("class", "context axis").attr("transform", "translate(" + (_settings.margin.left) + "," + (_settings.margin.top - 20) + ")");
        var gXAxis1 = svg.append("g").attr("class", "x axis").attr("transform", "translate(" + (_settings.margin.left) + "," + (_settings.margin.top - _settings.boxMargin) + ")");

        // Define the x axis components
        var xScale = d3.time.scale.utc();
        var xAxis1 = d3.svg.axis().scale(xScale).orient("top").outerTickSize(0).ticks(d3.time.monday.utc, 1);
        var xAxis2 = d3.svg.axis().scale(xScale).orient("top").innerTickSize(-(20)).outerTickSize(0).ticks(d3.time.month.utc, 1);

        // Define the y axis
        var yScale = d3.scale.ordinal();

        // Define the color scale
        var color = d3.scale.linear().domain([-1, 0, 1]).range(_settings.color);

        var tooltip = _helpers.initTooltip(_settings.tooltipWidth, _settings.tooltipHeight);

        _config = {
            d3Container : d3Container,
            svg: svg,
            scale : { x: xScale, y: yScale, color: color },
            axis : { x1: xAxis1, x2: xAxis2 },
            g: { x1: gXAxis1, x2: gXAxis2 },
            tooltip: tooltip
        }

        return _instance;
    };

    _instance.draw = function() {
        // Bail out if anything is missing
        if(undefined === _data || undefined === _data.xExtent || _data.xExtent.length !== 2 || undefined === _data.data){
            return;
        }

        // Work out the extent of the chart
        var keys = _data.data.map(function(d){ return d.key; });
        var start = { date: new Date(_data.xExtent[0]), epoch: _data.xExtent[0] };
        var end = { date: new Date(_data.xExtent[1]), epoch: _data.xExtent[1] };

        // Calculate some convenience date range properties
        var days = (end.epoch - start.epoch)/_dayMs;
        var multiYear = (end.date.getUTCFullYear() - start.date.getUTCFullYear()) !== 0;
        var multiMonth = multiYear || (end.date.getUTCMonth() - start.date.getUTCMonth()) !== 0;

        // Dimensions of the visualization
        var boxDim = _settings.boxDim;
        var boxMargin = _settings.boxMargin;
        var span = _settings.boxMargin + _settings.boxDim;

        // calculate the width/height of the svg
        var margin = _settings.margin;
        var width = days*span + boxMargin,
            height = keys.length*span + boxMargin;

        _config.d3Container
            .style("width", (width + margin.left + margin.right) + "px")
            .style("height", (height + margin.top + margin.bottom) + "px");

        // scale the svg to the right size
        _config.svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Add the data to the xScale and xAxes
        _config.scale.x.domain([start.date, end.date]).range([0, days*span]);
        _config.g.x1.call(_config.axis.x1);
        _config.g.x2.call(_config.axis.x2);

        /**
         * Chart Manipulation
         */
        // Row Join and Update using the series name as the join function
        var row = _config.svg.selectAll("g.row").data(_data.data, function(d){ return d.key; });
        row.transition().duration(_settings.duration*2)
            .attr("transform", function(d, i){
                return "translate(" + margin.left + "," + (margin.top + (span*i)) + ")";
            });

        // Row Enter - when a row enters, we append a g element as row
        var rowEnter = row.enter().append("g");
        rowEnter
            .attr("class", "row")
            .attr("transform", function(d, i){ return "translate(" + margin.left + "," + (margin.top + (span*i)) + ")"; });

        // Also must append the label of the row
        rowEnter.append("text")
            .attr("class", "series label")
            .style("text-anchor", "end")
            .attr("x", -6)
            .attr("y", boxMargin + (boxDim/2))
            .attr("dy", ".32em")
            .text(function(d){ return d.label; });

        // Also must append a line
        rowEnter.append("line")
            .attr("class", "series tick")
            .attr("x1", -3)
            .attr("x2", 0)
            .attr("y1", boxMargin + (boxDim/2))
            .attr("y2", boxMargin + (boxDim/2));

        // Row Exit
        row.exit()
            .transition().duration(_settings.duration)
            .remove();

        // Cell Join and Update on Row Enter
        var rowEnterCell = rowEnter.selectAll("rect.cell").data(function(d){ return d.values; }, function(d) { return d[0]; });
        rowEnterCell.enter().append("rect")
            .attr("class", "cell")
            .style("fill", function(d) {
                return _config.scale.color(d[1]);
            })
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin)
            .attr("height", boxDim)
            .attr("width", boxDim)
            .on('mouseover', _helpers.mouseover)
			.on('mouseout', _helpers.mouseout);

        // Create the highlight rectangles for this row
        var rowEnterHighlight = rowEnter.selectAll("rect.highlight").data(function(d){ return d.highlights; }, function(d) { return d[0]; });
        rowEnterHighlight.enter().append("rect")
            .attr("class", "highlight")
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin + boxDim - _settings.highlight)
            .attr("width", function(d, i){ return _config.scale.x(d[1]) - _config.scale.x(d[0]) + boxDim; })
            .attr("height", _settings.highlight);


        // Cell Join and Update on Row Update
        var rowUpdateCell = row.selectAll("rect.cell").data(function(d){ return d.values; }, function(d) { return d[0]; });
        // Update
        rowUpdateCell
            .transition().duration(_settings.duration)
            .style("fill", function(d) {
                return _config.scale.color(d[1]);
            })
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin);
        // Enter
        rowUpdateCell.enter().append("rect")
            .attr("class", "cell")
            .style("fill", function(d) {
                return _config.scale.color(d[1]);
            })
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin)
            .attr("height", boxDim)
            .attr("width", boxDim)
            .style("opacity", 0.1)
            .on("mouseover", _helpers.mouseover)
            .on("mouseout", _helpers.mouseout)
            .transition().duration(_settings.duration)
                .style("opacity", 1);
        // Exit
        rowUpdateCell.exit()
            .style("opacity", 1)
            .transition().duration(_settings.duration)
                .attr("width", 0)
                .style("opacity", 0.1)
                .remove();

        // Create the highlight rectangles for this row on row update
        var rowUpdateHighlight = row.selectAll("rect.highlight").data(function(d){ return d.highlights; }, function(d) { return d[0]; });
        // Update
        rowUpdateHighlight
            .transition().duration(_settings.duration)
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin + boxDim - _settings.highlight)
            .attr("width", function(d, i){ return _config.scale.x(d[1]) - _config.scale.x(d[0]) + boxDim; })
            .attr("height", _settings.highlight);
        // Enter
        rowUpdateHighlight.enter().append("rect")
            .attr("class", "highlight")
            .attr("x", function(d, i){ return _config.scale.x(d[0]) + boxMargin; })
            .attr("y", boxMargin + boxDim - _settings.highlight)
            .attr("width", 0)
            .attr("height", _settings.highlight)
            .transition().duration(_settings.duration)
                .attr("width", function(d, i){ return _config.scale.x(d[1]) - _config.scale.x(d[0]) + boxDim; });
        // Exit
        rowUpdateHighlight.exit()
            .transition().duration(_settings.duration)
                .attr("width", 0)
                .remove();

        return _instance;
    };

    _instance.boxDim = function(v) {
        if(!arguments.length) { return _settings.boxDim; }
        _settings.boxDim = v;
        return _instance;
    };

    _instance.boxMargin = function(v) {
        if(!arguments.length) { return _settings.boxMargin; }
        _settings.boxMargin = v;
        return _instance;
    };

    _instance.color = function(v) {
        if(!arguments.length) { return _settings.color; }
        _settings.color = v;
        return _instance;
    };

    _instance.duration = function(v) {
        if(!arguments.length) { return _settings.duration; }
        _settings.duration = v;
        return _instance;
    };

    // TODO: Is there any value in opening this up for alternate implementation? 
    _instance.generateTooltip = function(v) {
        if(!arguments.length) { return _settings.generateTooltip; }
        _settings.generateTooltip = v;
        return _instance;
    };

    _instance.highlight = function(v) {
        if(!arguments.length) { return _settings.highlight; }
        _settings.highlight = v;
        return _instance;
    };

    _instance.margin = function(v) {
        if(!arguments.length) { return _settings.margin; }
        _settings.margin = v;
        return _instance;
    };

    _instance.tooltipWidth = function(v) {
        if(!arguments.length) { return _settings.tooltipWidth; }
        _settings.tooltipWidth = v;
        return _instance;
    };

    _instance.tooltipHeight = function(v) {
        if(!arguments.length) { return _settings.tooltipHeight; }
        _settings.tooltipHeight = v;
        return _instance;
    };

	var _helpers = {
		mouseover : function(value, x, y){
		    var node = this;

			var tooltip = _config.tooltip;
			var event = d3.event;

			var gElement = node.parentElement;
			var series = d3.select(gElement).datum();
			var gCoords = d3.mouse(gElement);

			tooltip.style("visibility", "visible")
				.style("top", "" + (event.clientY - gCoords[1] - _settings.tooltipHeight - 2) + "px")
				.style("left", "" + (event.clientX - gCoords[0] + _config.scale.x(value[0]) + _settings.boxDim/2 - _settings.tooltipWidth/2) + "px");

			tooltip.select(".s-tooltip-content")
				.html(_settings.generateTooltip(series, value));

			d3.selectAll(".row text").classed("active", function(d, i){ return d.key == series.key; });

		},
		mouseout : function(value, x, y){
			var tooltip = _config.tooltip;

			tooltip.style("visibility", "hidden");
			d3.selectAll(".row text").classed("active", false);
		},
		initTooltip : function(width, height){
			var tooltip = d3.select("body").append("div")
				.attr("class", "sentio s-tooltip")
				.style("width", width + "px").style("height", height + "px").style("visibility", "hidden").style("overflow", "visible");

			tooltip.append("div").attr("class", "s-tooltip-shadow");
			tooltip.append("svg").attr("class", "s-tooltip-box")
				.style("width", width + "px").style("height", (height+7) + "px")
				.append("path")
					.attr("transform", "translate(" + (width/2) + "," + (height+11) + ")")
					.attr("d", "M0.5,-6.5l5,-5H" + (width/2-0.5) + "v-" + (height-1) + "H-" + (width/2-0.5) + "v" + (height-1) + "H-5Z");

			tooltip.append("div").attr("class", "s-tooltip-content");

			return tooltip;
		}
	};

	return _instance;
};