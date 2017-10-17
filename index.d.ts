declare namespace sentio {

	interface Margin {
		top: number,
		right: number,
		bottom: number,
		left: number
	}

	interface Series {
		key: string | number;
		getValue: internal.UnionFn<any>;
		label? : string;
		category?: string;
	}

	type PointEvents = 'value' | 'values' | 'series' | null | false;

	namespace internal {

		type SimpleFn<T> = () => T;
		type ObjectFn<T> = (d: any) => T;
		type ObjectIndexFn<T> = (d: any, i: number) => T;
		type UnionFn<T> = SimpleFn<T> | ObjectFn<T> | ObjectIndexFn<T>;

		type BinSimpleFn<T> = (bin: any) => T;
		type BinObjectFn<T> = (bin: any, d: any) => T;
		type BinObjectIndexFn<T> = (bin: any, d: any, i: number) => T;
		type BinUnionFn<T> = BinSimpleFn<T> | BinObjectFn<T> | BinObjectIndexFn<T>;

		interface BaseChart {
			margin(): Margin;
			margin(v: Margin): this;

			data(): any[];
			data(v?: any[]): this;

			init(container: any): this;
			resize(): this;
			redraw(): this;
		}

		interface DurationChart {
			duration(): number;
			duration(v: number): this;
		}

		interface MultiSeriesChart {
			series(): Series[];
			series(v? : Series[]): this;
		}

		interface KeyValueChart {
			key(): UnionFn<string | number>;
			key(v: UnionFn<string | number>): this;

			value(): UnionFn<any>;
			value(v: UnionFn<any>): this;
		}
		interface LabelChart {
			label(): UnionFn<string>;
			label(v: UnionFn<string>): this;
		}

		interface WidthChart {
			width(): number;
			width(v: number): this;
		}
		interface HeightChart {
			height(): number;
			height(v: number): this;
		}

	}


	/*
	 * Charts
	 */

	export interface DonutChart
		extends internal.BaseChart, internal.DurationChart, internal.HeightChart,
			internal.LabelChart, internal.KeyValueChart, internal.WidthChart {

		innerRadiusRatio(): number;
		innerRadiusRatio(v: number): this;

		colorScale(): any;
		colorScale(v: any): this;

		dispatch(): any;

		legend(): DonutChartLegendConfig;
	}
	export interface DonutChartLegendConfig {
		enabled: boolean,
		markSize: number,
		markMargin: number,
		labelOffset: number,
		position: string,
		layout: string
	}
	export function chartDonut(): DonutChart;


	export interface MatrixChart
		extends internal.BaseChart, internal.DurationChart, internal.MultiSeriesChart {

		cellSize(): number;
		cellSize(v: number): this;

		cellMargin(): number;
		cellMargin(v: number): this;

		colorScale(): any;
		colorScale(v: any): this;

		xScale(): any;
		xScale(v: any): this;

		yScale(): any;
		yScale(v: any): this;

		xExtent(): Extent;
		xExtent(v: Extent): this;

		valueExtent(): Extent;
		valueExtent(v: Extent): this;

		key(): internal.UnionFn<string | number>;
		key(v: internal.UnionFn<string | number>): this;

		dispatch(): any;
	}
	export function chartMatrix(): MatrixChart;


	export interface VerticalBarsChart
		extends internal.BaseChart, internal.DurationChart, internal.WidthChart,
			internal.KeyValueChart, internal.LabelChart, internal.DurationChart {

		barHeight(): number;
		barHeight(v: number): this;

		barPadding(): number;
		barPadding(v: number): this;

		widthExtent(): Extent;
		widthExtent(v: Extent): this;

		dispatch(): any;
	}
	export function chartVerticalBars(): VerticalBarsChart;


	export interface TimelineChart
		extends internal.BaseChart, internal.HeightChart, internal.MultiSeriesChart,
			internal.WidthChart {

		curve(): any;
		curve(v: any): this;

		pointEvents(): string;
		pointEvents(v: PointEvents): this;

		showGrid(): boolean;
		showGrid(v: boolean): this;

		showXGrid(): boolean;
		showXGrid(v: boolean): this;

		showYGrid(): boolean;
		showYGrid(v: boolean): this;

		xGridAxis(): any;
		xGridAxis(v: any): this;

		yGridAxis(): any;
		yGridAxis(v: any): this;

		xAxis(): any;
		xAxis(v: any): this;

		yAxis(): any;
		yAxis(v: any): this;

		xScale(): any;
		xScale(v: any): this;

		yScale(): any;
		yScale(v: any): this;

		xValue(): any;
		xValue(v: any): this;

		xExtent(): Extent;
		xExtent(v: Extent): this;

		yExtent(): Extent;
		yExtent(v: Extent): this;

		markers(): any[];
		markers(v: any[]): this;

		markerXValue(): internal.UnionFn<number>;
		markerXValue(v: internal.UnionFn<number>): this;

		markerLabel(): internal.UnionFn<string | number>;
		markerLabel(v: internal.UnionFn<string | number>): this;

		brush(): boolean;
		brush(v: boolean): this;

		setBrush(v?: [number, number] | null): this;
		getBrush(): [number, number] | null;

		dispatch(): any;
	}
	export function chartTimeline(): TimelineChart;


	export interface RealtimeTimelineChart extends TimelineChart {
		start(): void;
		stop(): void;
		restart(): void;

		interval(): number;
		interval(v: number): this;

		delay(): number;
		delay(v: number): this;

		fps(): number;
		fps(v: number): this;
	}
	export function chartRealtimeTimeline(): RealtimeTimelineChart;


	export interface AutoBrushTimelineChart extends TimelineChart {
		edgeTrigger(): number;
		edgeTrigger(v: number): this;

		zoomInTrigger(): number;
		zoomInTrigger(v: number): this;

		zoomOutTrigger(): number;
		zoomOutTrigger(v: number): this;

		zoomTarget(): number;
		zoomTarget(v: number): this;

		maxExtent(): [ number, number ];
		maxExtent(v: [ number, number ]): this;

		minExtent(): number;
		minExtent(v: number): this;

		minBrush(): number;
		minBrush(v: number): this;

		timelineDispatch(): any;
	}
	export function chartAutoBrushTimeline(): AutoBrushTimelineChart;


	/*
	 * Controllers
	 */

	export interface RealtimeBinsController {
		model(): BinsModel;
		bins(): any[];
		start(): this;
		stop(): this;
		running(): boolean;
		add(v: any): this;
		clear(): this;

		binsize(): number;
		binSize(v: number): this;

		binCount(): number;
		binCount(v: number): this;
	}
	export interface RealtimeBinsControllerConfig {
		delay?: number,
		binSize: number,
		binCount: number
	}
	export function controllerRealtimeBins(config?: RealtimeBinsControllerConfig): RealtimeBinsController;

	export interface TimelineBrush {
		scale(): any;
		scale(v: any): this;

		brush(): any;

		enabled(): boolean;
		enabled(v: boolean): this;

		getSelection(node: any): any;
		setSelection(group: any, v: any): void;
	}
	export interface TimelineBrushConfig {
		scale: any;
		brush: any;
	}
	export function timelineBrush(config: TimelineBrushConfig): TimelineBrush;

	export interface ResponsiveUnit {
		key: string;
		value: number
	}
	export interface ResponsiveUnitsController {
		units(): ResponsiveUnit[];
		units(v: ResponsiveUnit[]): this;

		getUnit(v: [ number, number ]): ResponsiveUnit;

		currentUnit(): ResponsiveUnit;
		currentUnit(v: ResponsiveUnit): this;
	}
	export interface ResponsiveUnitsControllerConfig {
		minTrigger?: number;
		maxTrigger?: number;
	}
	export function controllerResponsiveUnits(config?: ResponsiveUnitsControllerConfig): ResponsiveUnitsController;


	/*
	 * Models
	 */

	export interface BinsModel {
		set(data: any[]): this;
		clear(): this;
		add(v: any): this;
		lwm(v: number): this;
		hwm(v: number): this;

		getKey(): internal.UnionFn<string | number>;
		getKey(v: internal.UnionFn<string | number>): this;

		getValue(): internal.UnionFn<any>;
		getValue(v: internal.UnionFn<any>): this;

		updateBin(): internal.BinUnionFn<void>;
		updateBin(v: internal.BinUnionFn<void>): this;

		createSeed(): () => any;
		createSeed(v: () => any): this;

		countBin(): (bin: any) => number;
		countBin(v: (bin: any) => number): this;

		afterAdd(): (bins: any[], currentcount: number, previousCount: number) => void;
		afterAdd(v: (bins: any[], currentcount: number, previousCount: number) => void): this;

		afterUpdate(): (bins: any[], currentcount: number, previousCount: number) => void;
		afterUpdate(v: (bins: any[], currentcount: number, previousCount: number) => void): this;

		size(): number;
		size(v: number): this;

		count(): number;
		count(v: number): this;

		bins(): any[];

		itemCount(): number;

		clearBin(i: number): number;
	}
	export interface BinsModelConfig {
		count: number,
		size: number,
		lwm: number,

		createSeed?: () => any,
		getKey?: internal.UnionFn<string | number>,
		getValue?: internal.UnionFn<any>,
		updateBin?: internal.BinUnionFn<void>,
		countBin?: (bin: any) => number,
		afterAdd?: (bins: any[], currentcount: number, previousCount: number) => void,
		afterUpdate?: (bins: any[], currentcount: number, previousCount: number) => void
	}
	export function modelBins(config?: BinsModelConfig): BinsModel;

	/**
	 * Extent utility. Adds convenience for things like default values, clamping,
	 * and dynamic element filtering.
	 *
	 * @param config
	 */
	export interface Extent {

		/**
		 * Get the default value
		 */
		defaultValue(): [ number, number ];

		/**
		 * Set the default value, which is used when an extent cannot be derived from the data
		 */
		defaultValue(v: [ number, number ]): this;

		/**
		 * Get the override value
		 */
		overrideValue(): [ number, number ];

		/**
		 * Set the override value, which is applied on top of the derived extent.
		 *     'undefined' for either value in the tuple means that element won't be overridden
		 *     If override is [0, 5], the extent will always be [0, 5]
		 *     If override is [undefined, 5], and the extent is [1, 10] the extent will be [1, 5]
		 *     Default override is [undefined, undefined], which means don't override either value
		 */
		overrideValue(v: [ number, number ]): this;

		/**
		 * Get the 'getValue' accessor function
		 */
		getValue(): internal.UnionFn<number>;

		/**
		 * Set the 'setValue' accessor function, which is used to teach the extent utility how to
		 * get the value from the data array.
		 * @param v
		 */
		getValue(v: internal.UnionFn<number>): this;

		/**
		 * Get the 'filter' function
		 */
		filter(): internal.UnionFn<boolean>;

		/**
		 * Set the 'filter' function, which is used to omit elements from the data array when calculating
		 * the extent
		 */
		filter(v: internal.UnionFn<boolean>): this;

		/**
		 * Get the extent given the data array and the current configuration of the extent utility
		 * @param data
		 */
		getExtent(data: any[]): [ number, number ];

	}

	/**
	 * Extent Configuration object
	 */
	export class ExtentConfig {
		defaultValue?: [ number, number ];
		overrideValue?: [ number, number ];
		getValue?: internal.UnionFn<number>;
		filter?: internal.UnionFn<boolean>;
	}

	/**
	 * Factory method to create an {{Extent}}
	 * @param config
	 */
	export function modelExtent(config?: ExtentConfig): Extent;


	/**
	 * Multi-Extent Utility. This is a utility for deriving the extent of multiple data arrays at once
	 * The effective extent is the
	 */
	export interface MultiExtent {
		extent(): Extent;
		extent(v: Extent): this;

		series(): Series;
		series(v: Series): this;

		getExtent(data: any[]): [ number, number ];
	}
	export interface MultiExtentConfig {
		extent?: Extent;
		series?: Series;
	}
	export function modelMultiExtent(config?: MultiExtentConfig): MultiExtent;

}

export = sentio;
