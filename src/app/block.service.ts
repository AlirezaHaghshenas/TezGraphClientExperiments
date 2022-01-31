import { Injectable } from '@angular/core';
import { Subscription, gql } from 'apollo-angular';

@Injectable({
  providedIn: 'root',
})
export class BlockService extends Subscription {
  override document = gql`
    subscription {
      blockAdded {
        hash
        header {
          level
          timestamp
        }
      }
    }
  `;
}
