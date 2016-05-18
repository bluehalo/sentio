import {Directive, ElementRef, EventEmitter, Input, OnChanges, SimpleChange, AfterContentInit} from '@angular/core';
import * as d3 from 'd3';

declare function sentio_chart_vertical_bars();

@Directive({ selector: 'vertical-bar-chart' })
export class VerticalBarChart implements AfterContentInit ,OnChanges {
	private chart;
	private chartElement;
	private resizeWidth;
	private resizeHeight;
	private resizeTimer;
	private isInitialized: boolean = false;

	@Input() configureFn;
	@Input() model;
	@Input() sentioResizeWidth;
	@Input() sentioResizeHeight;
	@Input() widthExtent;

	constructor(el: ElementRef) {
		this.chartElement = d3.select(el.nativeElement);
	}
	ngAfterContentInit() {
		if (null != this.configureFn) {
			this.configureFn(this.chart);
		}
	}
	ngOnChanges(changes: { [key: string]: SimpleChange }) {
	  if (!this.isInitialized){
		  this._init();
		  this.isInitialized = true;
	  }

		if (changes['model']) {
			this.chart.data(changes['model'].currentValue).redraw();
		}
		if (changes['widthExtent']) {
			this.chart.widthExtent().overrideValue(changes['widthExtent'].currentValue);
		}
	}
	_init() {
		this.chart = sentio_chart_vertical_bars();
		this.resizeWidth = (null != this.sentioResizeWidth);
		this.resizeHeight = (null != this.sentioResizeHeight);

		// Extract the width of the chart
		var width = this.chartElement[0][0].style.width;
		if (null != width && '' !== width) {
			width = parseFloat(width.substring(0, width.length - 2));
			if (null != width && !isNaN(width)) { this.chart.width(width); }
		}

		//EventEmitterService.get('onResize').subscribe(event => this.onResize(event));
		this.chart.init(this.chartElement);
		//EventEmitterService.get(this.eventChannel || 'chartInit').emit('done');
	}
	doResize() {

		// Get the raw body element
		var body = document.body;

		// Cache the old overflow style
		var overflow = body.style.overflow;
		body.style.overflow = 'hidden';

		// The first element child of our selector should be the <div> we injected
		var rawElement = this.chartElement[0][0].firstElementChild;
		// Derive width of the parent (there are several ways to do this depending on the parent)
		var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;

		// Calculate the new width based on the parent and the resize size
		var width = (this.resizeWidth) ? parentWidth - this.sentioResizeWidth : undefined;

		// Reapply the old overflow setting
		body.style.overflow = overflow;

		console.debug('resize verticalBars.chart width: ' + width);

		// Apply the new width
		if (this.resizeWidth) { this.chart.width(width); }

		this.chart.resize();
		this.chart.redraw();
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

}
