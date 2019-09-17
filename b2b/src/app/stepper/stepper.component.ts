import {
  Component,
  OnInit,
  VERSION,
  NgZone,
  ViewChild,
  Inject,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef
} from "@angular/core";
import {NgbModal, ModalDismissReasons} from "@ng-bootstrap/ng-bootstrap";
import {AuthService} from "../providers/auth.service";
import {Router, ActivatedRoute} from "@angular/router";
import {UrlService} from "../providers/url.service";
import {Http, Headers, Response, RequestOptions} from "@angular/http";
import {NgxSpinnerService} from "ngx-spinner";
import {FormBuilder, FormGroup, Validators, FormGroupDirective, FormControl} from "@angular/forms";
import {MatStepper, MatHorizontalStepper} from "@angular/material/stepper";
import {MatTableDataSource} from "@angular/material/table";
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from "@angular/material/dialog";

declare var $: any;

@Component({
  selector: "app-stepper",
  templateUrl: "./stepper.component.html",
  styleUrls: ["./stepper.component.css"]
})
export class StepperComponent implements OnInit, AfterViewInit {
  closeResult: string;
  is_window_selected = false;
  is_paint_selected = false;
  window = false;
  uType = "";
  onBehalf = "";

  regularOrderFormGroup: FormGroup;
  stepTwoFormGroup: FormGroup;
  stepThreeFormGroup: FormGroup;
  customOrderFormGroup: FormGroup;
  private ngVersion: string = VERSION.full;

  formData = {
    language: "DA",
    year: new Date().getFullYear(),
    materialProductNumbers: [],
    requisitionNumber: "",
    additionalComments: "",
    deliveryAddress: "",
    salesmanId: "",
    customerId: "",
    weekNumber: 1,
    assignedEmployees: [],
    employeesServicingAutoDealers: [],
  };

  paintProtectionMaterialsFromMobilPlan;
  fittingMaterialsFromMobilPlan;
  shadeMaterialsFromMobilPlan;

  selectedCarProductNumber;
  selectedWindowShadow;
  selectedWindowPaint: Array<any> = [];
  selectedWindowFitting;
  customerFromMobilPlan;
  isCalendarDataReady = false;
  calendarResponse;
  scheduledTime;
  scheduledPrice;
  selectedTimeSlotId;
  makeName = "";
  modelName = "";

  summary = {
    makeAndModels: '',
    shades: [],
    edgeFittings: [],
    paintProtections: [],
    deliveryAddress: '',
    cancelOrderInformation: '',
    requisitionNumber: '',
    salesman: '',
    workDuration: '',
    scheduledTime: '',
    price: '',
    customMakeAndModelComment: '',
    additionalComments: ''
  };

  fixed = true;
  day;
  dayCalendar;
  dayCalendarTimeSlots;
  fixedTimeCalendar;
  fixedTimeCalendarTimeSlots: Array<any> = [];

  form_data = {
    make: "",
    model: "",
    year: "",
    additional_notes: "",
    window_shades: [],
    paint: [],
    comment_to_order: "",
    delivery_address: "",
    requisition_number: "",
    salesman: []
  };

  salesmen: Array<any> = [];
  makeList: Array<any> = [];
  modelsList: Array<any> = [];
  modelList: Array<any> = [];
  customerId;

  // TODO these three variables should be a single object
  salesmanName;
  salesmanEmail;
  salesmanPhone;

  mobilPlanId;
  orderedBy;

  successMessage = false;
  successText = "";
  errorMessage = false;
  errorText = "";

  weekDatesWithDate: Array<any> = [];

  assignedInstallers;
  installers: Array<any> = [];

  addForm = false;
  bookingId = "";
  projectId = "";
  orderType = "";

  isCarMakeSelected: boolean = true;
  isCarModelSelected: boolean = true;
  car_make_select: string = "";
  car_model_select: string = "";
  show_paint_or_window_check_hint: boolean = false;
  is_shade_selected: boolean = true;
  is_edge_selected: boolean = true;
  is_paint_protection_sub_check: boolean = true;
  is_order_comment_written: boolean = true;
  is_product_show: boolean = false;
  isLinear = true;
  is_visited_step_one: boolean = false;
  is_custom_order_show: boolean = false;
  is_regular_order_show: boolean = true;
  is_custom_order_window_added: boolean = true;
  selectedCustomOrderWindowPaint: Array<any> = [];

  customOrderFormData = {
    language: "DA",
    year: new Date().getFullYear(),
    model_year: "",
    weekNumber: this.getWeekNumber(),
    customWindows: [],
    make: "",
    model: "",
    additionalCommentsToModel: "",
    requisitionNumber: "",
    additionalComments: "",
    deliveryAddress: "",
    salesmanId: "",
    materialProductNumbers: [],
    customerId: "1",
    assignedEmployees: [],
    employeesServicingAutoDealers: []
  };

  custom_order_paint_data;
  custom_order_shade_data;
  custom_order_window_data;
  custom_order_salesman: Array<any> = [];
  windowTableColumns: string[] = ["window_value", "shade_value", "action"];
  windowTableElements: WindowShadeTableElement[] = [];
  windowTableDataSource = new MatTableDataSource<WindowShadeTableElement>();

  constructor(private modalService: NgbModal, private router: Router, private auth: AuthService, private url: UrlService,
              private http: Http, private spinner: NgxSpinnerService, private route: ActivatedRoute, private ngZone: NgZone,
              private _formBuilder: FormBuilder, public userActiveDialog: MatDialog, private cdRef: ChangeDetectorRef) {
    this.formData.weekNumber = this.getWeekNumber();
    this.route.params.subscribe(params => {
      this.bookingId = params.id;
      this.projectId = params.id1;
      this.orderType = params.id2;
    });

    if (this.orderType == undefined) {
      this.addForm = true;
    } else {
      this.addForm = false;
    }

    if (auth.getLocalTokens() != null) {
      this.uType = JSON.parse(localStorage.getItem("data")).accountType;
      this.onBehalf = JSON.parse(localStorage.getItem("data")).onBehalf;
      this.orderedBy = JSON.parse(localStorage.getItem("data")).orderedBy;
      this.assignedInstallers = JSON.parse(localStorage.getItem("data")).installers;
    }

    if (auth.loggedIn && this.uType == "user" && this.onBehalf == "user") {
      var passwordChanged = JSON.parse(localStorage.getItem("data")).passwordChanged;
      this.customerId = JSON.parse(localStorage.getItem("data")).customerId;
      this.mobilPlanId = JSON.parse(localStorage.getItem("data")).mobilPlanId;

      if (passwordChanged == "no") {
        this.router.navigate(["/changepassword"]);
      }

    } else if (auth.getGrantTokens() != null) {
      this.customerId = JSON.parse(localStorage.getItem("simulate")).customerId;
      this.mobilPlanId = JSON.parse(localStorage.getItem("simulate")).mobilPlanId;
      this.assignedInstallers = JSON.parse(localStorage.getItem("simulate")).installers;
      this.orderedBy = "Administrator";

    } else {
      this.router.navigate(["/login"]);
    }

    console.log("this.assignedInstallers", this.assignedInstallers);

    this.customOrderFormData.customerId = this.customerId;
    const params = "?customerId=" + this.customerId;

    //this.spinner.show();

    this.http
      .get(this.url.SOLFILM_URL + "customer/" + params)
      .subscribe((data: Response) => {
        const result = data.json();
        console.log("customer", result);
        const temp = JSON.parse(result.data);
        this.customerFromMobilPlan = temp[0];
        this.customOrderFormData.deliveryAddress =
          this.customerFromMobilPlan.address_street +
          ", " +
          this.customerFromMobilPlan.address_zip +
          " " +
          this.customerFromMobilPlan.address_city;
      });

    this.http
      .get(this.url.SOLFILM_URL + "customMaterial")
      .subscribe((data: Response) => {
        const result = data.json();
        if (result.status == "success") {
          console.log("customMaterial", result);
          this.spinner.hide();
          this.custom_order_paint_data = result.paintData;
          this.custom_order_shade_data = result.shadeData;
          this.custom_order_window_data = result.windowData;
        }
      });

    this.formData.customerId = this.customerId;
    this.http
      .get(this.url.SOLFILM_URL + "customer/" + params)
      .subscribe((data: Response) => {
        const res = data.json();
        const temp = JSON.parse(res.data);
        this.customerFromMobilPlan = temp[0];
        this.formData.deliveryAddress =
          this.customerFromMobilPlan.address_street +
          ", " +
          this.customerFromMobilPlan.address_zip +
          " " +
          this.customerFromMobilPlan.address_city;
      });

    if (this.assignedInstallers > 0) {
      this.errorMessage = false;
      this.errorText = "";

    } else {
      this.errorMessage = true;
      this.errorText = "Bemærk, at I først skal tildeles en installatør, før der kan oprettes en booking. Kontakt venligst solfilm.dk.";
    }
  }

  getWeekNumber() {
    const today = new Date();
    const pastDaysOfYear =
      Math.abs(
        new Date().getTime() - new Date(today.getFullYear(), 0, 1).getTime()
      ) / 86400000;
    return Math.ceil(
      (pastDaysOfYear + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7
    );
  }

  gotoPage(value) {
    this.auth.savePage(value);
    this.is_custom_order_show = true;
    this.is_regular_order_show = false;
    this.is_visited_step_one = false;
    this.is_window_selected = false;
    this.is_paint_selected = false;
    this.is_product_show = false;
    this.regularOrderFormGroup.reset();
  }

  goToRegularOrder() {
    this.is_custom_order_show = false;
    this.is_regular_order_show = true;
    this.is_visited_step_one = false;
    this.customOrderFormGroup.reset();
  }

  comment(value) {
    console.log("here comes comment: ", value);
    this.formData.additionalComments = value;
    this.is_order_comment_written = true;
  }

  ngOnInit() {
    this.regularOrderFormGroup = this._formBuilder.group({
      makeSelect: ["", Validators.required],
      modelSelect: ["", Validators.required],
      shadeRadio: [""],
      edgeRadio: [""],
      window_tinting_check: [false],
      paint_protection_check: [false],
      paint_protection_sub_check: [false],
      orderCommentTextArea: [""],
      requisitionNumberInput: ["", Validators.required],
      salesmanSelect: ["", Validators.required]
    });

    this.stepTwoFormGroup = this._formBuilder.group({});
    this.stepThreeFormGroup = this._formBuilder.group({});

    this.customOrderFormGroup = this._formBuilder.group({
      customOrderCarMake: ["", Validators.required],
      customOrderCarModel: ["", Validators.required],
      customOrderCarYear: ["", Validators.required],
      customOrderAdditionalComment: [""],
      customOrderPainProtectionCheck: [""],
      customOrderPaintProtectionComment: [""],
      customOrderRequisitionNumber: ["", Validators.required],
      customOrderSalesman: ["", Validators.required]
    });

    this.spinner.show();
    this.http
      .get(this.url.SOLFILM_URL + "materials")
      .subscribe((data: Response) => {
        const res = data.json();
        if (res.status == "success") {
          this.spinner.hide();
          let carInfo = res.carData;
          this.paintProtectionMaterialsFromMobilPlan = res.paintData;
          this.shadeMaterialsFromMobilPlan = res.shadeData;
          this.fittingMaterialsFromMobilPlan = res.fittingData;

          for (let i = 0; i < carInfo.length; i++) {
            if (!this.makeList.includes(carInfo[i]["make"])) {
              this.makeList.push(carInfo[i]["make"]);
            }
          }

          for (let i = 0; i < this.makeList.length; i++) {
            let model = [];
            for (let j = 0; j < carInfo.length; j++) {
              let item = [];
              if (carInfo[j]["make"] == this.makeList[i]) {
                item["model"] = carInfo[j]["model"];
                item["product_no"] = carInfo[j]["product_no"];
                model.push(item);
              }
            }
            this.modelsList.push(model);
          }

          let idx = this.makeList.indexOf(this.form_data.make);
          this.modelList = this.modelsList[idx];

          let params = "?customerId=" + this.customerId;
          this.http
            .get(this.url.SOLFILM_URL + "salesman/" + params)
            .subscribe((data: Response) => {
              const result = data.json();
              console.log(result)
              if (result.status == "success") {
                this.salesmen = result.salesmen;
                this.formData.assignedEmployees = result.installers.map(e => e.mobilPlanId);
                this.formData.employeesServicingAutoDealers = result.employees.map(e => e.employeeId);

                console.log("this.formData.assignedEmployees", this.formData.assignedEmployees);
                console.log("this.formData.employeesServicingAutoDealers", this.formData.employeesServicingAutoDealers);

                this.custom_order_salesman = result.salesmen;
                this.customOrderFormData.assignedEmployees = result.installers.map(e => e.mobilPlanId);
                this.customOrderFormData.employeesServicingAutoDealers = result.employees.map(e => e.employeeId);

                console.log()
              }

              this.spinner.hide();
            });
        }
      });
  }

  ngAfterViewInit() {
  }

  nextButtonHandler(stepper: MatStepper, stepNumber) {
    console.log("next button clicked: ", stepNumber);

    if (stepNumber == 0) {
      if (this.is_regular_order_show) {
        if (this.car_make_select == "") {
          this.isCarMakeSelected = false;
          $("html, body").animate({scrollTop: 0}, "slow");
          return false;
        }

        if (this.car_model_select == "") {
          this.isCarModelSelected = false;
          $("html, body").animate({scrollTop: 0}, "slow");
          return false;
        }

        if (
          this.regularOrderFormGroup.value.window_tinting_check == false &&
          this.regularOrderFormGroup.value.paint_protection_check == false
        ) {
          this.show_paint_or_window_check_hint = true;
          $("html, body").animate({scrollTop: 0}, "slow");
          return false;
        }

        if (this.regularOrderFormGroup.value.window_tinting_check) {
          if (!this.regularOrderFormGroup.value.shadeRadio) {
            this.is_shade_selected = false;
            return false;
          }

          if (!this.regularOrderFormGroup.value.edgeRadio) {
            this.is_edge_selected = false;
            return false;
          }
        }

        if (this.regularOrderFormGroup.value.paint_protection_check) {
          if (
            !this.selectedWindowPaint &&
            this.selectedWindowPaint.length == 0
          ) {
            this.is_paint_protection_sub_check = false;
            return false;
          }
        }

        this.formData.materialProductNumbers = [];
        if (
          this.selectedWindowFitting != "" &&
          this.selectedWindowFitting !== undefined
        ) {
          this.formData.materialProductNumbers.push(this.selectedWindowFitting);
        }

        if (
          this.selectedWindowShadow != "" &&
          this.selectedWindowShadow !== undefined
        ) {
          this.formData.materialProductNumbers.push(this.selectedWindowShadow);
        }

        for (let i = 0; i < this.paintProtectionMaterialsFromMobilPlan.length; i++) {
          if (
            this.selectedWindowPaint[i] !== "" &&
            this.selectedWindowPaint[i] !== undefined
          ) {
            this.formData.materialProductNumbers.push(
              this.selectedWindowPaint[i]
            );
          }
        }

        this.formData.materialProductNumbers.push(
          this.selectedCarProductNumber
        );

        const productNumbers = JSON.stringify(
          this.formData.materialProductNumbers
        ).toString();

        const assignedEmployees = JSON.stringify(
          this.formData.assignedEmployees
        ).toString();

        const employeesServicingAutoDealers = JSON.stringify(
          this.formData.employeesServicingAutoDealers
        ).toString();

        const formData = new FormData();
        formData.append("language", this.formData.language);
        formData.append("year", this.formData.year.toString());
        formData.append("weekNumber", this.formData.weekNumber.toString());
        formData.append("materialProductNumbers", productNumbers);
        formData.append(
          "requisitionNumber",
          this.formData.requisitionNumber.toString()
        );
        formData.append("additionalComments", this.formData.additionalComments);
        formData.append("deliveryAddress", this.formData.deliveryAddress);
        formData.append("salesmanId", this.formData.salesmanId);
        formData.append("customerId", this.formData.customerId);
        formData.append("assignedEmployees", assignedEmployees);
        formData.append("employeesServicingAutoDealers", employeesServicingAutoDealers);

        this.regularOrderFormGroup.markAllAsTouched();

        if (this.regularOrderFormGroup.valid) {
          this.createCalendar(formData);
        } else {
          console.log("Marked all and invalid");
          return false;
        }
      }

      if (this.is_custom_order_show) {
        if (!this.customOrderFormGroup.value.customOrderPainProtectionCheck) {
          if (
            !this.selectedCustomOrderWindowPaint &&
            this.selectedCustomOrderWindowPaint.length == 0
          ) {
            this.is_paint_protection_sub_check = false;
            return false;
          }
        }
        this.customOrderFormData.customWindows = [];
        this.customOrderFormData.materialProductNumbers = [];

        // loop selections and create form data for later POST
        for (let i = 0; i < this.windowTableElements.length; i++) {
          let data = {
            materialId: this.windowTableElements[i].window_value,
            shadeMaterialId: this.windowTableElements[i].shade_value
          };
          this.customOrderFormData.customWindows.push(data);
        }

        for (let i = 0; i < this.selectedCustomOrderWindowPaint.length; i++) {
          if (
            this.selectedCustomOrderWindowPaint[i] !== "" &&
            this.selectedCustomOrderWindowPaint[i] !== undefined
          ) {
            this.customOrderFormData.materialProductNumbers.push(
              this.selectedCustomOrderWindowPaint[i]
            );
          }
        }

        const productNumbers = JSON.stringify(
          this.customOrderFormData.materialProductNumbers
        ).toString();

        const employees = JSON.stringify(
          this.customOrderFormData.assignedEmployees
        ).toString();

        const employeesServicingAutoDealers = JSON.stringify(
          this.customOrderFormData.employeesServicingAutoDealers
        ).toString();

        const customWindows = JSON.stringify(
          this.customOrderFormData.customWindows
        ).toString();

        const formData = new FormData();
        formData.append("language", this.customOrderFormData.language);
        formData.append("year", this.customOrderFormData.year.toString());
        formData.append(
          "model_year",
          this.customOrderFormGroup.controls.customOrderCarYear.value
        );
        formData.append(
          "weekNumber",
          this.customOrderFormData.weekNumber.toString()
        );
        formData.append("customWindows", customWindows);
        formData.append(
          "make",
          this.customOrderFormGroup.controls.customOrderCarMake.value
        );
        formData.append(
          "model",
          this.customOrderFormGroup.controls.customOrderCarModel.value
        );
        formData.append(
          "additionalCommentsToModel",
          this.customOrderFormGroup.controls.customOrderAdditionalComment.value
        );
        formData.append(
          "requisitionNumber",
          this.customOrderFormGroup.controls.customOrderRequisitionNumber.value
        );
        formData.append(
          "additionalComments",
          this.customOrderFormGroup.controls.customOrderPaintProtectionComment
            .value
        );
        formData.append(
          "deliveryAddress",
          this.customOrderFormData.deliveryAddress
        );
        formData.append(
          "salesmanId",
          this.customOrderFormGroup.controls.customOrderSalesman.value
        );
        formData.append("materialProductNumbers", productNumbers);
        formData.append(
          "customerId",
          this.customOrderFormData.customerId
        );
        formData.append("assignedEmployees", employees);
        formData.append("employeesServicingAutoDealers", employeesServicingAutoDealers);

        this.customOrderFormGroup.markAllAsTouched();
        if (this.customOrderFormGroup.valid) {
          this.createCalendarFromCustomOrder(formData);
        } else {
          console.log("Marked all and invalid");
          return false;
        }
      }
    }

    if (stepNumber == 1) {
      if (this.scheduledTime == null || this.scheduledTime == "") {
        return false;
      }

      if (this.scheduledPrice == null || this.scheduledPrice == "") {
        return false;
      }

      const formData = new FormData();
      formData.append("calendarId", this.calendarResponse.id);
      formData.append("timeSlotId", this.selectedTimeSlotId);
      this.http
        .post(this.url.SOLFILM_URL + "summary", formData)
        .subscribe((response: Response) => {
          let res = response.json();
          this.summary = JSON.parse(res.data);
          console.log("here comes summary response in step 2: ", this.summary);
        });
    }
    stepper.next();
  }

  private createCalendar(formData) {
    console.log("createCalendar", formData);
    this.resetCalendarAndTimeSlotSelection();
    //this.spinner.show();

    this.http
      .post(this.url.SOLFILM_URL + "createCalendar", formData)
      .subscribe((response: Response) => {
        const res = response.json();
        const data = JSON.parse(res.data);
        this.calendarResponse = data;
        this.dayCalendar = data.dayCalendar;
        this.fixedTimeCalendar = data.fixedTimeCalendar;
        this.dayCalendarTimeSlots = this.dayCalendar.timeSlots
        this.fixedTimeCalendarTimeSlots = [];
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowOne.timeSlots);
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowTwo.timeSlots);
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowThree.timeSlots);
        this.weekDatesWithDate = data.calendarHeader.headings;
        this.isCalendarDataReady = true;
        this.spinner.hide();
      });
  }

  private resetCalendarAndTimeSlotSelection() {
    this.selectedTimeSlotId = undefined;
    this.scheduledTime = undefined;
    this.scheduledPrice = undefined;

    this.isCalendarDataReady = false;
    this.calendarResponse = undefined;
    this.dayCalendar = undefined;
    this.fixedTimeCalendar = undefined;
    this.dayCalendarTimeSlots = undefined;
    this.fixedTimeCalendarTimeSlots = [];
  }

  private createCalendarFromCustomOrder(formData) {
    this.http
      .post(this.url.SOLFILM_URL + "customOrderCreateCalendar", formData)
      .subscribe((response: Response) => {
        const res = response.json();
        const data = JSON.parse(res.data);
        this.calendarResponse = data;
        this.dayCalendar = data.dayCalendar;
        this.fixedTimeCalendar = data.fixedTimeCalendar;
        this.dayCalendarTimeSlots = this.dayCalendar.timeSlots;
        this.fixedTimeCalendarTimeSlots = [];
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowOne.timeSlots);
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowTwo.timeSlots);
        this.fixedTimeCalendarTimeSlots.push(this.fixedTimeCalendar.rowThree.timeSlots);
        this.weekDatesWithDate = data.calendarHeader.headings;
        this.isCalendarDataReady = true;
      });
  }

  prevButtonHandler(stepper: MatStepper, stepNumber) {
    if (stepNumber == 1) {
      this.resetCalendarAndTimeSlotSelection();
    }
    stepper.previous();
  }

  cancelButtonHandler() {
    console.log("cancel button clicked");
    this.router.navigate(["/"]);
  }

  submitButtonHandler() {
    let form = new FormData();
    this.submitOrder(form);
  }

  emailError = false;

  validateEmail(email) {
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

  j = 0;
  all = [];
  threshold = 0;
  address = "";
  min;
  a = 0;
  inc = 0;
  price = 0;
  submit = 0;

  submitOrder(form) {
    const formData = new FormData();
    formData.append("calendarId", this.calendarResponse.id);
    formData.append("timeSlotId", this.selectedTimeSlotId);

    formData.forEach((value, key) => {
      console.log("key = ", key, "value = ", value);
    })

    this.http
      .post(this.url.SOLFILM_URL + 'submitOrder', formData)
      .subscribe((response: Response) => {
        console.log("here submit form data response: ", response)
        let res = response.json()
        if (res.status === 'success') {
          this.router.navigate(['/'])
        }
      })
  }

  open(content) {
    console.log("here add salesman: ", content);
    this.modalService
      .open(content, {ariaLabelledBy: "modal-basic-title"})
      .result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  openAddWindowDialog() {
    const dialogRef = this.userActiveDialog.open(AddWindowDialog, {
      width: "550px",
      data: {
        buttonSelection: "",
        window_data: this.custom_order_window_data,
        shade_data: this.custom_order_shade_data,
        is_tinting_selected: true,
        is_shadow_selected: true,
        is_shadow_show: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.buttonSelection == "yes") {
        console.log("add window dialog yes button clicked", result);
        // this object is not neccessary, because "result" is the object needed.
        let window_shade_table_element: WindowShadeTableElement = {
          window_value: result.window_radio_value.product_no,
          window_name: result.window_radio_value.name,
          shade_value: result.shade_radio_value.product_no,
          shade_name: result.shade_radio_value.name,
          action: "delete"
        };
        this.windowTableElements.push(window_shade_table_element);
        this.is_custom_order_window_added = true;
      } else {
        console.log("add window dialog no button clicked", result);
      }
      this.windowTableDataSource = new MatTableDataSource<WindowShadeTableElement>(this.windowTableElements);
    });
  }

  openAddSalesmanDialog() {
    const dialogRef = this.userActiveDialog.open(AddSalesmanDialog, {
      width: "550px",
      data: {
        buttonSelection: ""
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.buttonSelection == "yes") {
        console.log("add window dialog yes button clicked", result);
        this.spinner.show();
        const formData = new FormData();
        formData.append("name", result.name);
        formData.append("email", result.email);
        formData.append("phone", result.phone);
        formData.append("mobilPlanId", this.mobilPlanId);
        formData.append("customerId", this.customerId);

        this.http
          .post(this.url.SOLFILM_URL + "addCustomer", formData)
          .subscribe((customerAdded: Response) => {
            const res = customerAdded.json();
            if (res.status == "success") {
              this.salesmen = res.data;
              this.cdRef.detectChanges();
              this.salesmen.reverse();
              this.salesmanName = result.name;
              this.spinner.hide();
            }
          });
      } else {
        console.log("add window dialog no button clicked", result);
      }
    });
  }

  windowTableActionClickHandler(element) {
    let location = this.windowTableElements.indexOf(element);
    this.windowTableElements.splice(location, 1);
    this.windowTableDataSource = new MatTableDataSource<WindowShadeTableElement>(this.windowTableElements);
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  checkValue($event) {
    // console.log("here comes checkvalue: ", $event);
    this.errorMessage = false;
    this.show_paint_or_window_check_hint = false;
    // var v = $event.target.value
    var v = $event.source.value;
    if (v == "window") {
      if (this.is_window_selected == false) {
        this.is_window_selected = true;
      } else {
        this.is_window_selected = false;
      }
    } else {
      if (this.is_paint_selected == false) {
        this.is_paint_selected = true;
      } else {
        this.is_paint_selected = false;
      }
    }
    if (this.is_paint_selected == true || this.is_window_selected == true) {
      document.getElementById("dAddressShow").style.display = "block";
      document.getElementById("reNumber").style.display = "block";
      document.getElementById("sNumber").style.display = "block";
    } else {
      document.getElementById("dAddressShow").style.display = "none";
      document.getElementById("reNumber").style.display = "none";
      document.getElementById("sNumber").style.display = "none";
    }
    $("#productError").text("");
  }

  onchangeDay(value) {
    if (value === "fixed") {
      this.fixed = true;
      this.day = false;
    }

    if (value === "day") {
      this.fixed = false;
      this.day = true;
    }
    this.scheduledPrice = undefined;
    this.scheduledTime = undefined;
    this.selectedTimeSlotId = undefined;
  }

  onChangeMake(value) {
    this.isCarMakeSelected = true;
    let pos = this.makeList.indexOf(value);
    this.modelList = this.modelsList[pos];
    this.makeName = value;
    $("#make1Error").text("");
    this.selectedCarProductNumber = this.modelList[0]["product_no"];
  }

  onChangeModel(value) {
    this.is_product_show = true;
    this.isCarModelSelected = true;
    var idx = -1;
    for (var i = 0; i < this.modelList.length; i++)
      if (this.modelList[i].model == value) idx = i;
    this.selectedCarProductNumber = this.modelList[idx]["product_no"];
    this.modelName = value;
  }

  rek(value) {
    $("#requisitionError").text("");
    this.formData.requisitionNumber = value;
  }

  logout() {
    localStorage.clear();
    this.auth.loggedIn = false;
    this.auth.clearLocalTokens();
    this.router.navigate(["/login"]);
  }

  deliveryAddress(value) {
    $("#deliveryError").text("");
    this.formData.deliveryAddress = value;
  }

  onChangeCustomer(value) {
    this.formData.salesmanId = value;
    $("#salesmanError").text("");
  }

  onChangePaint(value, isChecked: boolean, idx) {
    this.is_paint_protection_sub_check = true;
    this.errorMessage = false;
    if (isChecked) {
      this.selectedWindowPaint[idx] = value;
    } else {
      this.selectedWindowPaint[idx] = "";
    }
  }

  onChangeCustomPaint(value, isChecked: boolean, idx) {
    this.is_paint_protection_sub_check = true;
    this.errorMessage = false;
    if (isChecked) {
      this.selectedCustomOrderWindowPaint[idx] = value;
    } else {
      this.selectedCustomOrderWindowPaint[idx] = "";
    }
  }

  onchangeFitting(value) {
    this.is_edge_selected = true;
    this.selectedWindowFitting = value;
  }

  onchangeShades(value) {
    this.is_shade_selected = true;
    this.errorMessage = false;
    this.selectedWindowShadow = value;
    $("#shadeError").text("");
  }

  daySlot(idx1, idx2, target, availability, kind) {
    if (availability == "FREE") {
      if (kind == "fixed") {
        this.scheduledTime = this.fixedTimeCalendarTimeSlots[idx1][idx2].scheduledTimeForDisplay;
        this.scheduledPrice = this.fixedTimeCalendarTimeSlots[idx1][idx2].label;1
        this.selectedTimeSlotId = this.fixedTimeCalendarTimeSlots[idx1][idx2].id;

      } else {
        this.scheduledTime = this.dayCalendarTimeSlots[idx2].scheduledTimeForDisplay;
        this.scheduledPrice = this.dayCalendarTimeSlots[idx2].label;
        this.selectedTimeSlotId = this.dayCalendarTimeSlots[idx2].id;
      }
      $("td.selected").removeClass("selected");
      target.classList.add("selected");

      console.log("timeSlotId ", this.selectedTimeSlotId)
    }
  }

  SaveCustomer(customer) {
    if (this.emailError == false) {
      if (
        customer.salesmanName != "" &&
        customer.salmesmanEmail != "" &&
        customer.salesmanPhone != ""
      ) {
        this.modalService.dismissAll();
        const formData = new FormData();
        formData.append("name", customer.salesmanName);
        formData.append("email", customer.salesmanEmail);
        formData.append("phone", customer.salesmanPhone);
        formData.append("mobilPlanId", this.mobilPlanId);
        formData.append("customerId", this.customerId);

        this.http
          .post(this.url.SOLFILM_URL + "addCustomer", formData)
          .subscribe((customerAdded: Response) => {
            console.log(customerAdded);
            const res = customerAdded.json();
            if (res.status == "success") {
              this.salesmen = res.data;
              this.cdRef.detectChanges();
              this.salesmen.reverse();
              this.modalService.dismissAll();
              this.salesmanName = customer.salesmanName;
            }
          });
      }
    }
  }

  slothover(target, availability) {
    if (availability === "FREE") {
      target.style = "background-color: rgba(40, 167, 69, .5); cursor: pointer";
    }
  }

  slotleave(target, availability) {
    if (availability === "FREE") {
      target.style = "background-color: #f3f3f3; cursor: pointer";
    }
  }

  // previous week
  previous() {
    this.formData.weekNumber -= 1;
    this.getDataForOrder();
  }

  // next week
  next() {
    this.formData.weekNumber += 1;
    this.getDataForOrder();
  }

  getDataForOrder() {
    $("td.selected").removeClass("selected");
    this.scheduledPrice = undefined;
    this.scheduledTime = undefined;

    const productNumbers = JSON.stringify(
      this.formData.materialProductNumbers
    ).toString();

    const assignedEmployees = JSON.stringify(
      this.formData.assignedEmployees
    ).toString();

    const employeesServicingAutoDealers = JSON.stringify(
      this.formData.employeesServicingAutoDealers
    ).toString();

    const orderFormData = new FormData();
    orderFormData.append("language", this.formData.language);
    orderFormData.append("year", this.formData.year.toString());
    orderFormData.append("weekNumber", this.formData.weekNumber.toString());
    orderFormData.append("materialProductNumbers", productNumbers);
    orderFormData.append("requisitionNumber", this.formData.requisitionNumber.toString());
    orderFormData.append("additionalComments", this.formData.additionalComments);
    orderFormData.append("deliveryAddress", this.formData.deliveryAddress);
    orderFormData.append("salesmanId", this.formData.salesmanId);
    orderFormData.append("customerId", this.formData.customerId);
    orderFormData.append("assignedEmployees", assignedEmployees);
    orderFormData.append("employeesServicingAutoDealers", employeesServicingAutoDealers);

    this.createCalendar(orderFormData);
  }
}

export interface AddWindowDialogData {
  window_radio_value: any;
  shade_radio_value: any;
  buttonSelection: string;
  window_data: [];
  shade_data: [];
  is_tinting_selected: boolean;
  is_shadow_selected: boolean;
  is_shadow_show: boolean;
}

@Component({
  selector: "add-window-dialog",
  templateUrl: "add-window-dialog.html"
})

export class AddWindowDialog {
  constructor(
    public dialogRef: MatDialogRef<AddWindowDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AddWindowDialogData
  ) {
  }

  yesButtonHandler() {
    this.data.buttonSelection = "yes";
    if (!this.data.window_radio_value) {
      this.data.is_tinting_selected = false;
      return false;
    } else {
      if (!this.data.shade_radio_value) {
        this.data.is_shadow_selected = false;
        return false;
      }
    }
    this.dialogRef.close(this.data);
  }

  cancelButtonHandler() {
    this.data.buttonSelection = "no";
    this.dialogRef.close(this.data);
  }

  onChangeCustomWindow(value) {
    console.log("here modal radio clicked: ", value);
    this.data.window_radio_value = value;
    this.data.is_shadow_show = true;
    this.data.is_tinting_selected = true;
  }

  onChangeCustomWindowShade(value) {
    console.log("here modal radio clicked: ", value);
    this.data.shade_radio_value = value;
    this.data.is_shadow_selected = true;
  }
}

export interface WindowShadeTableElement {
  window_value: any;
  window_name: any;
  shade_value: any;
  shade_name: string;
  action: string;
}

export interface AddSalesmanDialogData {
  name: string;
  email: string;
  phone: string;
  buttonSelection: string;
}

@Component({
  selector: "add-salesman-dialog",
  templateUrl: "add-salesman-dialog.html"
})
export class AddSalesmanDialog implements OnInit {
  addSalesmanFormGroup: FormGroup;
  isErrorShow: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddSalesmanDialog>,
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: AddSalesmanDialogData
  ) {
  }

  ngOnInit() {
    this.addSalesmanFormGroup = this._formBuilder.group({
      salesmanName: ["", Validators.required],
      salesmanEmail: ["", [Validators.required, Validators.email]],
      salesmanPhone: ["", Validators.required]
    });
  }

  yesButtonHandler() {
    this.data.buttonSelection = "yes";
    if (this.addSalesmanFormGroup.valid) {
      this.data.name = this.addSalesmanFormGroup.controls.salesmanName.value;
      this.data.email = this.addSalesmanFormGroup.controls.salesmanEmail.value;
      this.data.phone = this.addSalesmanFormGroup.controls.salesmanPhone.value;

    } else {
      return false;
    }

    this.dialogRef.close(this.data);
  }

  cancelButtonHandler() {
    this.data.buttonSelection = "no";
    this.dialogRef.close(this.data);
  }
}
