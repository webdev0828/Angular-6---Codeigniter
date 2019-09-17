import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/providers/auth.service';
import {Http, Response} from "@angular/http";
import {UrlService} from "../../providers/url.service";
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public href: string = "";
  uType = ""
  user = false;
  admin = false;
  auto_admin = false;
  name = "";
  autoDealerName;
  customerId;

  @Input('active') active: string;
  constructor(private location: Location, private router : Router, public auth : AuthService,  private url: UrlService,
              private http: Http) {
  }

  ngOnInit() {
    this.href = this.location.path().substr(1);
    if(this.auth.getLocalTokens() != null && this.auth.getGrantTokens() == null){
      this.uType = JSON.parse(localStorage.getItem("data")).accountType;
      this.name = JSON.parse(localStorage.getItem("data")).name;
      this.customerId = JSON.parse(localStorage.getItem("data")).customerId;

      if(this.auth.loggedIn){
        if(this.uType == "admin") {
          this.admin = true;

        }else { //a regular user
          this.user = true;
        }
      }
    }

    if(this.auth.getGrantTokens() != null) {
      this.uType = JSON.parse(localStorage.getItem("simulate")).accountType;
      this.name = JSON.parse(localStorage.getItem("simulate")).name;
      this.customerId = JSON.parse(localStorage.getItem("simulate")).customerId;

      if (this.customerId !== '0'){
        this.setAutoDealerNameByCustomerId();
      }

      this.admin = false
      this.auto_admin = true;
    }
  }

  setAutoDealerNameByCustomerId(){
    console.log("setAutoDealerNameByCustomerId() ", this.customerId)

    var params = "?customerId=" + this.customerId;
    this.http
      .get(this.url.SOLFILM_URL + "customer/" + params)
      .subscribe((data: Response) => {
        const res = data.json();
        const temp = JSON.parse(res.data);
        this.autoDealerName = temp[0].name;
      });
  }

  logout() {
    this.user = false;
    this.admin= false;
    localStorage.clear()
    this.auth.loggedIn = false
    this.auth.clearLocalTokens();
    this.router.navigate(['/login'])
  }
  logoutAs() {
    this.admin = true;
    this.user = false;
    this.auto_admin = false;
    this.auth.clearGrantTokens();
    this.router.navigate(['/admin'])
  }

  gotoPage(value) {
    this.auth.savePage(value)
    this.router.navigate(['/order'])
  }
}
