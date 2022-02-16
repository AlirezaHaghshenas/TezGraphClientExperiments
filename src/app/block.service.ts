import { Injectable } from '@angular/core';
import { Subscription, gql, Apollo, TypedDocumentNode } from 'apollo-angular';
import { EmptyObject } from 'apollo-angular/build/types';
import { DocumentNode } from 'graphql';

@Injectable({
  providedIn: 'root',
})
export class BlockService {
  constructor(private readonly apollo: Apollo) {}

  getSubscriptionAfterLevel(level: number) {
    return new BlockSubscription(this.apollo, level).subscribe();
  }
}

export class BlockSubscription extends Subscription {
  override readonly document:
    | DocumentNode
    | TypedDocumentNode<any, EmptyObject>;

  constructor(
    public override readonly apollo: Apollo,
    private readonly fromLevel: number
  ) {
    super(apollo);
    this.document = gql`
    subscription {
      blockAdded(replayFromBlockLevel: ${fromLevel}) {
        hash
        header {
          level
          timestamp
        }
      }
    }
  `;
  }
}
