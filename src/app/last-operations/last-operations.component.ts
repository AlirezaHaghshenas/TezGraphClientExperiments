import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  OperationNotification,
  OperationRecordConnection,
} from 'src/tezgraph-types';

@Component({
  selector: 'app-last-operations',
  templateUrl: './last-operations.component.html',
  styleUrls: ['./last-operations.component.scss'],
})
export class LastOperationsComponent implements OnInit {
  result: any;
  operations: OperationRecordConnection[] = [];
  subscriptionBlocks: OperationNotification[] = [];
  // lastBlockLevel?: number;

  constructor(private readonly apollo: Apollo) {}

  ngOnInit(): void {
    this.getBlocks(null).subscribe((blocks) => {
      // this.lastBlockLevel = blocks.edges?.[0].node?.level;
      // if (this.lastBlockLevel) {
        // this.subscribe(this.lastBlockLevel + 1);
      // } else {
      //   console.error(
      //     'Could not determine block level to start subscription from'
      //   );
      // }
    });
  }

  getBlocks(cursor: string | null): Observable<OperationRecordConnection> {
    return this.apollo
      .watchQuery({
        query: gql`
          query Operations($after: Cursor) {
            operations(first: 20, after: $after) {
              total_count
              page_info {
                has_next_page
                end_cursor
              }
              edges {
                node {
                  kind
                  hash
                  block {
                    level
                    timestamp
                  }
                  source {
                    address
                  }
                }
              }
            }
          }
        `,
      })
      .valueChanges.pipe(
        map((result: any) => {
          this.result = result;
          const blocks = result.data.operations as OperationRecordConnection;
          this.operations?.push(blocks);
          return blocks;
        })
      );
  }
}
