import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { BlockNotification, BlockRecordConnection } from 'src/tezgraph-types';
import { BlockService } from '../block.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-last-blocks',
  templateUrl: './last-blocks.component.html',
  styleUrls: ['./last-blocks.component.scss'],
})
export class LastBlocksComponent implements OnInit {
  result: any;
  blocks: BlockRecordConnection[] = [];
  subscriptionBlocks: BlockNotification[] = [];
  lastBlockLevel?: number;
  queryRunning = false;
  subscribed = false;
  messages: any[] = [];

  constructor(
    private readonly apollo: Apollo,
    private readonly blocksService: BlockService,
    private readonly clipboard: Clipboard,
    private readonly snackBar: MatSnackBar
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

  copyToClipboard(text: string) {
    this.clipboard.copy(text);
    this.snackBar.open('Copied to clipboard!', undefined, { duration: 700 });
  }

  subscribe(fromLevel: number) {
    this.subscribed = true;
    this.blocksService.getSubscriptionAfterLevel(fromLevel).subscribe({
      next: (result: any) => {
        console.log('data arrived');
        console.log(JSON.stringify(result));
        const blockAdded = result.data.blockAdded as BlockNotification;
        this.subscriptionBlocks.unshift(blockAdded);
      },
      error: (err: any) => {
        this.subscribed = false;
        this.messages.push(err);
      },
    });
  }

  loadMore() {
    const nextCursor = this.blocks[this.blocks.length - 1].page_info.end_cursor;
    this.getBlocks(nextCursor).subscribe((blocks) => {
      console.log('got next page');
    });
  }

  getBlocks(cursor: string | null): Observable<BlockRecordConnection> {
    this.queryRunning = true;
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
        variables: {
          after: cursor,
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          this.queryRunning = false;
          this.result = result;
          const blocks = result.data.blocks as BlockRecordConnection;
          this.blocks?.push(blocks);
          return blocks;
        })
      );
  }
}
