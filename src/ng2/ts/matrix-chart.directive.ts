import {Directive, ElementRef, EventEmitter, Input, OnChanges, SimpleChange, AfterContentInit} from '@angular/core';
import * as d3 from 'd3';

declare function sentio_chart_matrix();

@Directive({ selector: 'matrix-chart' })
export class MatrixChart implements AfterContentInit, OnChanges {

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

	constructor(el: ElementRef) {
		this.chartElement = d3.select(el.nativeElement);
	}
	ngAfterContentInit() {

	}
	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		if (!this.isInitialized) {
			this._init();
			this.isInitialized = true;
		}

		if (null != this.configureFn) {
			this.configureFn(this.chart);
		}

		if (changes['model']) {
			this.chart.data(changes['model'].currentValue).redraw();
		}
	}
	_init() {
		this.chart = sentio_chart_matrix();
		// Extract the width of the chart
		var width = this.chartElement[0][0].style.width;
		if (null != width && '' !== width) {
			width = parseFloat(width.substring(0, width.length - 2));
			if (null != width && !isNaN(width)) {
				this.chart.width(width);
				// set height to match width in this case to keep the donut round
				this.chart.height(width);
			}
		}

		this.chart.init(this.chartElement);
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
		var rawElement = this.chartElement[0][0].firstElementChild;
		// Derive width of the parent (there are several ways to do this depending on the parent)
		var parentWidth = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;

		// Calculate the new width based on the parent and the resize size
		var width = (this.resizeWidth) ? parentWidth - this.sentioResizeWidth : undefined;

		// Set height to match width to keep donut round
		var height = width;

		// Reapply the old overflow setting
		body.style.overflow = overflow;

		// Get the old widths and heights
		var oldHeight = this.chart.height();
		var oldWidth = this.chart.width();

		if (height !== oldHeight || width !== oldWidth) {
			console.debug('resize donut.chart width: ' + width);
			console.debug('resize donut.chart height: ' + height);

			// Apply the new height
			if (this.sentioResizeHeight) { this.chart.height(height); }
			// Apply the new width
			if (this.sentioResizeWidth) { this.chart.width(width); }
			this.chart.resize();
			this.chart.redraw();
		}
		else {
			console.debug('resize donut.chart width unchanged: ' + width);
			console.debug('resize donut.chart height unchanged: ' + height);
		}
	}
}
