import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { AccountRecordConnection, TokenMetadata } from 'src/tezgraph-types';

@Component({
  selector: 'app-token-metadata',
  templateUrl: './token-metadata.component.html',
  styleUrls: ['./token-metadata.component.scss'],
})
export class TokenMetadataComponent implements OnInit {
  isWorking = false;
  contractAddress = 'KT1L7GvUxZH5tfa6cgZKnH6vpp2uVxnFVHKu';
  tokenId = 2782;
  result?: TokenMetadata;

  constructor(private readonly apollo: Apollo) {}

  ngOnInit(): void {}

  applyFilter() {
    this.isWorking = true;
    return this.apollo
      .query({
        query: gql`
          query TokenMetadata($contract: Address!, $tokenId: Int) {
            accounts(first: 1, filter: { addresses: [$contract] }) {
              edges {
                node {
                  token_metadata(token_id: $tokenId) {
                    decimals
                    name
                    symbol
                    token_id
                    raw
                  }
                }
              }
            }
          }
        `,
        variables: {
          contract: this.contractAddress,
          tokenId: this.tokenId,
        },
      })
      .subscribe((result: any) => {
        this.isWorking = false;
        const accounts = result.data.accounts as AccountRecordConnection;
        this.result = accounts.edges![0].node?.token_metadata!;
      });
  }
}
