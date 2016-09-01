import {Component} from "@angular/core";
import {bootstrap} from "@angular/platform-browser-dynamic";

import {DonutChartExample} from "./donut-chart.example";
import {RealtimeTimelineExample} from "./rt-timeline.example"
import {TimelineLineExample} from "./timeline-line.example"
import {VerticalBarChartExample} from "./vertical-bar-chart.example";
import {MatrixChartExample} from "./matrix-chart.example";

@Component({
	selector: "sentio-examples",
	template: `
		<vertical-bar-chart-example></vertical-bar-chart-example>
		<donut-chart-example></donut-chart-example>
		<timeline-line-example></timeline-line-example>
		<realtime-timeline-example></realtime-timeline-example>
		<matrix-chart-example></matrix-chart-example>
	`,
	directives: [ DonutChartExample, MatrixChartExample, RealtimeTimelineExample, TimelineLineExample, VerticalBarChartExample ],
})

class SentioExamples { }

bootstrap(SentioExamples);
