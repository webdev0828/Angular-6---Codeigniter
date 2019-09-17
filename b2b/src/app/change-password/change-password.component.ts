import { Component, OnInit } from '@angular/core';
import { AuthService } from '../providers/auth.service';
import { Router } from '@angular/router';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { UrlService } from '../providers/url.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
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
  passwordLimit=6
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
  }

  ResetPassword(form : any) {
    this.passwordChanged = false;
    console.log("here password change form", form);
    if(form.newPassword === '' || form.confNewPassword === '') {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Udfyld de obligatoriske felter.";
    }
   else if(this.passwordError == true || this.newPasswordError == true) {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Password length should be minimum "+this.passwordLimit + " characters";
    } else if(form.newPassword != form.confNewPassword) {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Passwords do not match";
    } else {
      const formData = new FormData();
      formData.append('email', JSON.parse(localStorage.getItem("data")).email);
      formData.append('password', form.newPassword);
      formData.append('token', JSON.parse(localStorage.getItem("data")).token);
      console.log("here change password: ", JSON.parse(localStorage.getItem("data")));
      this.http.post(this.url.APP_URL + 'passwordReset', formData)
      .subscribe((registered: Response) => {
        const response = registered.json();
        if(response.status == "success") {
          this.passwordMismatchError = false;
          this.passwordChangeStatus = true;
          var userType = JSON.parse(localStorage.getItem("data")).accountType;
          // if(userType == "admin") {
          //   this.auth.saveLocalTokens(response.data.userId, response.data.email, response.token, "admin",
          //   response.data.firstLogin, response.data.mobilPlanId, response.data.passwordChanged,"admin",response.data.name,"","");
          // } if(userType == "user") {
          //   this.auth.saveLocalTokens(response.data.userId, response.data.email, response.token, "user",
          //   response.data.firstLogin, response.data.mobilPlanId, response.data.passwordChanged,"user",response.data.name,response.installers,"");
          // }

          this.passwordChangedText = response.message;
          var _this=this;
          setTimeout(function(){
             localStorage.clear();
             _this.router.navigate(['/login'])
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

  passwordChange(value) {
    if (value == "") {
    } else {
      if (value.length < this.passwordLimit) {
        this.passwordError = true;
      } else {
        this.passwordError = false;
      }
    }
  }

  passwordChange1(value) {
    if (value == "") {
    } else {
      if (value.length < this.passwordLimit) {
        this.newPasswordError = true;
      } else {
        this.newPasswordError = false;
      }
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
