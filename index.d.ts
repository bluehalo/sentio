declare namespace sentio {

	/*
	 * Charts
	 */
	namespace chart {

		export function donut(config?: any): any;
		export function matrix(config?: any): any;
		export function verticalBars(config?: any): any;

	}

	/*
	 * Controller package
	 */
	namespace controller {

		export function rtBins(config?: any): any;

	}

	/*
	 * Model package
	 */
	namespace model {

		export function bins(config?: any): any;

	}

	/*
	 * Realtime charts package
	 */
	namespace realtime {

		export function timeline(config?: any): any;

	}

	/*
	 * Timeline package
	 */
	namespace timeline {

		export function line(config?: any): any;

	}

	/*
	 * Util package
	 */
	namespace util {

		export function extent(config?: any): any;
		export function multiExtent(config?: any): any;

	}
}

export = sentio;
