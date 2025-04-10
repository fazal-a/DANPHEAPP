import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import * as moment from 'moment/moment';


export class BillingOpPatientVM {
  public PatientId: number = 0;
  public PatientCode: string = null;
  public FirstName: string = "";
  public MiddleName: string = null;
  public LastName: string = "";
  public PatientNameLocal: string = "";

  public DateOfBirth: string = null;
  public Gender: string = null;
  public ShortName: string = null;
  public PhoneNumber: string = null;
  public CountryId: number = 0;
  public CountrySubDivisionId: number = null;
  public CountrySubDivisionName: string = null;//used only in client side.
  public Age: string = null;
  public AgeUnit: string = 'Y'; //used only in client side
  public Address: string = null;
  public Email: string = null;

  //public MembershipTypeId: number = 0;

  //Audit Trail Information.
  public CreatedOn: string = null;
  public CreatedBy: number = null;
  public ModifiedOn: string = null;
  public ModifiedBy: number = null;
  public IsActive: boolean = true;
  public MunicipalityId: number = null;
  public WardNumber: number = null;
  public EthnicGroup: string = "";

  public OutPatientValidator: FormGroup = null;

  constructor() {
    var _formBuilder = new FormBuilder();
    this.OutPatientValidator = _formBuilder.group({
      'FirstName': ['', Validators.compose([Validators.required, Validators.maxLength(30)])],
      'LastName': ['', Validators.compose([Validators.required, Validators.maxLength(30)])],
      'MiddleName': ['', Validators.compose([Validators.maxLength(30)])],
      'Age': ['', Validators.compose([Validators.required])],
      'Gender': ['', Validators.required],
      'CountrySubDivisionId': ['', Validators.required],
      'PhoneNumber': ['', Validators.compose([Validators.required, Validators.pattern('^[0-9]{1,10}$')])],
      'WardNumber': ['', Validators.compose([Validators.pattern('^[0-9]{0,2}$')])],
      'CountryId': ['', Validators.required],
      'Email': ['', Validators.pattern('^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$')],
    });

  }

  public IsDirty(fieldname): boolean {
    if (fieldname == undefined) {
      return this.OutPatientValidator.dirty;
    }
    else {
      return this.OutPatientValidator.controls[fieldname].dirty;
    }

  }

  public IsValid(fieldname, validator): boolean {
    if (this.OutPatientValidator.valid) {
      return true;
    }

    if (fieldname == undefined) {
      return this.OutPatientValidator.valid;
    }
    else {
      return !(this.OutPatientValidator.hasError(validator, fieldname));
    }
  }

  public IsValidCheck(fieldname, validator): boolean {
    // this is used to check for patient form is valid or not 
    if (this.OutPatientValidator.valid) {
      return true;
    }

    if (fieldname == undefined) {
      return this.OutPatientValidator.valid;
    }
    else {

      return !(this.OutPatientValidator.hasError(validator, fieldname));
    }
  }



  dateValidators(control: FormControl): { [key: string]: boolean } {
    //get current date, month and time
    var currDate = moment().format('YYYY-MM-DD');
    //if positive then selected date is of future else it of the past
    if ((moment(control.value).diff(currDate) > 0) ||
      (moment(control.value).diff(currDate, 'years') < -200)) // this will not allow the age diff more than 200 is past
      return { 'wrongDate': true };
  }

  //to dynamically enable/disable any form-control. 
  //here [disabled] attribute was not working from cshtml, so written a separate logic to do it.
  public EnableControl(formControlName: string, enabled: boolean) {

    let currCtrol = this.OutPatientValidator.controls[formControlName];
    if (currCtrol) {
      if (enabled) {
        currCtrol.enable();
      }
      else {
        currCtrol.disable();
      }
    }
  }

  public UpdateValidator(onOff: string, formControlName: string) {
    if (formControlName == "PhoneNumber" && onOff == "off") {
      this.OutPatientValidator.controls['PhoneNumber'].validator = Validators.compose([]);
    }
    this.OutPatientValidator.controls[formControlName].updateValueAndValidity();
  }

}
