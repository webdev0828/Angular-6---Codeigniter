import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { HeaderComponent } from './components/header/header.component'
import { LoginComponent } from './login/login.component'
import { ChangePasswordComponent } from './change-password/change-password.component'
import { EmployeesComponent } from './employees/employees.component'
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component'
import {
  OrderlistComponent,
  OrderCancelDialog,
  OrderSummaryDialog,
} from './orderlist/orderlist.component'
import {
  UseradminComponent,
  UserActiveDialog,
} from './useradmin/useradmin.component'
import { ValidationComponent } from './validation/validation.component'
import {
  StepperComponent,
  AddWindowDialog,
  AddSalesmanDialog,
} from './stepper/stepper.component'
import {
  NgbModal,
  ModalDismissReasons,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap'
import {
  HashLocationStrategy,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common'
import { FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms'
import { ApiService } from './providers/api.service'
import { AuthService } from './providers/auth.service'
import { UrlService } from './providers/url.service'
import { HttpModule } from '@angular/http'
import { HttpClientModule } from '@angular/common/http'
import { NgxSpinnerModule } from 'ngx-spinner'
import { ForgetComponent } from './forget/forget.component'
import { DataTableModule } from 'angular-6-datatable'
import * as $ from 'jquery'
import { EmailcredentialsComponent } from './emailcredentials/emailcredentials.component'
import { MaterialModule } from './components/materialmodule/materialmodule'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material'
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    ChangePasswordComponent,
    EmployeesComponent,
    ForgotpasswordComponent,
    OrderlistComponent,
    UseradminComponent,
    ValidationComponent,
    StepperComponent,
    ForgetComponent,
    EmailcredentialsComponent,
    OrderCancelDialog,
    OrderSummaryDialog,
    UserActiveDialog,
    AddWindowDialog,
    AddSalesmanDialog,
  ],
  entryComponents: [
    [OrderlistComponent, OrderCancelDialog, OrderSummaryDialog],
    [UseradminComponent, UserActiveDialog],
    [StepperComponent, AddWindowDialog],
    [StepperComponent, AddSalesmanDialog],
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModalModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    NgxSpinnerModule,
    DataTableModule,
    MaterialModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
  ],
  providers: [
    ApiService,
    AuthService,
    UrlService,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
