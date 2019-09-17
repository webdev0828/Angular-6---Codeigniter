import { Component, OnInit } from '@angular/core';
import { AuthService } from '../providers/auth.service';
import { Router } from '@angular/router';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { UrlService } from '../providers/url.service';
@Component({
  selector: 'app-emailcredentials',
  templateUrl: './emailcredentials.component.html',
  styleUrls: ['./emailcredentials.component.css']
})
export class EmailcredentialsComponent implements OnInit {
  uType = ""
  passwordChanged = false;
  newPassword = "";
  confNewPassword = "";
  passwordError = false;
  newPasswordError = false;
  passwordMismatchError = false;
  passwordErrortext = "";
  passwordChangedText = "";
  passwordChangeStatus = false;
  email;
  password;
  host;
  port;
  constructor(private auth : AuthService, private router : Router,private url : UrlService, private http : Http) {
    if(auth.getLocalTokens() != null){
      this.uType = JSON.parse(localStorage.getItem("data")).accountType;
    }
    if(auth.loggedIn && this.uType === "user" || this.uType === "admin") {
      var passwordChanged = JSON.parse(localStorage.getItem("data")).passwordChanged;
      if(passwordChanged == "no") {
        this.passwordChanged = true;
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.http.get(this.url.APP_URL + "smtpCredentials")
    .subscribe((data: Response) => {
      const d = data.json();
      if (d.status == "success") {
      this.email=d.data.email;
      this.password=d.data.password
      this.host=d.data.host;
      this.port =d.data.port;
      }
    })
  }

  ResetPassword(form : any) {
    if(form.email == '' || form.password == '' || form.host == '' || form.port == ''){
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Adgangskoden skal udfyldes";
    }else {
      const formData = new FormData();
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('host', form.host);
      formData.append('port', form.port);
      this.http.post(this.url.APP_URL + 'smtpCredentials', formData)
      .subscribe((registered: Response) => {
        const response = registered.json();
        if(response.status == "success") {
          this.passwordMismatchError = false;
          this.passwordChangeStatus = true;
          this.passwordChangedText = "SMTP konfigurationen er gemt.";
          var _this=this;
          setTimeout(function(){
             _this.router.navigate(['/admin'])
            }, 2000);
        }
        if(response.status == "failed") {
          this.passwordChangeStatus = false;
          this.passwordMismatchError = true;
          this.passwordErrortext = "";
          this.passwordErrortext = response.message;
        }
      });
    }
  }

  cancel() {
    var userType = JSON.parse(localStorage.getItem("data")).accountType;
    if(userType == "admin") {
      this.router.navigate(['/admin'])
    } else {
      this.router.navigate(['/']);
    }
  }

}
