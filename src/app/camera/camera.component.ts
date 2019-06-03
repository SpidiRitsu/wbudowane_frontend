import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

  ngAfterViewInit()  {
  	this.setCamera();

  }

  setCamera(): void {
  	let iframe = document.querySelector('#cameraFrame') as HTMLInputElement;
  	iframe.src = iframe.dataset['src']
  	console.log('Connecting to: ' + iframe.dataset['src'])
  }

}
