import { TestBed } from '@angular/core/testing';

import { BlockService } from './block.service';

describe('BlockServiceService', () => {
  let service: BlockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
