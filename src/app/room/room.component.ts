import { Component, OnInit, Input } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { Observable, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators'; 

import { RoomService } from '../room.service';
import { Sensor } from '../sensor';

import { Chart } from 'chart.js';

import io from "socket.io-client";

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})

export class RoomComponent implements OnInit {
	id: number;
	temperature: Sensor[];

	private socket: any;

	charts: any;

  constructor(
  	private route: ActivatedRoute,
  	private roomService: RoomService) { }

  ngOnInit() {
  	this.route.params.subscribe(params => {
  		this.id = params.id as number;
  		for (let key in this.charts) {
  			if (this.charts.hasOwnProperty(key)) {
  				if (this.charts[key].chart) {
  					this.charts[key].chart.destroy()
  					console.log('DESTROYED CHART: ' + key)
  				}
  			}
  		}
  		this.charts = {
				temperature: {
					chart: null,
					labels: [],
					data: []
				},
				humidity: {
					chart: null,
					labels: [],
					data: []
				},
				luminosity: {
					chart: null,
					labels: [],
					data: []
				}
			}
  		if (this.socket)
  			this.socket.disconnect();
  		this.socket = io('http://localhost:5000', {query: "id=" + this.id});
  		console.log('ROOM ID: ' + this.id);
  		this.drawCharts();
  	})
  }

  ngAfterViewInit() {
  	this.route.params.subscribe(params => {
	  	this.socket.on("get_data", data => {
	  		console.log(data)
	  		let tables = {
	  			"T": this.charts.temperature,
	  			"H": this.charts.humidity,
	  			"L": this.charts.luminosity
	  		}
	  		for (data of data.data) {
	  			if (data.id == this.id) {
		  			tables[data.name].labels.push(...data.labels);
		  			tables[data.name].data.push(...data.data);
		  			tables[data.name].chart.data.labels = tables[data.name].labels;
		  			tables[data.name].chart.data.datasets[0].data = tables[data.name].data;
		  			tables[data.name].chart.update();	  				
	  			}
	  		}
	  	});
	  });
  }

  drawCharts(): void {
		this.charts.temperature.chart = new Chart(document.getElementById("c1"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Temperatura",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			},
			options: {
				// title: {
				// 	display: true,
				// 	text: 'Pokój 1'
				// }
			}
		});
		this.charts.humidity.chart = new Chart(document.getElementById("c2"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					// data: [22, 50, 75, 80, 95, 100, 116, 105, 95, 79],
					data: [],
					label: "Wilgotność",
					borderColor: "#2aa4ea",
					backgroundColor: "#2aa4ea",
					fill: false
				}]
			},
			options: {
				// title: {
				// 	display: true,
				// 	text: "Natężenie światła"
				// }
			}
		});
		this.charts.luminosity.chart = new Chart(document.getElementById("c3"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					// data: [22, 50, 75, 80, 95, 100, 116, 105, 95, 79],
					data: [],
					label: "Natężenie światła",
					borderColor: "#fffc4c",
					backgroundColor: "#fffc4c",
					fill: false
				}]
			},
			options: {
				// title: {
				// 	display: true,
				// 	text: "Natężenie światła"
				// }
			}
		});
	}
}
