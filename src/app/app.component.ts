import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BlockRecord, BlockRecordConnection } from 'src/tezgraph-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'TezGraphClientExperiments2';
  result: any;
  blocks?: BlockRecordConnection;

  constructor(private readonly apollo: Apollo) {}

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
      });
  }
}
