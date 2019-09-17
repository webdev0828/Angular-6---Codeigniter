import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  Inject,
} from '@angular/core'
import { AuthService } from '../providers/auth.service'
import { Router } from '@angular/router'
import { Http, Headers, Response, RequestOptions } from '@angular/http'
import { UrlService } from '../providers/url.service'
import { NgxSpinnerService } from 'ngx-spinner'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog'

declare var $: any

@Component({
  selector: 'app-useradmin',
  templateUrl: './useradmin.component.html',
  styleUrls: ['./useradmin.component.css'],
})
export class UseradminComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) Sort: MatSort
  uType = ''
  autoDealers = []
  alertText = ''
  alertShow = false
  alertShowDeactive = false
  alertTextDeactive = ''
  allEmployees = []
  employees = []
  all = false
  assignedEmployees = false
  noAssigned = false
  assignedText = ''
  assignedEmployee = false
  customerId = ''
  customerEmail = ''
  noAssignedText = ''
  customerName = ''
  loginError = false
  loginErrorText = ''
  users = []
  assigned_installer: any
  tableDisplayedColumns: string[] = [
    'name',
    'email',
    'status',
    'active',
    'login',
  ]
  tableDataSource = new MatTableDataSource<mobilPlanCustomerContact>()
  autoDealerSelection = ''

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: Http,
    private url: UrlService,
    private spinner: NgxSpinnerService,
    public userActiveDialog: MatDialog,
  ) {
    if (auth.getLocalTokens() != null) {
      this.uType = JSON.parse(localStorage.getItem('data')).accountType
    }
    if (auth.loggedIn && this.uType == 'admin') {
      var passwordChanged = JSON.parse(localStorage.getItem('data'))
        .passwordChanged
      if (passwordChanged == 'no') {
        this.router.navigate(['/changepassword'])
      }
    } else {
      this.router.navigate(['/login'])
    }
  }

  ngOnInit() {
    // initially, we fetch customers
    this.spinner.show()
    this.http
      .get(this.url.SOLFILM_URL + 'customers')
      .subscribe((data: Response) => {
        this.spinner.hide()
        const response = data.json()
        if (response.status == 'success') {
          let dealers = response.data
          dealers.map(dealer => {
            if (!(dealer.name == null || dealer.name == '')) {
              this.autoDealers.push(dealer)
            }
          })

          this.autoDealers.sort(function(x, y) {
            var a = String(x.name).toUpperCase()
            var b = String(y.name).toUpperCase()
            if (a > b) return 1
            if (a < b) return -1
            return 0
          })

          var singleRecord = this.autoDealers[0]
          var record =
            singleRecord.id + '_' + singleRecord.email + '_' + singleRecord.name
          this.assigned_installer = record
          this.http
            .get(this.url.APP_URL + 'SavedEmployees')
            .subscribe((data: Response) => {
              this.all = false
              this.assignedEmployees = true
              const res = data.json()
              if (res.status == 'success') {
                this.allEmployees = res.data
                this.allEmployees.reverse()
              }
            })
        }
      })
  }

  ngAfterViewInit() {}

  ngAfterViewChecked() {}

  openUserActiveDialog(data) {
    let value: string
    let caption: string

    if (data.already == 'no' && data.status == 'disable') {
      value = 'active_' + data.email + '_' + data.id + '_' + data.name
      caption =
        'Ønsker du at give ' +
        data.name +
        ' adgang og automatisk sende velkomst mail til ' +
        data.email +
        '?'
    }

    if (data.already == 'yes' && data.status == 'disable') {
      value = 'active_' + data.email + '_' + data.id + '_' + data.name
      // do you wish to activate this user?
      caption = 'Ønsker du at give ' + data.name + ' adgang?'
    }

    if (data.already == 'yes' && data.status == 'active') {
      value = 'disable_' + data.email + '_' + data.id + '_' + data.name
      caption = 'Ønsker du at fjerne adgangen for ' + data.name + '?'
    }

    const dialogRef = this.userActiveDialog.open(UserActiveDialog, {
      width: '350px',
      data: {
        buttonSelection: '',
        caption: caption,
      },
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result.buttonSelection == 'yes') {
        this.grantAccess(value, data)
      } else {
        data.is_actived = data.is_actived
      }
    })
  }

  grantAccess(value, data) {
    console.log('grantAccess ' + value, data)
    this.alertShow = false
    this.alertShowDeactive = false
    this.loginError = false
    this.alertText = ''
    const checkValue = value.split('_')
    const email = checkValue[1]
    const status = checkValue[0]
    const mobilPlanId = checkValue[2]
    const name = checkValue[3]

    console.log('grantAccess: ', status, email, mobilPlanId, name)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('status', status)
    formData.append('mobilPlanId', mobilPlanId)
    formData.append('name', name)
    formData.append('customerId', data.ref_id)
    console.log('ref_id (customerId): ', data.ref_id)

    this.spinner.show()
    this.http
      .post(this.url.APP_URL + 'addUser', formData)
      .subscribe((statusChanged: Response) => {
        const response = statusChanged.json()
        if (response.status == 'success') {
          if (response.type == 'active') {
            this.alertShow = true
            this.alertShowDeactive = false
            this.alertText = response.data
          }

          if (response.type == 'disable') {
            this.alertShow = false
            this.alertShowDeactive = true
            this.alertTextDeactive = response.data
          }

          var _this = this
          setTimeout(function() {
            _this.alertShow = false
          }, 4000)

          // re-fetch users by calling getUsersAndAssignedInstallers
          this.http
            .get(this.url.SOLFILM_URL + 'customers')
            .subscribe((data: Response) => {
              const response = data.json()
              if (response.status == 'success') {
                this.getUsersAndAssignedInstallers(this.autoDealerSelection)
              }
            })
        }
      })
  }

  getUsersAndAssignedInstallers(value) {
    // if nothing selected we do not show assigned employees
    console.log('getUsersAndAssignedInstallers ' + value)
    this.spinner.show()
    this.assignedEmployees = false

    if (value == '') {
      this.noAssigned = false
      this.all = true
      this.employees = []
      this.employees = this.allEmployees
    } else {
      // assign selected customer details to field scoped variable
      this.autoDealerSelection = value
      var tempArray = value.split('_')
      this.customerId = tempArray[0]
      this.customerName = tempArray[2]
      this.customerEmail = tempArray[1]

      this.all = false
      this.assignedEmployee = false
      this.assignedText = ''
      this.noAssigned = false

      var params = '?customerId=' + this.customerId

      this.http
        .get(this.url.APP_URL + 'usersAndAssignedEmployees' + params)
        .subscribe((data: Response) => {
          const res = data.json()
          this.spinner.hide()
          if (res.status == 'success') {
            this.all = false
            this.noAssigned = false
            this.assignedEmployees = true
            this.employees = res.employeeList

            console.log('employees' + this.employees)
            this.users = res.userList
            console.log('users' + res.userList)

            // sort customers by name
            this.users.sort(function(x, y) {
              var a = String(x.name).toUpperCase()
              var b = String(y.name).toUpperCase()
              if (a > b) return 1
              if (a < b) return -1
              return 0
            })

            // sort employees by name
            this.employees.sort(function(x, y) {
              var a = String(x.firstname).toUpperCase()
              var b = String(y.firstname).toUpperCase()
              if (a > b) return 1
              if (a < b) return -1
              return 0
            })
          }

          if (res.status == 'failed') {
            this.noAssigned = true
            this.noAssignedText = ''
            this.noAssignedText =
              'Der ikke tildelt en medarbejder til autoforhandleren.'

            this.all = true
            this.assignedEmployees = false
            this.employees = []

            var _this = this
            setTimeout(function() {
              _this.noAssigned = false
            }, 4000)
          }

          let elementData: mobilPlanCustomerContact[] = []
          console.log('here comes from admin table: ', this.users)
          this.users.map((item, index) => {
            // console.log("here is items of customers", item, index);
            let is_actived: boolean

            if (item.already == 'no' && item.status == 'disable') {
              is_actived = false
            }

            if (item.already == 'yes' && item.status == 'disable') {
              is_actived = false
            }

            if (item.already == 'yes' && item.status == 'active') {
              is_actived = true
            }

            let tempElement: mobilPlanCustomerContact = {
              already: item.already,
              contact_type: item.contact_type ? item.contact_type : '',
              created_by: item.created_by ? item.created_by : '',
              created_on: item.created_on ? item.created_on : '',
              customer_id: item.customer_id ? item.customer_id : '',
              deleted: item.deleted ? item.deleted : '',
              deleted_by: item.deleted_by ? item.deleted_by : '',
              deleted_on: item.deleted_on ? item.deleted_on : '',
              email: item.email ? item.email : '',
              id: item.id ? item.id : '',
              name: item.name ? item.name : '',
              notes: item.notes ? item.notes : '',
              occupation: item.occupation ? item.occupation : '',
              phone: item.phone ? item.phone : '',
              ref_id: item.ref_id ? item.ref_id : '',
              sort_on: item.sort_on ? item.sort_on : '',
              status: item.status ? item.status : '',
              updated_by: item.updated_by ? item.updated_by : '',
              updated_on: item.updated_on ? item.updated_on : '',
              is_actived: is_actived,
            }
            elementData.push(tempElement)
          })

          this.tableDataSource = new MatTableDataSource<
            mobilPlanCustomerContact
          >(elementData)

          this.tableDataSource.paginator = this.paginator
          this.tableDataSource.sort = this.Sort
        })
    }
  }

  assignEmployee(value, employee) {
    this.assignedEmployee = false
    this.noAssigned = false
    this.all = false
    if (this.customerId != '') {
      var assignValue = value.split('_')
      var status = assignValue[0]
      var employeeId = assignValue[1]
      var empName = employee.firstname + ' ' + employee.lastname

      const formData = new FormData()
      formData.append('status', status)
      formData.append('mobilPlanId', employeeId)
      formData.append('customerId', this.customerId)
      formData.append('email', this.customerEmail)
      formData.append('empName', empName)
      formData.append('cName', this.customerName)
      this.http
        .post(this.url.APP_URL + 'assignEmployee', formData)
        .subscribe((data: Response) => {
          const response = data.json()
          this.employees = []
          if (response.status == 'success') {
            this.employees = response.data
            this.assignedEmployees = true
            this.all = false
            this.assignedEmployee = true
            this.assignedText = response.message

            var _this = this
            setTimeout(function() {
              _this.assignedEmployee = false
            }, 4000)
          } else {
            this.noAssigned = true
            this.all = true
            this.assignedEmployees = false
            this.employees = []
            this.employees = this.allEmployees
            this.noAssignedText = ''
            this.noAssignedText =
              'Brugeren har ikke rettigheder til at logge ind.'
            var _this = this
            setTimeout(function() {
              _this.noAssigned = false
            }, 4000)
          }
        })
    } else {
      this.noAssigned = true
      this.employees = []
      this.employees = this.allEmployees
      this.noAssignedText = ''
      this.noAssignedText = 'Vælg venligst en medarbejder først.'
      var _this = this
      setTimeout(function() {
        _this.noAssigned = false
      }, 4000)
    }
  }

  loginAsAutoDealer(userEmail, element) {
    console.log('loginAsAutoDealer: ', userEmail, element)
    this.loginError = false
    this.loginErrorText = ''
    const formData = new FormData()
    formData.append('email', userEmail)

    this.http
      .post(this.url.APP_URL + 'simulateUser', formData)
      .subscribe((data: Response) => {
        const response = data.json()

        if (response.status == 'success') {
          console.log('simulate success with data ', response.user)

          this.auth.saveGrantAccessToAutoAdmin(
            response.user.userId,
            response.user.name,
            response.user.email,
            response.token,
            response.user.passwordChanged,
            response.user.mobilPlanId,
            response.installers,
            response.user.customerId,
          )
          this.router.navigate(['/'])
        }

        if (response.status == 'failed') {
          this.loginError = true
          this.loginErrorText = response.data

          var _this = this

          setTimeout(function() {
            _this.loginError = false
          }, 4000)
        }
      })
  }
}

export interface mobilPlanCustomerContact {
  already: string
  contact_type: string
  created_by: number
  created_on: Date
  customer_id: number
  deleted: number
  deleted_by: number
  deleted_on: Date
  email: string
  id: number
  name: string
  notes: string
  occupation: string
  phone: string
  ref_id: number
  sort_on: number
  status: string
  updated_by: number
  updated_on: Date
  is_actived: boolean
}

export interface UserActiveDialogData {
  buttonSelection: string
  caption: string
}

@Component({
  selector: 'user-active-dialog',
  templateUrl: 'user-active-dialog.html',
})
export class UserActiveDialog {
  constructor(
    public dialogRef: MatDialogRef<UserActiveDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UserActiveDialogData,
  ) {}

  yesButtonHandler() {
    this.data.buttonSelection = 'yes'
    this.dialogRef.close(this.data)
  }

  cancelButtonHandler() {
    this.data.buttonSelection = 'no'
    this.dialogRef.close(this.data)
  }
}
