import { Component, OnInit } from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import { BlockNotification, BlockRecord, BlockRecordConnection } from 'src/tezgraph-types';
import { BlockService } from './block.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'TezGraphClientExperiments2';
  result: any;
  blocks?: BlockRecordConnection;
  subscriptionBlocks: BlockNotification[] = [];
  lastBlockLevel?: number;

  constructor(
    private readonly apollo: Apollo,
    private readonly blocksService: BlockService
  ) {}

  ngOnInit(): void {
    this.apollo
      .watchQuery({
        query: gql`
          {
            blocks(first: 10, order_by: { field: level, direction: desc }) {
              total_count
              edges {
                node {
                  hash
                  level
                  timestamp
                }
              }
            }
          }
        `,
      })
      .valueChanges.subscribe((result: any) => {
        this.result = result;
        this.blocks = result.data.blocks;
        this.lastBlockLevel = this.blocks?.edges?.[0].node?.level;
        this.subscribe();
      });
  }

  subscribe() {
    console.log('subscribed');
    this.blocksService.subscribe().subscribe((result: any) => {
      console.log('data arrived');
      console.log(JSON.stringify(result));
      const blockAdded = result.data.blockAdded as BlockNotification;
      this.subscriptionBlocks.unshift(blockAdded);
    });
  }
}
