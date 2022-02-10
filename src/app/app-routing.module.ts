import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LastBlocksComponent } from './last-blocks/last-blocks.component';
import { LastOperationsComponent } from './last-operations/last-operations.component';

const routes: Routes = [
  { path: 'last-operations', component: LastOperationsComponent },
  { path: 'last-blocks', component: LastBlocksComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
