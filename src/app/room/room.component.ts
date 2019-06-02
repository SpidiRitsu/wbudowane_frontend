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
	meteo = 'o';
	temperature: Sensor[];

	private socket: any;

	charts: any;

	relay_feedback: boolean[] = [false, false, false];
	rgb_feedback: boolean = false;
	rgb_onchange: boolean = true;
	feedback_time: number = 5000;

	rgb_old: any[];

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
				pressure: {
					chart: null,
					labels: [],
					data: []
				},
				uv: {
					chart: null,
					labels: [],
					data: []
				},
				air25: {
					chart: null,
					labels: [],
					data: []
				},
				air10: {
					chart: null,
					labels: [],
					data: []
				},
				sky: {
					chart: null,
					labels: [],
					data: []
				},
				rain: {
					chart: null,
					labels: [],
					data: []
				},
			}
  		if (this.socket)
  			this.socket.disconnect();
  		this.socket = io('http://localhost:5000', {query: "id=" + this.id});
  		console.log('ROOM ID: ' + this.id);
  	})
  }

  ngAfterViewInit() {
  	this.route.params.subscribe(params => {
			this.drawCharts();
			console.log('SETTING RELAYS TO 0 onInit')
			this.changeSwitchState(0, false)
			this.changeSwitchState(1, false)
			this.changeSwitchState(2, false)
			this.changeRGBState(0, 0, 0,)

	  	this.socket.on("get_data", data => {
	  		console.log(data)
	  		let tables = {
	  			"T": this.charts.temperature,
	  			"H": this.charts.humidity,
	  			"L": this.charts.luminosity,
	  			"R": this.charts.relays,
	  			"P": this.charts.pir,
	  			"K": this.charts.pressure,
	  			"U": this.charts.uv,
	  			"J": this.charts.air25,
	  			"F": this.charts.air10,
	  			"O": this.charts.sky,
	  			"I": this.charts.rain
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
		  			else if (data.name == 'S') {
		  				console.log(data.data)
		  				let last_row = data.data.slice(-1)[0]
		  				console.log(last_row)
							this.rgb_old = last_row;
							if (last_row)
		  					this.changeRGBState(last_row[0], last_row[1], last_row[2])
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

	  	let color_input = document.querySelector("#rgb-strip") as HTMLInputElement;
	  	if (color_input) {
				color_input.addEventListener('change', () => {
					if (this.rgb_onchange) {
						const hexToRgb = hex =>
						  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
						             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
						    .substring(1).match(/.{2}/g)
						    .map(x => parseInt(x, 16))
						console.log(color_input.value)
						let rgb = hexToRgb(color_input.value)
						console.log(rgb)
						let message = {
							'id': this.id,
							'message': `S${rgb[0]}R${rgb[1]}G${rgb[2]}B`
						}
						this.socket.emit('rgb', message)
						let promise = new Promise((resolve, reject) => {
							this.rgb_feedback = true;
							this.rgb_onchange = false;
							setTimeout(() => {
								this.rgb_feedback = false;
								console.log('RGB feedback time has lapsed!');
								console.log(this.rgb_onchange);
								if (!this.rgb_onchange) {
									console.log('NO RESPONSE FROM RGB RIP')
									console.log('RGB_OLD:')
									console.log(this.rgb_old)
									this.changeRGBState(this.rgb_old[0], this.rgb_old[1], this.rgb_old[2]);
								}
							}, this.feedback_time)
						});
					}
				});	
	  	}

			this.socket.on('rgb_feedback', data => {
				if (data.id == this.id && this.rgb_feedback) {
					console.log('rgb_feedback')
					console.log(data);

					this.changeRGBState(data.red, data.green, data.blue);
				}
			});

	  	this.socket.on("relay_feedback", data => {
	  		if (data.id == this.id && this.relay_feedback[data.relay]) {
	  			console.log('relay_feedback')
	  			console.log(data);

  				this.rgb_onchange = false;
	  			this.changeSwitchState(data.relay);
	  		}
	  	});
	  });
  }

  changeRGBState(red: number, green: number, blue: number) {
  	console.log(`CHANGE_RGB: ${red} ${green} ${blue}`)
  	let color_input = document.querySelector("#rgb-strip") as HTMLInputElement;
  	if (color_input) {
  		const hexToRgb = hex =>
			  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
			             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
			    .substring(1).match(/.{2}/g)
			    .map(x => parseInt(x, 16))
			const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
			  const hex = x.toString(16)
			  return hex.length === 1 ? '0' + hex : hex
			}).join('')

			let rgb = hexToRgb(color_input.value)
			if (rgb[0] != red || rgb[1] != green || rgb[2] != blue) {
				this.rgb_onchange = false;
  			console.log(`New strip value: ${rgbToHex(red, green, blue)}`)
  			color_input.value = rgbToHex(red, green, blue);
			}
  		this.rgb_onchange = true;
  	}

  }

  changeSwitchState(id: number, state: boolean = null): void {
  	console.log(`CHANGE_SWITCH: ${id} ${state}`)
  	let checkbox = document.querySelector("#checkbox" + id) as HTMLInputElement;
		let slider = document.querySelector("#slider" + id) as HTMLInputElement;

		if (checkbox && slider) {
			if (state !== null) {
				checkbox.checked = state;
			}
			else if (state === undefined) {
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
			this.relay_feedback[relay] = true;
  		setTimeout(() => {
				this.relay_feedback[relay] = false;
				console.log('Relay feedback time has lapsed!')
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
		this.charts.pressure.chart = new Chart(document.getElementById("c8"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Ciśnienie",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			}
		});
		this.charts.uv.chart = new Chart(document.getElementById("c9"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "UV",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			}
		});
		this.charts.air25.chart = new Chart(document.getElementById("c10"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Air 25",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			}
		});
		this.charts.air10.chart = new Chart(document.getElementById("c11"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Air 25",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			}
		});
		this.charts.sky.chart = new Chart(document.getElementById("c12"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Sky",
					borderColor: "#e50606",
					backgroundColor: "#e50606",
					fill: false
				}]			
			}
		});
		this.charts.rain.chart = new Chart(document.getElementById("c13"), {
			type: "line",
			data: {
				labels: [],
				datasets: [{
					data: [],
					label: "Deszcz",
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
