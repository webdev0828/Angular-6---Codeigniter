import { Component, OnInit } from '@angular/core';
import { AuthService } from '../providers/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { UrlService } from '../providers/url.service';
import { ApiService } from '../providers/api.service';
import * as moment from 'moment';
@Component({
  selector: 'app-forget',
  templateUrl: './forget.component.html',
  styleUrls: ['./forget.component.css']
})
export class ForgetComponent implements OnInit {

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
  userEmail;
  emailErrorDiv=false;
  emailErrorMessage=""
  token
  showForm=true;
  constructor(private auth : AuthService, private router : Router,private url : UrlService, private http : Http,
    private route : ActivatedRoute) {

      this.route.params.subscribe( params => {
        this.userEmail = params.id;
        this.token = params.id1;
      });

  }

  ngOnInit() {
    const formData = new FormData();
    formData.set("email",this.userEmail)
    formData.set("token",this.token)
    this.http.post(this.url.APP_URL+"checkEmail",formData)
    .subscribe((registered: Response) => {
      const response = registered.json();
      if(response.status == "failed") {
        this.emailErrorDiv = true;
        this.emailErrorMessage = "Email does not exist"

      } else {
        var data = response.data;

        if(data.passwordReset == 'yes'){
          this.showForm=false;
          this.emailErrorDiv = true;
          this.emailErrorMessage = "Password Link expired";

        }

        if(data.passwordResetToken == ''){
          this.showForm=false;
          this.emailErrorDiv = true;
          this.emailErrorMessage = "Password Link expired";
        }

        var now     = new Date();
        var year2    = now.getFullYear();
        var month2 : any  = now.getMonth()+1;
        var day2 : any    = now.getDate();
        var hour2 : any    = now.getHours();
        var minute2 : any = now.getMinutes();

        if(month2.toString().length == 1) {
             month2 = '0'+month2;
        }
        if(day2.toString().length == 1) {
             day2 = '0'+day2;
        }
        if(hour2.toString().length == 1) {
             hour2 = '0'+hour2;
        }
        if(minute2.toString().length == 1) {
             minute2 = '0'+minute2;
        }

        var dateTime = year2+'-'+month2+'-'+day2+'T'+hour2+':'+minute2;

        var resetDate = data.passwordResetDate
        var dateCurr = moment(dateTime);//now
        var dateNew = moment(resetDate);
        var hrsDiff=dateCurr.diff(dateNew, 'hours');

        if(hrsDiff > 3){
          this.showForm=false;
          this.emailErrorDiv = true;
          this.emailErrorMessage = "Password Link expired";
        }
      }
    });
  }

  ResetPassword(form : any) {
    this.passwordChanged = false;
    this.passwordMismatchError=false;
    this.passwordChangeStatus=false;

    if(form.newPassword === '' || form.confNewPassword === '') {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Udfyld de obligatoriske felter.";

    } else if(this.passwordError == true || this.newPasswordError == true) {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Minimum password length should be atleast 6 characters.";

    } else if(form.newPassword != form.confNewPassword) {
      this.passwordMismatchError = true;
      this.passwordErrortext = "";
      this.passwordErrortext = "Passwords do not match";

    } else {
      const formData = new FormData();
      formData.append('email', this.userEmail);
      formData.append('password', form.newPassword);
      formData.append('token', this.token);
      this.http.post(this.url.APP_URL + 'passwordForget', formData)
      .subscribe((registered: Response) => {
        const response = registered.json();
        if(response.status == "success") {
          this.passwordMismatchError = false;
          this.passwordChangeStatus = true;

          this.passwordChangedText = "Password reset successful. Login now with new password";
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
      if (value.length < 6) {
        this.passwordError = true;
      } else {
        this.passwordError = false;
      }
    }
  }

  passwordChange1(value) {
    if (value == "") {
    } else {
      if (value.length < 6) {
        this.newPasswordError = true;
      } else {
        this.newPasswordError = false;
      }
    }
  }
}
