import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LastBlocksComponent } from './last-blocks/last-blocks.component';
import { LastTransactionsComponent } from './last-transactions/last-transactions.component';

const routes: Routes = [
  { path: 'last-trans', component: LastTransactionsComponent },
  { path: 'last-blocks', component: LastBlocksComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
