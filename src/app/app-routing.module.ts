import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoomComponent } from './room/room.component';
import { CameraComponent } from './camera/camera.component';

const routes: Routes = [
	{ path: '', redirectTo: '/room/1', pathMatch: 'full' },
	{ path: 'room/:id', component: RoomComponent},
	{ path: 'camera', component: CameraComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
