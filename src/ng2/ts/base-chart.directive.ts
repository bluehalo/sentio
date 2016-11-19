import {ElementRef} from "@angular/core";
import * as d3 from "d3";

export abstract class BaseChartDirective {
	chart: any;
	chartElement: any;
	resizeTimer: number;

	constructor(el: ElementRef, chart) {
		this.chartElement = d3.select(el.nativeElement);
		this.chart = chart;

		this.chart.init(this.chartElement);

		// Extract the dimensions of the chart
		let width: number = this.getPixelDimension(this.chartElement[0][0].style.width);
		let height: number = this.getPixelDimension(this.chartElement[0][0].style.height);
		this.setChartDimensions(width, height, true);
	}

	/**
	 * Set the chart dimensions according to the implementation
	 * behavior, the configuration, and the parameters.
	 *
	 * @param width Width to which to optionally resize in pixels
	 * @param height Height to which to optionally resize in pixels
	 * @param force Should the resize ignore the resize configuration? (optional, should default to false)
	 */
	abstract setChartDimensions(width: number, height: number, force?: boolean): void;

	/**
	 * Determines the numerical dimension given a string representation
	 * Assumes the string is in the form "NNNNN"px"", more specifically
	 * an arbitrarily long sequence of digits terminated by "px"
	 *
	 * @param dimStr A string representation of the pixel size
	 * @returns {number} the numerical representation of the pixel size
	 */
	getPixelDimension(dimStr: string): number {
		let dim: number;

		if (null != dimStr && "" !== dimStr) {
			dim = parseFloat(dimStr.substring(0, dimStr.length - 2));
			if (null == dim || isNaN(dim)) {
				dim = undefined;
			}
		}

		return dim;
	}

	/**
	 * Resize the component
	 */
	resize() {
		// Get the raw body element
		let body = document.body;

		// Cache the old overflow style
		let overflow: string = body.style.overflow;
		body.style.overflow = "hidden";

		// The first element child of our selector should be the <div> we injected
		let rawElement = this.chartElement[0][0].firstElementChild;

		// Derive size of the parent (there are several ways to do this depending on the parent)
		let width: number = rawElement.attributes.width | rawElement.style.width | rawElement.clientWidth;
		let height: number = rawElement.attributes.height | rawElement.style.height | rawElement.clientHeight;

		// Reapply the old overflow setting
		body.style.overflow = overflow;

		this.setChartDimensions(width, height, false);
	}

	/**
	 * Manage a delayed resize of the component
	 */
	delayResize() {
		if (null != this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}
		this.resizeTimer = setTimeout(() => this.resize(), 200);
	}
}