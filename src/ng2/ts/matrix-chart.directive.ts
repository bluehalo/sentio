import {Directive, ElementRef, HostListener, Input, OnChanges, SimpleChange} from "@angular/core";
import {BaseChartDirective} from "./base-chart.directive";

declare var sentio: Object;

@Directive({
	selector: "matrix-chart"
})
export class MatrixChartDirective
	extends BaseChartDirective
	implements OnChanges {

	@Input() model: Object[];

	@Input() resizeHeight: boolean;
	@Input() resizeWidth: boolean;
	@Input() duration: number;

	@Input("configure") configureFn: (chart: any) => void;

	constructor(el: ElementRef) {
		super(el, sentio.chart.matrix());
	}

	/**
	 * For the matrix chart, we scale height and width independently
	 */
	setChartDimensions(width: number, height: number, force: boolean = false): void {
		let redraw: boolean = false;

		if ((force || this.resizeWidth) && null != this.chart.width) {
			if(null != width && this.chart.width() !== width) {
				this.chart.width(width);
				redraw = true;
			}
		}

		if ((force || this.resizeHeight) && null != this.chart.height) {
			if(null != height && this.chart.height() !== height) {
				this.chart.height(height);
				redraw = true;
			}
		}

		if (redraw) {
			this.chart.resize().redraw();
		}
	}

	@HostListener("window:resize", ["$event"])
	onResize(event) {
		if (this.resizeHeight || this.resizeWidth) {
			this.delayResize();
		}
	}

	ngOnInit() {
		// Do the initial resize if either dimension is supposed to resize
		if (this.resizeHeight || this.resizeWidth) {
			this.resize();
		}
	}

	ngOnChanges(changes: { [key: string]: SimpleChange }) {
		let redraw : boolean = false;

		// Call the configure function
		if (changes["configureFn"] && changes["configureFn"].isFirstChange()
				&& null != changes["configureFn"].currentValue) {
			this.configureFn(this.chart);
			redraw = true;
		}

		if (changes["model"]) {
			this.chart.data(changes["model"].currentValue);
			redraw = true;
		}
		if (changes["duration"]) {
			this.chart.duration(changes["duration"].currentValue);
		}

		// Only redraw once if possible
		if (redraw) {
			this.chart.redraw();
		}
	}
}
