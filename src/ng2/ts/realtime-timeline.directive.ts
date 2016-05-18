import {Directive, ElementRef, EventEmitter, Input, OnChanges, SimpleChange, AfterContentInit} from '@angular/core';
import * as d3 from 'd3';

declare function sentio_realtime_timeline();

@Directive({ selector: 'realtime-timeline' })
export class RealtimeTimeline implements AfterContentInit, OnChanges {

	private timeline;
	private timelineElement;
	private resizeWidth;
	private resizeHeight;
	private resizeTimer;
	private isInitialized: boolean = false;

	@Input() configureFn;
	@Input() delay;
	@Input() fps;
	@Input() interval;
	@Input() markerHover;
	@Input() markerLabel;
	@Input() markers;
	@Input() model;
	@Input() sentioResizeWidth;
	@Input() sentioResizeHeight;
	@Input() yExtent;
	@Input() xExtent;

	constructor(el: ElementRef) {
		this.timelineElement = d3.select(el.nativeElement);
	}
	ngAfterContentInit() {
		if (null != this.configureFn) {
			this.configureFn(this.timeline);
			this.timeline.redraw();
		}
	}
	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		if (!this.isInitialized) {
			this._init();
		}

		if (changes['fps']) {
			this.timeline.fps(changes['fps'].currentValue).redraw();
		}
		if (changes['delay']) {
			this.timeline.delay(changes['delay'].currentValue).redraw();
		}
		if (changes['model']) {
			this.timeline.data(changes['model'].currentValue).redraw();
		}
		if (changes['markers']) {
			this.timeline.markers(changes['markers'].currentValue).redraw();
		}
		if (changes['interval']) {
			this.timeline.interval(changes['interval'].currentValue).redraw();
		}
		if (changes['yExtent']) {
			this.timeline.yExtent().overrideValue(changes['yExtent'].currentValue);
			this.timeline.redraw();
		}
		if (changes['xExtent']) {
			this.timeline.xExtent().overrideValue(changes['xExtent'].currentValue);
			this.timeline.redraw();
		}
	}
	_init() {
		this.timeline = sentio_realtime_timeline();
		this.resizeWidth = (null != this.sentioResizeWidth);
		this.resizeHeight = (null != this.sentioResizeHeight);

		// Extract the height and width of the chart
		var width = this.timelineElement[0][0].style.width;
		if (null != width && '' !== width) {
			width = parseFloat(width.substring(0, width.length - 2));
			if (null != width && !isNaN(width)) { this.timeline.width(width); }
		}
		var height = this.timelineElement[0][0].style.height;
		if (null != height && '' !== height) {
			height = parseFloat(height.substring(0, height.length - 2));
			if (null != height && !isNaN(height)) { this.timeline.height(height); }
		}

		// setup the marker callback method if one was provided
		if (null != this.markerHover) {
			this.timeline.markerHover(this.markerHover);
		}

		//EventEmitterService.get('addMarker').subscribe(data => this.addMarker());
		//EventEmitterService.get('doStart').subscribe(data => this.doStart());
		//EventEmitterService.get('doStop').subscribe(data => this.doStop());
		//EventEmitterService.get('onResize').subscribe(event => this.onResize(event));

		this.timeline.init(this.timelineElement).data([]).start();
		//EventEmitterService.get(this.eventChannel || 'timelineInit').emit('done');
	}
	// Add a marker
	addMarker() {
		var now = Date.now();
		this.markers.push([now, this.markerLabel]);
		this.timeline.markers(this.markers).redraw();
		this.markerLabel = '';
	}
	// Start and stop the timeline
	doStart() {
		this.timeline.start();
	}
	doStop() {
		this.timeline.stop();
	}
	delayResize() {
		if (undefined !== this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}
		this.resizeTimer = setTimeout(() => this.doResize(), 200);
	}
	onResize(event) {
		if (this.resizeWidth || this.resizeHeight) {
			this.delayResize();
		}
	}
	doResize() {
		// Get the raw body element
		var body = document.body;

		// Cache the old overflow style
		var overflow = body.style.overflow;
		body.style.overflow = 'hidden';

		// The first element child of our selector should be the <div> we injected
		var rawElement = this.timelineElement[0][0].firstElementChild;
		// Derive height/width of the parent (there are several ways to do this depending on the parent)
		var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;
		var parentHeight = rawElement.attributes.height | rawElement.style.height | rawElement.clientHeight;

		// Calculate the new width/height based on the parent and the resize size
		var width = (this.resizeWidth) ? parentWidth - this.sentioResizeWidth : undefined;
		var height = (this.resizeHeight) ? parentHeight - this.sentioResizeHeight : undefined;

		// Reapply the old overflow setting
		body.style.overflow = overflow;

		console.debug('resize rt.timeline height: ' + height + ' width: ' + width);

		// Apply the new width and height
		if (this.resizeWidth) { this.timeline.width(width); }
		if (this.resizeHeight) { this.timeline.height(height); }

		this.timeline.resize().redraw();
	}
}
