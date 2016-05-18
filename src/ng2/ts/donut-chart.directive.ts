import {Directive, ElementRef, EventEmitter, Input, OnInit, OnChanges, SimpleChange} from '@angular/core';
import * as d3 from 'd3';

declare function sentio_chart_donut();

@Directive({ selector: 'donut-chart' })
export class DonutChart implements OnInit, OnChanges {

	private chart;
	private chartElement;
	private resizeWidth;
	private resizeHeight;
	private resizeTimer;

	@Input() configureFn;
	@Input() model;
	@Input() duration;
	@Input() colorScale;
	@Input() sentioResizeWidth;
	@Input() sentioResizeHeight;

	constructor(el: ElementRef) {
		this.chartElement = d3.select(el.nativeElement);
		this.chart = sentio_chart_donut();

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
	ngOnInit() {
		if (null != this.configureFn) {
			this.configureFn(this.chart);
		}

		//EventEmitterService.get('onResize').subscribe(event => this.onResize(event));
		//EventEmitterService.get(this.eventChannel || 'chartInit').emit('done');

		this.resizeWidth = (null != this.sentioResizeWidth);
		this.resizeHeight = (null != this.sentioResizeHeight);

		this.doResize();

	}
	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		let redraw : boolean = false;

		if (changes['model']) {
			this.chart.data(changes['model'].currentValue);
			redraw = true;
		}
		if (changes['duration']) {
			this.chart.duration(changes['duration'].currentValue);
		}
		if (changes['colorScale']) {
			this.chart.color(changes['colorScale'].currentValue);
			redraw = true;
		}

		// Only redraw once if possible
		if(redraw) {
			this.chart.redraw();
		}
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
			if (this.sentioResizeWidth) {
				this.chart.height(height);
				this.chart.width(width);
			}
			this.chart.resize().redraw();
		} else {
			console.debug('resize donut.chart width unchanged: ' + width);
			console.debug('resize donut.chart height unchanged: ' + height);
		}
	}
}
