import { Component, OnInit } from '@angular/core';
import { Schema } from '@taquito/michelson-encoder';
import { Apollo, gql } from 'apollo-angular';
import {
  BigmapRecordConnection,
  BigmapValueRecordConnection,
} from 'src/tezgraph-types';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-token-holders',
  templateUrl: './token-holders.component.html',
  styleUrls: ['./token-holders.component.scss'],
})
export class TokenHoldersComponent implements OnInit {
  bigmapId = 88080;
  total_count?: number;
  entries: {
    key: { '0': string; 1: BigNumber };
    value: string;
    level: number;
    timestamp: string;
    isCurrent: boolean;
  }[] = [];
  keyStorageSchema?: Schema;
  valueStorageSchema?: Schema;
  tokenOwners?: string[];
  tokensByAddress?: Map<string, number>;
  numberOfOwners?: number;
  totalTokens?: number;
  average?: number;
  initialQueries = 0;
  message?: string;
  warnings: string[] = [];
  totalTokenSpends: number = 0;
  totalTokenKeepingInSecond: number = 0;
  averageTokenKeepingInSecond: number = 0;

  constructor(private readonly apollo: Apollo) {}

  ngOnInit(): void {
    this.getBigmapInfo();
    this.getFirstPageOfValues();
  }

  async getBigmapInfo() {
    this.initialQueries++;
    this.apollo
      .query({
        query: gql`
          query bigmaps($bigmap_id: Int!) {
            bigmaps(first: 1, filter: { ids: [$bigmap_id] }) {
              edges {
                node {
                  key_type
                  value_type
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
          const bigmap = (result.data.bigmaps as BigmapRecordConnection)
            .edges![0].node!;
          this.keyStorageSchema = new Schema(bigmap.key_type);
          this.valueStorageSchema = new Schema(bigmap.value_type);
          this.initialQueries--;
        },
        error: (error: any) => {
          this.initialQueries--;
        },
      });
  }

  async getFirstPageOfValues() {
    this.initialQueries++;
    const info = this.apollo
      .query({
        query: gql`
          query bigmap_values($bigmap_id: Float) {
            bigmap_values(first: 100, filter: { bigmap_id: $bigmap_id }) {
              total_count
              page_info {
                has_next_page
                end_cursor
              }
              edges {
                node {
                  key
                  value
                  block {
                    level
                    timestamp
                  }
                  batch_position
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
          const valuesConnection = result.data
            .bigmap_values as BigmapValueRecordConnection;
          this.total_count = valuesConnection.total_count;
          this.entries = valuesConnection.edges!.map((k) => ({
            key: this.keyStorageSchema?.Execute(k.node!.key),
            value: this.valueStorageSchema?.Execute(k.node!.value),
            level: k.node!.block.level,
            timestamp: k.node!.block.timestamp,
            isCurrent: false,
          }));
          this.getNextPage(valuesConnection.page_info);
          this.initialQueries--;
        },
        error: (error: any) => {
          this.initialQueries--;
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
          query bigmap_values($bigmap_id: Float, $after: Cursor) {
            bigmap_values(
              first: 100
              after: $after
              filter: { bigmap_id: $bigmap_id }
            ) {
              total_count
              page_info {
                has_next_page
                end_cursor
              }
              edges {
                node {
                  key
                  value
                  block {
                    level
                    timestamp
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
        const bigmapValues = result.data
          .bigmap_values as BigmapValueRecordConnection;
        this.entries.push(
          ...bigmapValues.edges!.map((k) => ({
            key: this.keyStorageSchema?.Execute(k.node!.key),
            value: this.valueStorageSchema?.Execute(k.node!.value),
            level: k.node!.block.level,
            timestamp: k.node!.block.timestamp,
            isCurrent: false,
          }))
        );
        this.getNextPage(bigmapValues.page_info);
      });
  }

  calculateStats() {
    this.markCurrentValues();
    const allOwners = this.entries
      .filter((x) => x.isCurrent && x.value != '0')
      .map((x) => x.key['0']);
    const uniqueOwners = new Set(allOwners);
    this.tokenOwners = [...uniqueOwners];
    const tokensByAddress = new Map<string, number>();
    this.entries.forEach((entry) => {
      if (!entry.isCurrent || entry.value == '0') {
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

  markCurrentValues() {
    const keyToLevelMap = new Map<string, { level: number }>();
    const userTokenHistory = new Map<
      string,
      { value: string; level: number; timestamp: string }[]
    >();
    this.entries.forEach((x) => {
      const key = JSON.stringify(x.key);
      let v = keyToLevelMap.get(key);
      if (v === undefined) {
        v = {
          level: -1,
        };
        keyToLevelMap.set(key, v);
      }
      if (v.level === x.level) {
        this.warnings.push(
          `Multiple values for the same key and level found, Key: ${x.key} Level: ${x.level}`
        );
        console.log(this.warnings);
      } else if (v.level < x.level) {
        v.level = x.level;
      }
      let history = userTokenHistory.get(key);
      if (history === undefined) {
        history = [];
        userTokenHistory.set(key, history);
      }
      history.push({
        level: x.level,
        timestamp: x.timestamp,
        value: x.value,
      });
    });
    this.entries.forEach((x) => {
      const key = JSON.stringify(x.key);
      const info = keyToLevelMap.get(key);
      x.isCurrent = x.level === info?.level;
    });
    let totalTokenSpends = 0;
    let totalTokenKeepingInSecond = 0;
    userTokenHistory.forEach((history, key) => {
      if (history.length === 1) {
        return;
      }
      let level = Number.MAX_VALUE;
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        if (h.level >= level) {
          this.warnings.push(
            `Multiple values for the same key and level found, Key: ${key} Level: ${h.level}`
          );
        }
        level = h.level;
        if (h.value != '0') {
          continue;
        }
        if (i === history.length - 1) {
          this.warnings.push(
            `A spent token is not first received: ${key} Level: ${h.level}`
          );
          console.log(this.warnings);
          continue;
        }
        totalTokenSpends++;
        totalTokenKeepingInSecond +=
          (new Date(h.timestamp).valueOf() -
            new Date(history[i + 1].timestamp).valueOf()) /
          60000;
      }
    });
    this.totalTokenSpends = totalTokenSpends;
    this.totalTokenKeepingInSecond = totalTokenKeepingInSecond;
    this.averageTokenKeepingInSecond =
      totalTokenKeepingInSecond / totalTokenSpends;
  }
}
