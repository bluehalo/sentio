/// <reference types="d3" />

declare namespace sentio {

	/*
	 * Charts
	 */
	namespace chart {

		import Extent = sentio.util.Extent;
		interface Margin {
			top: number,
			right: number,
			bottom: number,
			left: number
		}

		interface BaseChart {
			margin(): Margin;
			margin(v: Margin): this;

			data(): any[];
			data(v? : any[]): this;

			init(container: any): this;
			resize(): this;
			redraw(): this;
		}

		interface DurationChart {
			duration(): number;
			duration(v: number): this;
		}

		interface MultiSeriesChart {
			seriesKey(): (d: any) => string;
			seriesKey(v: (d: any) => string): this;

			seriesValues(): (d: any) => any[];
			seriesValues(v: (d: any) => any[]): this;

			seriesLabel(): (d: any) => string;
			seriesLabel(v: (d: any) => string): this;
		}

		interface KeyValueChart {
			key(): (v: any) => string;
			key(v: (v: any) => string): this;

			value(): (v: any) => number;
			value(v: (v: any) => number): this;
		}
		interface LabelChart {
			label(): (v: any) => string;
			label(v: (v: any) => string): this;
		}

		interface WidthChart {
			width(): number;
			width(v: number): this;
		}
		interface HeightChart {
			height(): number;
			height(v: number): this;
		}


		export interface DonutChart
			extends BaseChart, DurationChart, HeightChart, LabelChart, KeyValueChart, WidthChart {

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
		export function donut(): DonutChart;


		export interface MatrixChart
			extends BaseChart, DurationChart, KeyValueChart, MultiSeriesChart {

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

			xExtent(): util.Extent;
			xExtent(v: util.Extent): this;

			valueExtent(): util.Extent;
			valueExtent(v: util.Extent): this;

			dispatch(): any;
		}
		export function matrix(): MatrixChart;


		export interface VerticalBarsChart
			extends BaseChart, DurationChart, WidthChart, KeyValueChart, LabelChart, DurationChart {

			barHeight(): number;
			barHeight(v: number): this;

			barPadding(): number;
			barPadding(v: number): this;

			widthExtent(): util.Extent;
			widthExtent(v: util.Extent): this;

			dispatch(): any;
		}
		export function verticalBars(): VerticalBarsChart;


		export interface TimelineChart
			extends BaseChart, HeightChart, MultiSeriesChart, WidthChart {

			curve(): any;
			curve(v: any): this;

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

			yValue(): any;
			yValue(v: any): this;

			xExtent(): util.Extent;
			xExtent(v: util.Extent): this;

			yExtent(): util.Extent;
			yExtent(v: util.Extent): this;

			markers(): any[];
			markers(v: any[]): this;

			markerXValue(): (d: any, i?: number) => number;
			markerXValue(v: (d: any, i?: number) => number): this;

			markerLabel(): (d: any, i?: number) => string;
			markerLabel(v: (d: any, i?: number) => string): this;

			filter(): boolean;
			filter(v: boolean): this;

			setFilter(v?: [number, number]): this;
			getFilter(): [number, number] | null;

			dispatch(): any;
		}
		export function timeline(): TimelineChart;

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
		export function realtimeTimeline(): RealtimeTimelineChart;
	}

	/*
	 * Controller package
	 */
	namespace controller {

		export interface RealtimeBinsController {

			model(): model.BinsModel;
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
		export function realtimeBins(config?: RealtimeBinsControllerConfig): RealtimeBinsController;

	}

	/*
	 * Model package
	 */
	namespace model {

		export interface BinsModel {
			set(data: any[]): this;
			clear(): this;
			add(v: any): this;
			lwm(v: number): this;
			hwm(v: number): this;

			getKey(): (d: any, i?: number) => string;
			getKey(v: (d: any, i?: number) => string): this;

			getValue(): (d: any, i?: number) => any;
			getValue(v: (d: any, i?: number) => any): this;

			updateBin(): (bin: any, d?: any, i?: number) => void;
			updateBin(v: (bin: any, d?: any, i?: number) => void): this;

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
			getKey?: (d: any, i?: number) => any,
			getValue?: (d: any, i?: number) => any,
			updateBin?: (bin: any, d: any, i?: number) => any,
			countBin?: (bin: any) => any,
			afterAdd?: (bins: any[], currentcount: number, previousCount: number) => void,
			afterUpdate?: (bins: any[], currentcount: number, previousCount: number) => void
		}
		export function bins(config?: BinsModelConfig): BinsModel;

	}

	/*
	 * Util package
	 */
	namespace util {

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
			getValue(): (d: any, i?: number) => number;

			/**
			 * Set the 'setValue' accessor function, which is used to teach the extent utility how to
			 * get the value from the data array.
			 * @param v
			 */
			getValue(v: (d: any, i?: number) => number): this;

			/**
			 * Get the 'filter' function
			 */
			filter(): (d: any, i?: number) => boolean;

			/**
			 * Set the 'filter' function, which is used to omit elements from the data array when calculating
			 * the extent
			 */
			filter(v: (d: any, i?: number) => boolean): this;

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
			getValue?: (d: any, i?: number) => number;
			filter?: (d: any, i?: number) => boolean;
		}

		/**
		 * Factory method to create an {{Extent}}
		 * @param config
		 */
		export function extent(config?: ExtentConfig): Extent;


		/**
		 * Multi-Extent Utility. This is a utility for deriving the extent of multiple data arrays at once
		 * The effective extent is the
		 */
		export interface MultiExtent {
			extent(): Extent;
			extent(v: Extent): this;

			values(): (v: any) => any[];
			values(v: (v: any) => any[]): this;

			getExtent(data: any[]): [ number, number ];
		}
		export interface MultiExtentConfig {
			extent?: Extent;
		}
		export function multiExtent(config?: MultiExtentConfig): MultiExtent;



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

	}
}

export = sentio;
