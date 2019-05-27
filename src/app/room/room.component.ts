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
	// id: Observable<number>;
	id: number;
	temperature: Sensor[];

	private socket: any;

	test_id: number = 0;

	temperature_labels: string[] = [];
	temperature_data: number[] = [];

	humidity_labels: string[] = [];
	humidity_data: number[] = [];

	luminosity_labels: string[] = [];
	luminosity_data: number[] = [];

  constructor(
  	private route: ActivatedRoute,
  	private roomService: RoomService) { }

  ngOnInit() {
  	this.socket = io('http://localhost:5000')
  	this.getRoom();
  	this.getTemperature(this.id)
  	this.getHumidity(this.id)
  	this.getLuminosity(this.id)
  }

  public ngAfterViewInit() {
  	this.socket.on("get_data", data_new => {
  		console.log(data_new)
  		this.socket.emit('message', 'WORKING BITCHESSSSSSSSSS');
  		this.test_id = data_new.value;
  	});
  }

  getRoom(): void {
  	this.route.params.subscribe(params => {
  		this.id = params.id as number;
  	})
  }

  getTemperature(id: number): void {
  	this.roomService.getTemperature(id)
  		.subscribe(temp => {
  			this.temperature_labels = temp['date'];
  			this.temperature_data = temp['value'];
  			this.drawCharts();
  		});
  }

  getHumidity(id: number): void {
  	this.roomService.getHumidity(id)
  		.subscribe(temp => {
  			this.humidity_labels = temp['date'];
  			this.humidity_data = temp['value'];
  			this.drawCharts();
  		});
  }

  getLuminosity(id: number): void {
  	this.roomService.getTemperature(id)
  		.subscribe(temp => {
  			this.luminosity_labels = temp['date'];
  			this.luminosity_data = temp['value'];
  			this.drawCharts();
  		});
  }

  drawCharts(): void {
		new Chart(document.getElementById("c1"), {
			type: "line",
			data: {
				labels: this.temperature_labels,
				datasets: [{
					data: this.temperature_data,
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
		new Chart(document.getElementById("c2"), {
			type: "line",
			data: {
				labels: this.humidity_labels,
				datasets: [{
					// data: [22, 50, 75, 80, 95, 100, 116, 105, 95, 79],
					data: this.humidity_data,
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
		new Chart(document.getElementById("c3"), {
			type: "line",
			data: {
				labels: this.luminosity_labels,
				datasets: [{
					// data: [22, 50, 75, 80, 95, 100, 116, 105, 95, 79],
					data: this.luminosity_data,
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
