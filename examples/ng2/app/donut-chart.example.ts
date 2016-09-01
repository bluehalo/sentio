import {Component, OnInit} from "@angular/core";
import {DonutChartDirective} from "../../../src/ng2/ts/donut-chart.directive";
import * as d3 from "d3";

@Component({
	selector: "donut-chart-example",
	template: `
		<donut-chart
			style="width:200px;"
			[model]="model"
			[colorScale]="colorScale"
			[configure]="configure">
		</donut-chart>
		<button (click)="updateModel()">Update Data</button>
	`,
	directives: [ DonutChartDirective ]
})

export class DonutChartExample
	implements OnInit {

	model: Object[] = [];
	colorScale: any = d3.scale.ordinal()
		.range(["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c"]);

	ngOnInit() {
		this.updateModel();
	}

	configure = (chart: any) => {
		chart.label(function(d) {
			return d.key + "(" + d.value + ")";
		});
	}

	updateModel() {
		this.model = this.generateData(4);
	}

	private generateData(samples: number): Object[] {
		let toReturn: Object[] = [];
		for(let i: number = 0; i < samples; i++){
			toReturn.push({
				key: "key:" + i,
				value: Math.floor(Math.random() * samples)
			});
		}
		return toReturn;
	}
}
