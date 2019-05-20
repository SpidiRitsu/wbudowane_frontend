import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Sensor } from './sensor';


@Injectable({
  providedIn: 'root'
})
export class RoomService {

	private serverUrl = "api/";

  constructor(private http: HttpClient) { }

  // getTemperature(): Observable<Sensor[]> {
  // 	return this.http.get<Sensor[]>('api/get_temperature');
  // }

  getTemperature(id: number): Observable<any> {
  	return this.http.get<any>(`api/get_temperature?room=${id}`);
  }

  getHumidity(id: number): Observable<any> {
  	return this.http.get<any>(`api/get_humidity?room=${id}`);
  }

  getLuminosity(id: number): Observable<any> {
  	return this.http.get<any>(`api/get_luminosity?room=${id}`);
  }
}
