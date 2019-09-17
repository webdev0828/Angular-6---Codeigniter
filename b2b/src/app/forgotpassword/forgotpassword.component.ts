import { Component, OnInit } from '@angular/core';
import { AuthService } from '../providers/auth.service';
import { Router } from '@angular/router';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { UrlService } from '../providers/url.service';
import { ApiService } from '../providers/api.service';


@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotpasswordComponent implements OnInit {
  email;
  emailErrorDiv=false;
  emailErrorMessage = ""
  emailSuccess=false;
  successMessageText = ""
  emailError=false;
  constructor(private api: ApiService,private router : Router,private url : UrlService, private http : Http) { }

  ngOnInit() {

  }

  changePassword(form : any) {
    console.log("here email: ", form)
    if(form.email != "") {
      this.emailErrorDiv = false;
      this.emailSuccess=false;
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
      const formData = new FormData();
      formData.set("email",form.email)
      formData.set("date",dateTime)
      this.http.post(this.url.APP_URL+"forgetPassword",formData)
      .subscribe((registered: Response) => {
        const response = registered.json();
        console.log("here response: ", response)
        if(response.status == "success") {
          this.emailSuccess = true;
          this.successMessageText = "Email sent Successfully"
          var _this=this;
          setTimeout(function(){
            _this.router.navigate(['/login'])
          }, 2000);
        } else {
          this.emailErrorDiv = true;
          this.emailErrorMessage = "The email address is unknown in our records."
        }
      });
    }

  }

  validateEmail(email) {
    console.log("button clicked: ", email);
    if (email == "") {
      this.emailError = false;
    } else {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (re.test(String(email).toLowerCase()) == false) {
        this.emailError = true;

      } else {
        this.emailError = false;
      }
    }
  }

}
