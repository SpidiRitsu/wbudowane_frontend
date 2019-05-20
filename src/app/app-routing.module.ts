import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoomComponent } from './room/room.component';

const routes: Routes = [
	{ path: '', redirectTo: '/room/1', pathMatch: 'full' },
	{ path: 'room/:id', component: RoomComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
