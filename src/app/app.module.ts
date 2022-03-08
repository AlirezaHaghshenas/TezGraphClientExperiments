import { NgModule, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GraphQLModule } from './graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, split } from '@apollo/client/core';
import {WebSocketLink} from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { OperationDefinitionNode } from 'graphql';
import { LastOperationsComponent } from './last-operations/last-operations.component';
import { LastBlocksComponent } from './last-blocks/last-blocks.component';
import { FormsModule } from '@angular/forms';
import { TokenHoldersComponent } from './token-holders/token-holders.component';

@NgModule({
  declarations: [AppComponent, LastBlocksComponent, LastOperationsComponent, TokenHoldersComponent],
  imports: [BrowserModule, AppRoutingModule, GraphQLModule, HttpClientModule, FormsModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => {
        const http = httpLink.create({
          uri: 'http://localhost:3000/graphql',
          // uri: 'https://mainnet.tezgraph.tez.ie/graphql',
        });

        const ws = new WebSocketLink({
          uri: `ws://localhost:3000/graphql`,
          // uri: `wss://mainnet.tezgraph.tez.ie/graphql`,
          options: {
            reconnect: true,
          },
        });

        const link = split(
          // split based on operation type
          ({query}) => {
            const {kind, operation} = getMainDefinition(query) as OperationDefinitionNode;
            return (
              kind === 'OperationDefinition' && operation === 'subscription'
            );
          },
          ws,
          http,
        );

        return {
          cache: new InMemoryCache(),
          link
        };
      },
      deps: [HttpLink],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
