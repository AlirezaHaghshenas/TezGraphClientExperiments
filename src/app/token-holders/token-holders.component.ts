import { Component, OnInit } from '@angular/core';
import { Schema } from '@taquito/michelson-encoder';
import { Apollo, gql } from 'apollo-angular';
import {
  BigmapKeyRecord,
  BigmapKeyRecordConnection,
  BigmapRecordConnection,
} from 'src/tezgraph-types';

@Component({
  selector: 'app-token-holders',
  templateUrl: './token-holders.component.html',
  styleUrls: ['./token-holders.component.scss'],
})
export class TokenHoldersComponent implements OnInit {
  bigmapId = 88080;
  total_count?: number;
  entries: { key: any; value: any }[] = [];
  keyStorageSchema?: Schema;
  valueStorageSchema?: Schema;
  tokenOwners?: string[];
  tokensByAddress?: Map<string, number>;
  numberOfOwners?: number;
  totalTokens?: number;
  average?: number;
  gettingInitialData = false;
  message?: string;

  constructor(private readonly apollo: Apollo) {}

  ngOnInit(): void {
    this.getBigmapInfo();
  }

  async getBigmapInfo() {
    this.gettingInitialData = true;
    const info = this.apollo
      .query({
        query: gql`
          query bigmap($bigmap_id: Int!) {
            bigmaps(first: 1, filter: { ids: [$bigmap_id] }) {
              edges {
                node {
                  key_type
                  value_type
                  keys(first: 100) {
                    total_count
                    page_info {
                      has_next_page
                      end_cursor
                    }
                    edges {
                      node {
                        key
                        current_value {
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          bigmap_id: this.bigmapId,
        },
      })
      .subscribe({
        next: (result: any) => {
          const bigmaps = result.data.bigmaps as BigmapRecordConnection;
          const bigmap = bigmaps.edges![0].node!;
          this.total_count = bigmap.keys.total_count;
          this.keyStorageSchema = new Schema(bigmap.key_type);
          this.valueStorageSchema = new Schema(bigmap.value_type);
          this.entries = bigmap.keys.edges!.map((k) => ({
            key: this.keyStorageSchema?.Execute(k.node!.key),
            value: this.valueStorageSchema?.Execute(
              k.node!.current_value.value
            ),
          }));
          this.getNextPage(bigmap.keys.page_info);
          this.gettingInitialData = false;
        },
        error: (error: any) => {
          this.gettingInitialData = false;
        },
      });
  }

  async getNextPage(page_info: {
    has_next_page: boolean;
    end_cursor?: string;
  }) {
    if (!page_info.has_next_page) {
      this.calculateStats();
      return;
    }
    this.apollo
      .query({
        query: gql`
          query bigmap_keys($bigmap_id: Float!, $after: Cursor) {
            bigmap_keys(
              first: 100
              after: $after
              filter: { bigmap_id: $bigmap_id }
            ) {
              page_info {
                has_next_page
                end_cursor
              }
              edges {
                node {
                  key
                  current_value {
                    value
                  }
                }
              }
            }
          }
        `,
        variables: {
          bigmap_id: this.bigmapId,
          after: page_info.end_cursor,
        },
      })
      .subscribe((result: any) => {
        const bigmapKeys = result.data.bigmap_keys as BigmapKeyRecordConnection;
        this.entries.push(
          ...bigmapKeys.edges!.map((k) => ({
            key: this.keyStorageSchema?.Execute(k.node!.key),
            value: this.valueStorageSchema?.Execute(
              k.node!.current_value.value
            ),
          }))
        );
        this.getNextPage(bigmapKeys.page_info);
      });
  }

  calculateStats() {
    const allOwners = this.entries
      .filter((x) => x.value != '0')
      .map((x) => x.key['0']);
    const uniqueOwners = new Set(allOwners);
    this.tokenOwners = [...uniqueOwners];
    const tokensByAddress = new Map<string, number>();
    this.entries.forEach((entry) => {
      if (entry.value == '0') {
        return;
      }
      const address = entry.key[0];
      tokensByAddress.set(
        address,
        (tokensByAddress.get(address) ?? 0) + parseFloat(entry.value)
      );
    });

    this.tokensByAddress = tokensByAddress;
    this.numberOfOwners = [...this.tokensByAddress.keys()].length;
    let sum = 0;
    for (let v of this.tokensByAddress.values()) {
      sum += v;
    }
    this.totalTokens = sum;
    this.average = this.totalTokens / this.numberOfOwners;
  }
}
