import {Directive, ElementRef, HostListener, Input, OnChanges, SimpleChange} from '@angular/core';
import {BaseChartDirective} from './base-chart.directive';

declare var sentio: Object;

@Directive({
	selector: 'vertical-bar-chart'
})
export class VerticalBarChartDirective
	extends BaseChartDirective
	implements OnChanges {

	@Input() model : Object[];
	@Input() widthExtent: Object[];

	@Input('resize') resizeChart: boolean;
	@Input() duration: number;

	@Input('configure') configureFn: (chart: any) => void;

	constructor(el: ElementRef) {
		super(el, sentio.chart.verticalBars())
	}

	/**
	 * For The vertical bar chart, we just resize width
     */
	setChartDimensions(width: number, height: number): void {
		if(null != this.chart.width) {
			if(null != width && this.chart.width() != width) {
				this.chart.width(width).resize().redraw();
			}
		}
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		if (this.resizeChart) {
			this.delayResize();
		}
	}

	ngOnInit() {
		// Call the configure function
		if (null != this.configureFn) {
			this.configureFn(this.chart);
		}

		if (this.resizeChart) {
			this.resize();
		}
	}

	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		let redraw: boolean = false;

		if (changes['model']) {
			this.chart.data(changes['model'].currentValue);
			redraw = true;
		}

		if (changes['widthExtent']) {
			this.chart.widthExtent().overrideValue(changes['widthExtent'].currentValue);
			redraw = true;
		}

		if(redraw) {
			this.chart.redraw();
		}
	}

};
