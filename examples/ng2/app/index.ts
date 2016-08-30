import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

import {VerticalBarChartExample} from './vertical-bar-chart.example';
import {DonutChartExample} from './donut-chart.example';

@Component({
	selector: 'sentio-examples',
	template: `
		<vertical-bar-chart-example></vertical-bar-chart-example>
		<donut-chart-example></donut-chart-example>
	`,
	directives: [ DonutChartExample, VerticalBarChartExample ],
})

class SentioExamples { }

bootstrap(SentioExamples);
