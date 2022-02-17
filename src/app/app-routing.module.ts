import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LastBlocksComponent } from './last-blocks/last-blocks.component';
import { LastOperationsComponent } from './last-operations/last-operations.component';
import { TokenHoldersComponent } from './token-holders/token-holders.component';

const routes: Routes = [
  { path: 'last-operations', component: LastOperationsComponent },
  { path: 'last-blocks', component: LastBlocksComponent},
  { path: 'token-holders', component: TokenHoldersComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
