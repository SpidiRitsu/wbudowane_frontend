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

	feedback: boolean[] = [false, false, false];
	feedback_time: number = 5000;

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
  					console.log(`DESTROYED CHART: ${key}`)
  				}
  				else if (key == 'relays') {
  					for (let i=0; i<this.charts[key].length; i++) {
  						this.charts[key][i].chart.destroy()
  						console.log(`DESTROYED CHART: ${key} with id ${i}`)
  					}
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
				},
				relays: [
					{
						chart: null,
						labels: [],
						data: []		
					},
					{
						chart: null,
						labels: [],
						data: []		
					},
					{
						chart: null,
						labels: [],
						data: []		
					},
				],
				pir: {
					chart: null,
					labels: [],
					data: []
				},
			}
  		if (this.socket)
  			this.socket.disconnect();
  		this.socket = io('http://localhost:5000', {query: "id=" + this.id});
  		console.log('ROOM ID: ' + this.id);
  		this.drawCharts();
  		console.log('SETTING RELAYS TO 0 onInit')
  		this.changeSwitchState(0, false)
  		this.changeSwitchState(1, false)
  		this.changeSwitchState(2, false)
  	})
  }

  ngAfterViewInit() {
  	this.route.params.subscribe(params => {
	  	this.socket.on("get_data", data => {
	  		console.log(data)
	  		let tables = {
	  			"T": this.charts.temperature,
	  			"H": this.charts.humidity,
	  			"L": this.charts.luminosity,
	  			"R": this.charts.relays,
	  			"P": this.charts.pir
	  		}
	  		for (data of data.data) {
	  			if (data.id == this.id) {
		  			if (data.name == 'R') {
		  				for (let i=0; i<tables[data.name].length; i++) {
		  					if (data.labels[i].length && data.data[i].length) {
		  						// Buttons
		  						this.changeSwitchState(i, data.data[i][data.data[i].length - 1]);
		  						// Chart
			  					tables[data.name][i].labels = tables[data.name][i].labels.slice(data.labels[i].length)
			  					tables[data.name][i].labels.push(...data.labels[i]);
			  					tables[data.name][i].data = tables[data.name][i].data.slice(data.data[i].length)
			  					tables[data.name][i].data.push(...data.data[i]);
			  					tables[data.name][i].chart.data.datasets[0].data = tables[data.name][i].data;
			  					tables[data.name][i].chart.data.labels = tables[data.name][i].labels;
			  					tables[data.name][i].chart.update();				
		  					}
		  				}
		  			}
		  			else {
		  				if (data.labels && data.data) {
			  				tables[data.name].labels = tables[data.name].labels.slice(data.labels.length)
				  			tables[data.name].labels.push(...data.labels);
		  					tables[data.name].data = tables[data.name].data.slice(data.data.length)
			  				tables[data.name].data.push(...data.data);
			  				tables[data.name].chart.data.datasets[0].data = tables[data.name].data; 				
				  			tables[data.name].chart.data.labels = tables[data.name].labels;
				  			tables[data.name].chart.update();				
		  				}
		  			}
	  			}
	  		}
	  	});

	  	this.socket.on("relay_feedback", data => {
	  		if (data.id == this.id && this.feedback[data.relay]) {
	  			console.log('relay_feedback')
	  			let checkbox = document.querySelector("#checkbox" + data.relay);
	  			let slider = document.querySelector("#slider" + data.relay);

	  			console.log(data);

	  			this.changeSwitchState(data.relay);
	  		}
	  	});
	  });
  }

  changeSwitchState(id: number, state: boolean = null): void {
  	console.log(`CHANGE_SWITCH: ${id} ${state}`)
  	let checkbox = document.querySelector("#checkbox" + id) as HTMLInputElement;
		let slider = document.querySelector("#slider" + id) as HTMLInputElement;

		if (state !== null) {
			checkbox.checked = state;
		}
		else if (state === undefined) {
			console.log('kek?')
			checkbox.checked = false;
		}


		if (checkbox.checked) {
			if (!slider.classList.contains('slider-checked')) {
				slider.classList.add('slider-checked');
			}
		}
		else {
			if (slider.classList.contains('slider-checked')) {
				slider.classList.remove('slider-checked');
			}
		}
  }

  toggleRelay(relay: number): void {
  	console.log(`Toggling relay: ${relay}`)
  	let checkbox = document.querySelector('#checkbox' + relay) as HTMLInputElement;
  	let slider = document.querySelector("#slider" + relay) as HTMLInputElement;
  	let message = {
  		"id": this.id,
  		"message": `${relay}${+!checkbox.checked}`
  	};
  	this.socket.emit('relay', message);

  	let promise = new Promise((resolve, reject) => {
			this.feedback[relay] = true;
  		setTimeout(() => {
				this.feedback[relay] = false;
				console.log('Feedback time lapsed!')
				if ((checkbox.checked && !slider.classList.contains('slider-checked')) ||
					(!checkbox.checked && slider.classList.contains('slider-checked'))) {
					checkbox.checked = !checkbox.checked
				}
  		}, this.feedback_time)
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
			}
		});
		this.charts.humidity.chart = new Chart(document.getElementById("c2"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Wilgotność",
					borderColor: "#2aa4ea",
					backgroundColor: "#2aa4ea",
					fill: false
				}]
			}
		});
		this.charts.luminosity.chart = new Chart(document.getElementById("c3"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Natężenie światła",
					borderColor: "#fffc4c",
					backgroundColor: "#fffc4c",
					fill: false
				}]
			}
		});
		this.charts.pir.chart = new Chart(document.getElementById("c4"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Detekcja ruchu",
					borderColor: "#23ff82",
					backgroundColor: "#23ff82",
					fill: false,
					steppedLine: "middle"
				}]
			},
			options:{ 
	    scales: {
	      yAxes: [{
	        ticks: {
	          stepSize: 1
	        }
	      }]
	    }
	  }
		});
		this.charts.relays[0].chart = new Chart(document.getElementById("c5"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Stan przełącznika 1",
					borderColor: "#41b8f4",
					backgroundColor: "#41b8f4",
					fill: false,
					steppedLine: "middle"
				}]
			},
			options:{ 
	    scales: {
	      yAxes: [{
	        ticks: {
	          stepSize: 1
	        }
	      }]
	    }
	  }
		});
		this.charts.relays[1].chart = new Chart(document.getElementById("c6"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Stan przełącznika 2",
					borderColor: "#417df4",
					backgroundColor: "#417df4",
					fill: false,
					steppedLine: "middle"
				}]
			},
			options:{ 
	    scales: {
	      yAxes: [{
	        ticks: {
	          stepSize: 1
	        }
	      }]
	    }
	  }
		});
		this.charts.relays[2].chart = new Chart(document.getElementById("c7"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Stan przełącznika 3",
					borderColor: "#4f41f4",
					backgroundColor: "#4f41f4",
					fill: false,
					steppedLine: "middle"
				}]
			},
			options:{ 
	    scales: {
	      yAxes: [{
	        ticks: {
	          stepSize: 1
	        }
	      }]
	    }
	  }
		});
	}
}
