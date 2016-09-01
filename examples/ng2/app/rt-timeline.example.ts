import {Component, OnInit} from "@angular/core";
import {RealtimeTimelineDirective} from "../../../src/ng2/ts/realtime-timeline.directive";

@Component({
	selector: "realtime-timeline-example",
	template: `
		<realtime-timeline
			style="width:400px; height:100px;"
			[model]="model"
			[configure]="configure"
			(markerOver)="eventHandler('markerOver', $event)"
			(markerOut)="eventHandler('markerOut', $event)"
			(markerClick)="eventHandler('markerClick', $event)">
		</realtime-timeline>
		<button (click)="updateModel()">Update Data</button>
		<button (click)="play()">Play</button>
		<button (click)="pause()">Pause</button>
	`,
	directives: [ RealtimeTimelineDirective ]
})
export class RealtimeTimelineExample
	implements OnInit {

	chart: any;
	model: Object[] = [];

	filter: Object[] = null;
	interval: number = 60000;
	binSize: number = 1000;
	hwm: number = Date.now();

	ngOnInit() {
		this.updateModel();
	}

	configure = (chart: any) => {
		this.chart = chart;
	}

	eventHandler(msg: string, event: any) {
		console.log({ msg: msg, event: event});
	}

	play = () => { this.chart.start(); }
	pause = () => { this.chart.stop(); }

	updateModel() {
		this.hwm = Date.now();

		let newModel: Object[] = [{
			key:"series1",
			data: this.generateData(this.hwm, this.interval, this.binSize)
		}];

		this.model = newModel;
	}

	private generateData(start: number, interval: number, binSize: number): Object[] {
		let toReturn: Object[] = [];

		for(var i=0; i<interval/binSize; i++) {
			toReturn.push([start + i * binSize, Math.random() * 10]);
		}

		return toReturn;
	}
}
