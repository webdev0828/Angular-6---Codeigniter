import { Component, OnInit } from '@angular/core';
import { AuthService } from '../providers/auth.service';
import { Router } from '@angular/router';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { UrlService } from '../providers/url.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  uType=""
  employees = []
  constructor(private auth: AuthService, private router: Router, private http: Http, private url: UrlService,
    private spinner: NgxSpinnerService) {
      if (auth.getLocalTokens() != null) {
        this.uType = JSON.parse(localStorage.getItem("data")).accountType;
      }
      if (auth.loggedIn && this.uType == "admin") {
        var passwordChanged = JSON.parse(localStorage.getItem("data")).passwordChanged;
        if (passwordChanged == "no") {
          this.router.navigate(['/changepassword']);
        }
      } else {
        this.router.navigate(['/login']);
      }
  }

  ngOnInit() {
    this.spinner.show()
    this.http.get(this.url.SOLFILM_URL + "savedEmployees")
    .subscribe((data: Response) => {
      this.spinner.hide();
      const res = data.json();
      if (res.status == "success") {
        this.spinner.hide()
        this.employees = res.data;
        this.employees.sort(function(x,y){
          var a = String(x.firstname).toUpperCase();
          var b = String(y.firstname).toUpperCase();
          if (a > b)
             return 1
          if (a < b)
             return -1
          return 0;
        });
      }
    })
  }

  addEmployee(value) {
    console.log("here comes add employee: ", value);
    var splitValue = value.split("_");
    var empId = splitValue[0]
    var email = splitValue[1]
    var fname = splitValue[2]
    var lname = splitValue[3]
    const formData = new FormData();
    formData.append('status', "add");
    formData.append('empId', empId);
    formData.append('email', email);
    formData.append('fname', fname);
    formData.append('lname', lname);

    this.http.post(this.url.APP_URL + "addEmployee",formData)
    .subscribe((data : Response) => {
      const response = data.json();
      if(response.status == "success") {
        this.employees = []
        this.employees = response.data;
      }
    })
  }
  removeEmployee(value) {
    var splitValue = value.split("_");
    var empId = splitValue[0]
    var email = splitValue[1]
    const formData = new FormData();
    formData.append('status', "remove");
    formData.append('empId', empId);
    formData.append('email', email);
    formData.append('fname', "");
    formData.append('lname', "");
    this.http.post(this.url.APP_URL + "addEmployee",formData)
    .subscribe((data : Response) => {
      const response = data.json();
      if(response.status == "success") {
        this.employees = []
        this.employees = response.data;
      }
    })
  }

}
