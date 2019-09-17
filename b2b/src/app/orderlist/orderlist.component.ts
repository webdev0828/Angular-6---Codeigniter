import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  Inject,
  ChangeDetectorRef,
} from '@angular/core'
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap'
import { Router } from '@angular/router'
import { AuthService } from '../providers/auth.service'
import { UrlService } from '../providers/url.service'
import { Http, Response } from '@angular/http'
import { NgxSpinnerService } from 'ngx-spinner'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog'
import { catchError } from 'rxjs/operators'

declare var $: any

@Component({
  selector: 'app-orderlist',
  templateUrl: './orderlist.component.html',
  styleUrls: ['./orderlist.component.css'],
})
export class OrderlistComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) sort: MatSort
  closeResult: string
  uType = ''
  onBehalf = ''
  orderedBy
  userId
  mobilPlanId
  orderList = []
  cancellationMessageValue
  price = 0
  cancelOrder
  customerId

  errorMessage = false
  errorText = ''
  currentDate: any
  threshold = 0
  calloutFee = 0
  cancellationFee = 0
  noRecord = false
  selectedOrderID
  selectedOrderSummary
  orderBy = [0, 0, 0, 0]
  tableDisplayedColumns: string[] = [
    'scheduledTimeDisplayFriendly',
    'requisitionNumber',
    'makeAndModel',
    'price',
    'status',
    'action',
  ]
  tableDataSource = new MatTableDataSource<OrderTableElement>()

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private auth: AuthService,
    private url: UrlService,
    private http: Http,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
  ) {
    if (auth.getLocalTokens() != null) {
      this.uType = JSON.parse(localStorage.getItem('data')).accountType
      this.onBehalf = JSON.parse(localStorage.getItem('data')).onBehalf
      this.orderedBy = JSON.parse(localStorage.getItem('data')).name
      this.customerId = JSON.parse(localStorage.getItem('data')).customerId

      console.log(
        'HasLocalToken: ' + this.uType,
        this.onBehalf,
        this.orderedBy,
        this.customerId,
      )
    }

    if (auth.loggedIn && this.uType == 'user' && this.onBehalf == 'user') {
      var passwordChanged = JSON.parse(localStorage.getItem('data'))
        .passwordChanged

      this.userId = JSON.parse(localStorage.getItem('data')).userId
      this.mobilPlanId = JSON.parse(localStorage.getItem('data')).mobilPlanId
      this.orderedBy = JSON.parse(localStorage.getItem('data')).name
      this.customerId = JSON.parse(localStorage.getItem('data')).customerId

      if (passwordChanged == 'no') {
        this.router.navigate(['/changepassword'])
      }
    } else if (auth.getGrantTokens() != null) {
      console.log('Has grant tokens')
      this.userId = JSON.parse(localStorage.getItem('simulate')).userId
      this.orderedBy = JSON.parse(localStorage.getItem('simulate')).name
      this.customerId = JSON.parse(localStorage.getItem('simulate')).customerId
    } else {
      this.router.navigate(['/login'])
    }

    var params = '?customerId=' + this.customerId

    this.http
      .get(this.url.SOLFILM_URL + 'orders/' + params)
      .pipe(catchError(err => this.router.navigateByUrl('/')))
      .subscribe((data: Response) => {
        const d = data.json()
        if (d.status === 'success') {
          this.orderList = JSON.parse(d.data)
          console.log('here comes from orders request: ', this.orderList)
          this.noRecord = false

          if (this.orderList.length == 0) {
            this.noRecord = true
            this.spinner.hide()
          }
        } else {
          this.noRecord = true
        }

        let orderTableElement = this.mapOrderListToOrderTableElements(
          this.orderList,
        )
        this.tableDataSource = new MatTableDataSource<OrderTableElement>(
          orderTableElement,
        )
        this.tableDataSource.paginator = this.paginator
        this.tableDataSource.sort = this.sort

        this.spinner.hide()
      })
  }

  openDialog($event, tableElement) {
    $event.preventDefault()
    this.cancellationMessageValue = ''
    this.cancelOrder = tableElement
    this.selectedOrderID = tableElement.orderId
    const dialogRef = this.dialog.open(OrderCancelDialog, {
      width: '400px',
      height: '200px',
      data: {
        makeModelYear: tableElement.makeAndModel,
        buttonSelect: '',
      },
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result.buttonSelect == 'yes') {
        this.sendCancelNotes()
      } else {
        console.log('no button clicked')
      }
    })
  }

  ngOnInit() {
    this.currentDate = new Date()
    var dd: any = this.currentDate.getDate()
    var mm: any = this.currentDate.getMonth() + 1 //January is 0!
    var yyyy = this.currentDate.getFullYear()

    if (dd < 10) {
      dd = '0' + dd
    }

    if (mm < 10) {
      mm = '0' + mm
    }

    this.currentDate = yyyy + '-' + mm + '-' + dd
    this.spinner.show()
    this.threshold = 100
    this.calloutFee = 100
    this.cancellationFee = 100
  }

  sortTable(idx) {
    if (idx == 0) {
      this.tableSortByTime()
    }
    if (idx == 1) {
      this.tableSortByRequisition()
    }
    if (idx == 2) {
      this.tableSortMake()
    }
    if (idx == 3) {
      this.tableSortPrice()
    }
  }

  tableSortByTime() {
    this.ngZone.run(() => {
      for (let i = 0; i <= this.orderList.length; i++) {
        for (let j = i + 1; j <= this.orderList.length - 1; j++) {
          let temp
          if (this.orderBy[0] === 0) {
            if (
              this.orderList[i].scheduledTime > this.orderList[j].scheduledTime
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          } else {
            if (
              this.orderList[i].scheduledTime < this.orderList[j].scheduledTime
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          }
        }
      }
      this.orderBy[0] = (this.orderBy[0] + 1) % 2
    })
  }

  tableSortByRequisition() {
    this.ngZone.run(() => {
      for (let i = 0; i <= this.orderList.length; i++) {
        for (let j = i + 1; j <= this.orderList.length - 1; j++) {
          let temp
          if (this.orderBy[1] === 0) {
            if (
              this.orderList[i].requisitionNumber >
              this.orderList[j].requisitionNumber
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          } else {
            if (
              this.orderList[i].requisitionNumber <
              this.orderList[j].requisitionNumber
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          }
        }
      }
      this.orderBy[1] = (this.orderBy[1] + 1) % 2
    })
  }

  tableSortMake() {
    this.ngZone.run(() => {
      for (let i = 0; i <= this.orderList.length; i++) {
        for (let j = i + 1; j <= this.orderList.length - 1; j++) {
          let temp
          if (this.orderBy[2] === 0) {
            if (
              this.orderList[i].makeAndModel > this.orderList[j].makeAndModel
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          } else {
            if (
              this.orderList[i].makeAndModel < this.orderList[j].makeAndModel
            ) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          }
        }
      }
      this.orderBy[2] = (this.orderBy[2] + 1) % 2
    })
  }

  tableSortPrice() {
    this.ngZone.run(() => {
      for (let i = 0; i <= this.orderList.length; i++) {
        for (let j = i + 1; j <= this.orderList.length - 1; j++) {
          let temp
          if (this.orderBy[3] === 0) {
            if (this.orderList[i].price > this.orderList[j].price) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          } else {
            if (this.orderList[i].price < this.orderList[j].price) {
              temp = this.orderList[j]
              this.orderList[j] = this.orderList[i]
              this.orderList[i] = temp
            }
          }
        }
      }
      this.orderBy[3] = (this.orderBy[3] + 1) % 2
    })
  }

  open(order, content) {
    this.cancellationMessageValue = ''
    this.cancelOrder = order
    this.selectedOrderID = order.orderId

    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`
        },
      )
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC'
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop'
    } else {
      return `with: ${reason}`
    }
  }

  sendCancelNotes() {
    const formData = new FormData()
    formData.append('orderId', this.selectedOrderID)
    this.http
      .post(this.url.APP_URL + 'cancelOrder', formData)
      .subscribe((data: Response) => {
        const d = data.json()
        if (d.status == 'success') {
          this.spinner.show()
          var params = '?customerId=' + this.customerId
          this.http
            .get(this.url.SOLFILM_URL + 'orders/' + params)
            .subscribe((data: Response) => {
              const d = data.json()
              this.ngZone.run(() => {
                if (d.status == 'success') {
                  this.orderList = JSON.parse(d.data)
                  let orderTableElement = this.mapOrderListToOrderTableElements(
                    this.orderList,
                  )

                  this.tableDataSource = new MatTableDataSource<
                    OrderTableElement
                  >(orderTableElement)
                  this.tableDataSource.paginator = this.paginator
                  this.tableDataSource.sort = this.sort
                  this.spinner.hide()
                  this.noRecord = false
                  if (this.orderList.length == 0) {
                    this.noRecord = true
                    this.spinner.hide()
                  }
                } else {
                  this.noRecord = true
                  this.spinner.hide()
                }
              })
            })
        }
      })
  }

  // TODO this is unneccessary because the json object can be displayed as is
  private mapOrderListToOrderTableElements(orderList: any[]) {
    let orderTableElement: OrderTableElement[] = []
    this.orderList.map((item, index) => {
      let tempOrderTableElement: OrderTableElement = {
        customerId: item.customerId,
        makeAndModel: item.makeAndModel,
        orderId: item.orderId,
        orderBy: item.orderBy,
        price: item.price,
        requisitionNumber: item.requisitionNumber,
        salesman: item.salesman,
        scheduledTime: item.scheduledTime,
        status: item.status,
        scheduledTimeDisplayFriendly: item.scheduledTimeDisplayFriendly,

        summaryResponse: {
          additionalComments: item.summaryResponse.additionalComments,
          cancelOrderInformation: item.summaryResponse.cancelOrderInformation,
          customMakeAndModelComment:
            item.summaryResponse.customMakeAndModelComment,
          customWindows: item.summaryResponse.customWindows,
          deliveryAddress: item.summaryResponse.deliveryAddress,
          edgeFittings: item.summaryResponse.edgeFittings,
          makeAndModels: item.summaryResponse.makeAndModels,
          paintProtections: item.summaryResponse.paintProtections,
          price: item.summaryResponse.price,
          requisitionNumber: item.summaryResponse.requisitionNumber,
          salesman: item.summaryResponse.salesman,
          scheduledTime: item.summaryResponse.scheduledTime,
          shades: item.summaryResponse.shades,
          workDuration: item.summaryResponse.workDuration,
        },
      }
      orderTableElement.push(tempOrderTableElement)
    })

    return orderTableElement
  }

  orderTableClickHandler($event, element) {
    this.selectedOrderSummary = element.summaryResponse
    this.cdRef.detectChanges()

    $event.path[1].classList.add('selected-table-cell')
    $event.preventDefault()
    this.cancellationMessageValue = ''
    this.cancelOrder = element
    this.selectedOrderID = element.orderId
    const dialogRef = this.dialog.open(OrderSummaryDialog, {
      width: '630px',
      height: '470px',
      data: {
        requisitionNumber: this.selectedOrderSummary.requisitionNumber,
        salesman: this.selectedOrderSummary.salesman,
        deliveryAddress: this.selectedOrderSummary.deliveryAddress,
        makeAndModels: this.selectedOrderSummary.makeAndModels,
        edgeFittings: this.selectedOrderSummary.edgeFittings,
        shades: this.selectedOrderSummary.shades,
        paintProtections: this.selectedOrderSummary.paintProtections,
        workDuration: this.selectedOrderSummary.workDuration,
        scheduledTime: this.selectedOrderSummary.scheduledTime,
        price: this.selectedOrderSummary.price,
      },
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result.buttonSelect == 'yes') {
        this.sendCancelNotes()
      } else {
        console.log('no button clicked')
      }
    })
  }

  showSummaryTooltip(order, $event) {
    $event.path[1].classList.add('selected-table-cell')
  }

  hideSummaryTooltip($event) {
    $event.path[1].classList.remove('selected-table-cell')
  }
}

export interface SummaryResponse {
  additionalComments: string
  cancelOrderInformation: string
  customMakeAndModelComment: string
  customWindows: Array<string>
  deliveryAddress: string
  edgeFittings: Array<string>
  makeAndModels: Array<string>
  paintProtections: Array<string>
  price: string
  requisitionNumber: string
  salesman: string
  scheduledTime: Date
  shades: Array<string>
  workDuration: number
}

export interface OrderTableElement {
  customerId: number
  makeAndModel: string
  orderId: number
  orderBy: string
  price: string
  requisitionNumber: string
  salesman: string
  scheduledTime: Date
  status: string
  scheduledTimeDisplayFriendly: Date
  summaryResponse: SummaryResponse
}

export interface DialogData {
  makeModelYear: string
  buttonSelect: string
}

export interface SummaryData {
  requisitionNumber: string
  salesman: string
  deliveryAddress: string
  makeAndModels: string
  edgeFittings: string
  shades: string
  paintProtections: string
  workDuration: string
  scheduledTime: string
  price: string
}

@Component({
  selector: 'order-cancel-dialog',
  templateUrl: 'order-cancel-dialog.html',
  styleUrls: ['./order-cancel-dialog.css'],
})
export class OrderCancelDialog {
  constructor(
    public dialogRef: MatDialogRef<OrderCancelDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.data.buttonSelect = 'no'
    this.dialogRef.close(this.data)
  }

  onYesClick(): void {
    this.data.buttonSelect = 'yes'
    this.dialogRef.close(this.data)
  }
}

@Component({
  selector: 'order-summary-dialog',
  templateUrl: 'order-summary-dialog.html',
  styleUrls: ['./order-summary-dialog.css'],
})
export class OrderSummaryDialog {
  constructor(
    public dialogRef: MatDialogRef<OrderSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.data.buttonSelect = 'no'
    this.dialogRef.close(this.data)
  }
}
