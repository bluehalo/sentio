import {Component, OnInit} from "@angular/core";
import {VerticalBarChartDirective} from "../../../src/ng2/ts/vertical-bar-chart.directive";

@Component({
	selector: "vertical-bar-chart-example",
	template: `
		<vertical-bar-chart
		    style="width:200px;"
			[model]="model"
			[widthExtent]="[0,undefined]"
			[configure]="configure">
		</vertical-bar-chart>
		<button (click)="updateData()">Update Data</button>
	`,
    directives: [ VerticalBarChartDirective ]
})

export class VerticalBarChartExample
    implements OnInit {

    model: Object[] = [];

    ngOnInit() {
        this.updateData();
    }

    configure = (chart: any) => {
        chart.label(function(d) {
            return d.key + "&lrm; (" + d.value + ")";
        });
    }

    updateData() {
        let data: Object[] = this.generateData(16);

        data = data.sort(function(a: Object, b: Object) {
            return 0;
        }).slice(0, 12);

        this.model = data;
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
