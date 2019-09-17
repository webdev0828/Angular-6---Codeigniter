import { EmailcredentialsComponent } from './emailcredentials/emailcredentials.component'
import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { LoginComponent } from './login/login.component'
import { ChangePasswordComponent } from './change-password/change-password.component'
import { EmployeesComponent } from './employees/employees.component'
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component'
import { OrderlistComponent } from './orderlist/orderlist.component'
import { UseradminComponent } from './useradmin/useradmin.component'
import { ValidationComponent } from './validation/validation.component'
import { StepperComponent } from './stepper/stepper.component'
import { ForgetComponent } from './forget/forget.component'

const routes: Routes = [
  {
    path: '',
    component: OrderlistComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'changepassword',
    component: ChangePasswordComponent,
  },
  {
    path: 'mailcredentials',
    component: EmailcredentialsComponent,
  },
  {
    path: 'employees',
    component: EmployeesComponent,
  },
  {
    path: 'forgotpassword',
    component: ForgotpasswordComponent,
  },
  {
    path: 'order',
    component: StepperComponent,
  },
  {
    path: 'order/:id/:id1/:id2',
    component: StepperComponent,
  },
  {
    path: 'validation',
    component: ValidationComponent,
  },
  {
    path: 'stepper',
    component: StepperComponent,
  },
  {
    path: 'admin',
    component: UseradminComponent,
  },
  {
    path: 'forget/:id/:id1',
    component: ForgetComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
