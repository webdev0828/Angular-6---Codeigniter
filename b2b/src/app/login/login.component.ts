import { Component, OnInit } from '@angular/core'
import { Http, Headers, Response, RequestOptions } from '@angular/http'
import { UrlService } from '../providers/url.service'
import { Router } from '@angular/router'
import { AuthService } from '../providers/auth.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  passwordError = false
  emailError = false
  incorrectCredentials = false
  alertText = ''
  userEmail = ''
  userPassword = ''
  emailForValidate = ''
  constructor(
    private http: Http,
    public url: UrlService,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {}

  passwordChange(value) {
    if (value == '') {
      this.emailError = false
    } else {
      if (value.length < 6) {
        this.passwordError = true
      } else {
        this.passwordError = false
      }
    }
  }

  /*------------------- Reference Login Email Validation ------------------*/
  validateEmail() {
    var email = this.emailForValidate
    if (email == '') {
      this.emailError = false
    } else {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

      if (re.test(String(email).toLowerCase()) == false) {
        this.emailError = true
      } else {
        this.emailError = false
      }
    }
  }

  /*------------------- Reference Login Function ------------------*/
  Login(loginData: any) {
    console.log('here login data: ', loginData)
    if (this.emailError === true || this.passwordError === true) {
      //this.incorrectCredentials = true;
      //this.alertText = "Please correct email/password format";
    } else if (loginData.userEmail === '' || loginData.userPassword === '') {
      this.incorrectCredentials = true
      this.alertText = 'Udfyld venligst email og adgangskode'
    } else {
      this.incorrectCredentials = false
      const formData = new FormData()

      formData.append('email', loginData.userEmail)
      formData.append('password', loginData.userPassword)
      this.http
        .post(this.url.APP_URL + 'login', formData)
        .subscribe((registered: Response) => {
          console.log(registered)
          const response = registered.json()
          if (response.status == 'success') {
            this.auth.loggedIn = true
            if (response.data.administrator == '0') {
              this.auth.saveLocalTokens(
                response.data.userId,
                response.email,
                response.token,
                'user',
                response.data.firstLogin,
                response.data.mobilPlanId,
                response.passwordChanged,
                'user',
                response.data.name,
                response.installers,
                response.orderedByName,
                response.data.customerId,
              )
              this.router.navigate(['/'])
            } else {
              this.auth.loggedIn = true
              this.auth.saveLocalTokens(
                response.data.userId,
                response.data.email,
                response.token,
                'admin',
                response.data.firstLogin,
                response.data.mobilPlanId,
                response.data.passwordChanged,
                'admin',
                response.data.name,
                response.installers,
                '',
                response.data.customerId,
              )
              this.router.navigate(['/admin'])
            }
          }
          if (response.status == 'failed') {
            this.incorrectCredentials = true
            this.alertText == ''
            this.alertText = response.data
          }
        })
    }
  }
}
