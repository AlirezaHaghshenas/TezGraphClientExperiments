import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastOperationsComponent } from './last-operations.component';

describe('LastTransactionsComponent', () => {
  let component: LastOperationsComponent;
  let fixture: ComponentFixture<LastOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LastOperationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LastOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
