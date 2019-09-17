import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedIn = false;
  constructor() { }

  //TOKEN
  getAuthToken() {
    let token = localStorage.getItem('token');
    return token;
  }

  saveLocalTokens(userId, email, token, accountType, firstLogin, mobilPlanId, passwordChanged, onBehalf, name, installers, orderedBy, customerId) {
    let data = {
      "userId": userId,
      "token": token,
      "accountType": accountType,
      "firstLogin": firstLogin,
      "mobilPlanId": mobilPlanId,
      "email": email,
      "passwordChanged": passwordChanged,
      "onBehalf": onBehalf,
      "name": name,
      "installers":installers,
      "orderedBy":orderedBy,
      "customerId" : customerId
    };

    console.log("saveLocalTokens", data);
    localStorage.setItem('data', JSON.stringify(data));
  }
  saveGrantAccessToAutoAdmin(userId, name, email, token, passwordChanged, mobilPlanId, installers, customerId) {
    let data_simulate = {
      "userId": userId,
      "loggedInAs": "admin",
      "account": "user",
      "name": name,
      "email": email,
      "token": token,
      "accountType": "auto_admin",
      "passwordChanged": passwordChanged,
      "mobilPlanId" : mobilPlanId,
      "installers" : installers,
      "customerId" : customerId
    }

    console.log("saveGrantAccessToAdmin", data_simulate);
    localStorage.setItem('simulate', JSON.stringify(data_simulate));
  }
  getGrantTokens() {
    return JSON.parse(localStorage.getItem('simulate'));
  }

  clearGrantTokens() {
    return localStorage.removeItem("simulate");
  }

  getLocalTokens() {
    return JSON.parse(localStorage.getItem('data'));
  }

  clearLocalTokens() {
    this.loggedIn = false;
    return localStorage.clear();
  }

  savePage(page) {
    var p = {
      "page" : page
    }
    localStorage.setItem('page', JSON.stringify(p));
  }
}
