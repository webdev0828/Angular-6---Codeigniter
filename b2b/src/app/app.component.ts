import {Component} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {AuthService} from './providers/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'b2b';
  public href: string = "";
  uType = ""
  onBehalf = ""
  currentUrl = ""

  constructor(private location: Location, private router: Router, public auth: AuthService) {
    this.currentUrl = location.path();

    if (auth.getLocalTokens() == null) {
      this.auth.loggedIn = false;
      this.router.navigate(['/' + this.currentUrl]);
      //   this.router.navigate(['/login']);
    } else {
      this.uType = JSON.parse(localStorage.getItem('data')).accountType;
      this.onBehalf = JSON.parse(localStorage.getItem("data")).onBehalf;
      this.auth.loggedIn = true;

      if (this.auth.getGrantTokens() == null) {
        if (this.uType == "admin" && this.onBehalf == "admin") {
          this.router.navigate(['/' + this.currentUrl]);
        } else if (this.uType == "user" && this.onBehalf == "user")
          this.router.navigate(['/' + this.currentUrl]);
        else {
          //this.router.navigate(['/orderlist']);
        }
      } else {
        this.router.navigate(['/' + this.currentUrl]);
      }
    }
  }

  ngOnInit() {
    this.href = this.location.path().substr(1);
  }
}
