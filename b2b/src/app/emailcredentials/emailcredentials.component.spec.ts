import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailcredentialsComponent } from './emailcredentials.component';

describe('EmailcredentialsComponent', () => {
  let component: EmailcredentialsComponent;
  let fixture: ComponentFixture<EmailcredentialsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailcredentialsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailcredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
