import { Component, OnInit } from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { BlockNotification, BlockRecordConnection } from 'src/tezgraph-types';
import { BlockService } from './block.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'TezGraphClientExperiments2';
  result: any;
  blocks: BlockRecordConnection[] = [];
  subscriptionBlocks: BlockNotification[] = [];
  lastBlockLevel?: number;

  constructor(
    private readonly apollo: Apollo,
    private readonly blocksService: BlockService
  ) {}

  ngOnInit(): void {
    this.getBlocks(null).subscribe((blocks) => {
      this.lastBlockLevel = blocks.edges?.[0].node?.level;
      if (this.lastBlockLevel) {
        this.subscribe(this.lastBlockLevel + 1);
      } else {
        console.error(
          'Could not determine block level to start subscription from'
        );
      }
    });
  }

  subscribe(fromLevel: number) {
    console.log('subscribed');
    this.blocksService
      .getSubscriptionAfterLevel(fromLevel)
      .subscribe((result: any) => {
        console.log('data arrived');
        console.log(JSON.stringify(result));
        const blockAdded = result.data.blockAdded as BlockNotification;
        this.subscriptionBlocks.unshift(blockAdded);
      });
  }

  loadMore() {
    const nextCursor = this.blocks[this.blocks.length - 1].page_info.end_cursor;
    this.getBlocks(nextCursor).subscribe(blocks => {
      console.log('got next page')
    });
  }

  getBlocks(cursor: string | null): Observable<BlockRecordConnection> {
    return this.apollo
      .watchQuery({
        query: gql`
          query Blocks($after: Cursor) {
            blocks(
              first: 10
              order_by: { field: level, direction: desc }
              after: $after
            ) {
              total_count
              page_info {
                has_next_page
                end_cursor
              }
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
      .valueChanges.pipe(
        map((result: any) => {
          this.result = result;
          const blocks = result.data.blocks as BlockRecordConnection;
          this.blocks?.push(blocks);
          return blocks;
        })
      );
  }
}
