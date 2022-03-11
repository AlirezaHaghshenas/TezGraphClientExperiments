import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenMetadataComponent } from './token-metadata.component';

describe('TokenMetadataComponent', () => {
  let component: TokenMetadataComponent;
  let fixture: ComponentFixture<TokenMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TokenMetadataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
