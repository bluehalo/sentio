import {Directive, ElementRef, HostListener, Input, OnChanges, SimpleChange} from "@angular/core";
import {BaseChartDirective} from "./base-chart.directive";

declare var sentio: Object;

@Directive({
	selector: "donut-chart"
})
export class DonutChartDirective
	extends BaseChartDirective
	implements OnChanges {

	@Input() model: Object[];
	@Input() colorScale: any;

	@Input("resize") resizeChart: boolean;
	@Input() duration: number;

	@Input("configure") configureFn: (chart: any) => void;

	constructor(el: ElementRef) {
		super(el, sentio.chart.donut());
	}

	/**
	 * For the donut chart, we pin the height to the width
	 * to keep the aspect ratio correct
	 */
	setChartDimensions(width: number, height: number, force: boolean = false): void {
		if ((force || this.resizeChart) && null != this.chart.width) {
			if (null != width && this.chart.width() !== width) {
				// pin the height to the width
				this.chart
					.width(width)
					.height(width)
					.resize().redraw();
			}
		}
	}

	@HostListener("window:resize", ["$event"])
	onResize(event) {
		if (this.resizeChart) {
			this.delayResize();
		}
	}

	ngOnInit() {
		if (this.resizeChart) {
			this.resize();
		}
	}

	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		let redraw: boolean = false;

		// Call the configure function
		if (changes["configureFn"] && changes["configureFn"].isFirstChange()
				&& null != changes["configureFn"].currentValue) {
			this.configureFn(this.chart);
		}

		if (changes["model"]) {
			this.chart.data(changes["model"].currentValue);
			redraw = true;
		}
		if (changes["duration"]) {
			this.chart.duration(changes["duration"].currentValue);
		}
		if (changes["colorScale"]) {
			this.chart.color(changes["colorScale"].currentValue);
			redraw = true;
		}

		// Only redraw once if possible
		if (redraw) {
			this.chart.redraw();
		}
	}

}
