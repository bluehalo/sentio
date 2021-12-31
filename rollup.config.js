const
	path = require('path'),
	pkg = require('./package.json');

export default {
	input: path.posix.resolve('src/index.js'),
	external: [
		'd3-axis',
		'd3-brush',
		'd3-dispatch',
		'd3-interpolate',
		'd3-scale',
		'd3-scale-chromatic',
		'd3-shape',
		'd3-delaunay'
	],
	output: {
		banner: `/* @license ${pkg.name} - ${pkg.version} - ${pkg.copyright} + */`,
		file: path.posix.join('./dist', `${pkg.artifactName}.js`),
		format: 'umd',
		globals: {
			'd3': 'd3',
			'd3-axis': 'd3',
			'd3-brush': 'd3',
			'd3-dispatch': 'd3',
			'd3-interpolate': 'd3',
			'd3-scale': 'd3',
			'd3-scale-chromatic': 'd3',
			'd3-shape': 'd3',
			'd3-delaunay': 'd3'
		},
		name: pkg.moduleName,
		sourcemap: true
	}
};
