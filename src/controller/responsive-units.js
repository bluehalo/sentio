/**
 *
 */
export default function responsiveUnits(config) {

	/**
	 * Private variables
	 */

	// Configuration
	var _config = {
		minTrigger: 30,
		maxTrigger: 400
	};

	// var _fn = {};

	// The data (an array of object containers)
	var _units = [
		{ key: 'second', value: 1000 },
		{ key: 'minute', value: 60 * 1000 },
		{ key: 'hour', value: 60 * 60 * 1000 },
		{ key: 'day', value: 24 * 60 * 60 * 1000 },
		{ key: 'month', value: 30 * 24 * 60 * 60 * 1000 },
		{ key: 'year', value: 365 * 24 * 60 * 60 * 1000 }
	];
	var _currentUnit = _units[0];


	/**
	 * Private Functions
	 */

	function checkUnit(v, u) {
		var delta = v[1] - v[0];
		var points = delta / u.value;

		return (points >= _config.maxTrigger) ? 1 : (points <= _config.minTrigger) ? -1 : 0;
	}

	/*
	 * Constructor/initialization method
	 */
	function model(unitConfig) {
		if (null == unitConfig) { unitConfig = {}; }

		if (null != unitConfig.minTrigger) { _config.minTrigger = unitConfig.minTrigger; }
		if (null != unitConfig.maxTrigger) { _config.maxTrigger = unitConfig.maxTrigger; }
	}


	/**
	 * Public API
	 */

	model.getUnit = function(v) {

		// If we're good, just return the current unit
		var unit = _currentUnit;
		if (0 === checkUnit(v, unit)) {
			return _currentUnit;
		}

		// We weren't good, so find a new unit by searching smallest to largest
		var unitIndex = 0;

		// Loop while there's too many points
		while (unitIndex < _units.length && 0 < checkUnit(v, _units[unitIndex])) {
			unitIndex++;
		}

		_currentUnit = _units[Math.min(unitIndex, _units.length - 1)];

		return _currentUnit;

	};

	model.units = function(v) {
		if (!arguments.length) { return _units; }
		_units = v;
		return model;
	};

	model.currentUnit = function(v) {
		if (!arguments.length) { return _currentUnit; }
		_currentUnit = v;
		return model;
	};

	model.minTrigger = function(v) {
		if (!arguments.length) { return _config.minTrigger; }
		_config.minTrigger = v;
		return model;
	};

	model.maxTrigger = function(v) {
		if (!arguments.length) { return _config.maxTrigger; }
		_config.maxTrigger = v;
		return model;
	};

	// Initialize the model
	model(config);

	return model;
}
