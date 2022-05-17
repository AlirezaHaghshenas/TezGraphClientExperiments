import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {
  OperationNotification,
  OperationRecord,
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
  destination: string | null = null;
  hash: string | null = null;
  isWorking = false;
  operationDetails?: OperationRecord[];
  message?: string;
  tokenBalanceChanges?: any[];
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
    this.getOperations(null);
  }

  applyFilter() {
    this.operations = [];
    this.getOperations(null);
  }

  loadMore() {
    const nextCursor =
      this.operations[this.operations.length - 1].page_info.end_cursor;
    this.getOperations(nextCursor);
  }

  getOperations(cursor: string | null) {
    this.isWorking = true;
    this.message = undefined;
    this.operationDetails = undefined;
    this.tokenBalanceChanges = undefined;
    this.apollo
      .query({
        query: gql`
          query Operations(
            $after: Cursor
            $sources: [Address!]
            $destinations: [Address!]
            $hash: OperationHash
          ) {
            operations(
              first: 20
              after: $after
              filter: {
                sources: $sources
                destinations: $destinations
                hash: $hash
              }
            ) {
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
          sources: this.source ? [this.source] : undefined,
          destination: this.destination ? [this.destination] : undefined,
          hash: this.hash ?? undefined,
        },
        errorPolicy: 'ignore',
      })
      .subscribe({
        next: (result: any) => {
          this.isWorking = false;
          this.result = result;
          const operations = result.data
            .operations as OperationRecordConnection;
          this.operations?.push(operations);
          if (result.errors) {
            this.message = result.errors;
          } else if (
            !cursor &&
            (this.source || this.destination) &&
            !operations.edges
          ) {
            this.message = 'This account does not exist or is not used';
          }
        },
        error: (error: any) => {
          this.isWorking = false;
          this.message = error;
          console.log(error);
        },
      });
  }

  getDetails(operation: OperationRecord) {
    this.isWorking = true;
    this.operationDetails = undefined;
    this.tokenBalanceChanges = undefined;
    this.apollo
      .query({
        query: gql`
          query OperationDetails($hash: OperationHash) {
            operations(first: 100, filter: { hash: $hash }) {
              edges {
                node {
                  kind
                  hash
                  batch_position
                  internal
                  block {
                    hash
                    level
                    timestamp
                  }
                  source {
                    address
                  }
                  bigmap_values(first: 100) {
                    total_count
                    page_info {
                      has_next_page
                      end_cursor
                    }
                    edges {
                      node {
                        kind
                        key
                        value
                        contract {
                          address
                        }
                        batch_position
                        bigmap {
                          id
                          annots
                          key_type
                          value_type
                        }
                      }
                    }
                  }
                  ... on DelegationRecord {
                    fee
                    counter
                    gas_limit
                    storage_limit
                    amount
                  }
                  ... on EndorsementRecord {
                    reward
                    deposit
                  }
                  ... on OriginationRecord {
                    fee
                    counter
                    gas_limit
                    storage_limit
                    balance
                    delegate {
                      address
                    }
                    metadata {
                      operation_result {
                        status
                        consumed_gas
                        consumed_milligas
                        errors
                      }
                    }
                    contract_address
                    storage_size
                    burned
                    contract {
                      address
                    }
                  }
                  ... on RevealRecord {
                    fee
                    counter
                    gas_limit
                    storage_limit
                    metadata {
                      operation_result {
                        status
                        consumed_gas
                        consumed_milligas
                        errors
                      }
                    }
                  }
                  ... on TransactionRecord {
                    fee
                    counter
                    gas_limit
                    storage_limit
                    amount
                    destination {
                      address
                    }
                    parameters {
                      entrypoint
                      value
                      canonical_value
                      michelson_value
                    }
                    metadata {
                      operation_result {
                        status
                        consumed_gas
                        consumed_milligas
                        consumed_milligas
                        errors
                      }
                    }
                    storage_size
                  }
                }
              }
            }
          }
        `,
        variables: {
          hash: operation.hash,
        },
      })
      .subscribe({
        next: (result: any) => {
          this.isWorking = false;
          const operations = (
            result.data.operations as OperationRecordConnection
          ).edges!.map((e) => e.node!);
          this.operationDetails = operations;
          this.extractInterestingInfo(operations);
        },
        error: (error: any) => {
          this.isWorking = false;
          this.message = error;
        },
      });
  }

  extractInterestingInfo(operations: OperationRecord[]) {
    this.tokenBalanceChanges = operations
      .flatMap((o) => o.bigmap_values.edges!)
      ?.filter(
        (e) =>
          e.node?.bigmap.annots == '%ledger' ||
          e.node?.bigmap.annots == '%balances'
      )
      .map((x) => ({
        key: x.node?.key,
        value: x.node?.value ?? null,
      }));
  }
}
