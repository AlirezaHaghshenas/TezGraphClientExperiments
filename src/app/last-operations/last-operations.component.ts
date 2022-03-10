import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  OperationNotification,
  OperationRecordConnection,
} from 'src/tezgraph-types';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-last-operations',
  templateUrl: './last-operations.component.html',
  styleUrls: ['./last-operations.component.scss'],
})
export class LastOperationsComponent implements OnInit {
  result: any;
  operations: OperationRecordConnection[] = [];
  subscriptionBlocks: OperationNotification[] = [];
  source: string | null = null;
  isWorking = false;
  // lastBlockLevel?: number;

  get allOperations() {
    return this.operations.flatMap((x) => x.edges).map((x) => x?.node);
  }

  constructor(
    private readonly apollo: Apollo,
    private readonly clipboard: Clipboard,
    private readonly snackBar: MatSnackBar
  ) {}

  copyToClipboard(text: string) {
    this.clipboard.copy(text);
    this.snackBar.open('Copied to clipboard!', undefined, { duration: 700 });
  }

  ngOnInit(): void {
    this.getOperations(null, this.source).subscribe((blocks) => {
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

  applyFilter() {
    this.operations = [];
    this.getOperations(null, this.source).subscribe((_) => {});
  }

  loadMore() {
    const nextCursor =
      this.operations[this.operations.length - 1].page_info.end_cursor;
    this.getOperations(nextCursor, this.source).subscribe((_) => {});
  }

  getOperations(
    cursor: string | null,
    source: string | null
  ): Observable<OperationRecordConnection> {
    this.isWorking = true;
    return this.apollo
      .watchQuery({
        query: gql`
          query Operations($after: Cursor, $source: Address) {
            operations(first: 20, after: $after, filter: { source: $source }) {
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
        variables: {
          after: cursor,
          source: !source ? undefined : source,
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          this.isWorking = false;
          this.result = result;
          const operations = result.data
            .operations as OperationRecordConnection;
          this.operations?.push(operations);
          return operations;
        })
      );
  }
}
