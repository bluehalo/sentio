import {Component, OnInit} from "@angular/core";
import {TimelineLineDirective} from "../../../src/ng2/ts/timeline-line.directive";

@Component({
	selector: "timeline-line-example",
	template: `
		<timeline-line
			style="width:400px; height:100px;"
			[model]="model"
			[configure]="configure"
			[filterEnabled]="true"
			[(filter)]="filter"
			(filterChange)="eventHandler("filterChanged", $event)">
		</timeline-line>
		<div>Current filter: {{filter}}</div>
		<button (click)="updateData()">Update Data</button>
	`,
	directives: [ TimelineLineDirective ]
})
export class TimelineLineExample
	implements OnInit {

	chart: any;
	model: Object[] = [];

	filter: Object[] = null;
	interval: number = 60000;
	binSize: number = 1000;
	hwm: number = Date.now();

	ngOnInit() {
		this.updateData();
	}

	eventHandler = (msg: string, event: any) => {
		console.log({ msg: msg, event: event });
		console.log(this.filter);
	}

	updateData() {
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
