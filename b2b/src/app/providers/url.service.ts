import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class UrlService {
  APP_URL = ''
  SOLFILM_URL = ''

  constructor() {
    // PRODUCTION
    //this.APP_URL = "http://booking.solfilm.dk/b2bapi/api/";
    //this.SOLFILM_URL = "http://booking.solfilm.dk/b2bapi/solfilm/";

    // STAGING
    //this.APP_URL = "http://157.230.239.45/b2bapi/api/";
    //this.SOLFILM_URL = "http://157.230.239.45/b2bapi/solfilm/";

    // DEVELOPMENT
    this.APP_URL = 'http://booking.angular.com/b2bapi/api/'
    this.SOLFILM_URL = 'http://booking.angular.com/b2bapi/solfilm/'
  }
}
