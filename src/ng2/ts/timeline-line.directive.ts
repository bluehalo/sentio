import {Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, SimpleChange, Output} from "@angular/core";
import {BaseChartDirective} from "./base-chart.directive";

declare var sentio: any;

@Directive({
	selector: "timeline-line"
})
export class TimelineLineDirective
	extends BaseChartDirective
	implements OnChanges {

	@Input() model: Object[];
	@Input() markers: Object[];
	@Input() yExtent: Object[];
	@Input() xExtent: Object[];

	@Input() resizeWidth: boolean;
	@Input() resizeHeight: boolean;
	@Input() duration: number;

	@Input("configure") configureFn: (chart: any) => void;

	@Input() filterEnabled: boolean;
	@Input("filter") filterState: Object[];
	@Output() filterChange: EventEmitter<Object[]> = new EventEmitter<Object[]>();

	@Output() markerOver: EventEmitter<Object> = new EventEmitter<Object>();
	@Output() markerOut: EventEmitter<Object> = new EventEmitter<Object>();
	@Output() markerClick: EventEmitter<Object> = new EventEmitter<Object>();

	constructor(el: ElementRef) {
		super(el, sentio.timeline.line());
	}

	/**
	 * For the timeline, both dimensions scale independently
	 */
	setChartDimensions(width: number, height: number, force: boolean = false): void {
		let redraw: boolean = false;

		if((force || this.resizeWidth) && null != this.chart.width) {
			if(null != width && this.chart.width() != width) {
				this.chart.width(width);
				redraw = true;
			}
		}

		if((force || this.resizeHeight) && null != this.chart.height) {
			if(null != height && this.chart.height() != height) {
				this.chart.height(height);
				redraw = true;
			}
		}

		if(redraw) {
			this.chart.resize().redraw();
		}
	}

	/**
	 * Did the state of the filter change?
	 */
	didFilterChange = (current: Object[], previous: Object[]) => {

		// Deep compare the filter
		if(current === previous ||
			(null != current && null != previous
			&& current.length === previous.length
			&& current[0] === previous[0]
			&& current[1] === previous[1]
			&& current[2] === previous[2])) {
			return false;
		}

		// We know it changed
		return true;
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

		// register for the filter end event
		this.chart.dispatch().on("filterend", (fs) => {

			// We are externally representing the filter as undefined or a two element array
			// So, convert the filter state to the two value format
			if (null == fs || (fs.length > 0 && fs[0])) {
				fs = undefined;
			}
			else if (fs.length > 2) {
				fs = fs.slice(1,3);
			}
			else if(fs.length !== 2) {
				fs = undefined;
			}

			// If the filter actually changed, emit the event
			if(this.didFilterChange(fs, this.filterState)) {
				setTimeout(() => { this.filterChange.emit(fs); });
			}
		});

		// register for the marker events
		this.chart.dispatch().on("markerMouseover", p => { this.markerClick.emit(p); });
		this.chart.dispatch().on("markerMouseout", p => { this.markerOver.emit(p); });
		this.chart.dispatch().on("markerClick", p => { this.markerOut.emit(p); });

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
		if (changes["yExtent"]) {
			this.chart.yExtent().overrideValue(changes["yExtent"].currentValue);
			redraw = true;
		}
		if (changes["xExtent"]) {
			this.chart.xExtent().overrideValue(changes["xExtent"].currentValue);
			redraw = true;
		}
		if (changes["duration"]) {
			this.chart.duration(changes["duration"].currentValue);
		}

		if (changes["filterEnabled"]) {
			this.chart.filter(changes["filterEnabled"].currentValue);
			redraw = true;
		}
		if (changes["filterState"]) {

			// Only do anything if the filter is changing
			if(changes["filterState"].isFirstChange()
				|| this.didFilterChange(changes["filterState"].currentValue, changes["filterState"].previousValue)) {
				this.chart.setFilter(changes["filterState"].currentValue);
				redraw = true;
			}

		}

		if (changes["markers"]) {
			this.chart.markers(changes["markers"].currentValue);
			redraw = true;
		}

		if(redraw) {
			this.chart.redraw();
		}
	}

}
