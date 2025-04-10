import { animate, style, transition, trigger } from "@angular/animations";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ChangeDetectorRef, Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ADT_BLService } from "../../adt/shared/adt.bl.service";
import { ADT_DLService } from "../../adt/shared/adt.dl.service";
import { Visit } from "../../appointments/shared/visit.model";
import { VisitService } from "../../appointments/shared/visit.service";
import { NoteTemplateBLService } from "../../clinical-notes/shared/note-template.bl.service";
import { NotesModel } from "../../clinical-notes/shared/notes.model";
import { InPatientVM } from "../../labs/shared/InPatientVM";
import { PatientService } from "../../patients/shared/patient.service";
import { SecurityService } from "../../security/shared/security.service";
import { Department } from "../../settings-new/shared/department.model";
import { CallbackService } from "../../shared/callback.service";
import GridColumnSettings from "../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../shared/routefrom.service";
import { DoctorsBLService } from "../shared/doctors.bl.service";

@Component({
  selector: "ipd-main",
  templateUrl: "./ipd-main.html",
  providers: [NoteTemplateBLService],
  animations: [
    trigger("enterAnimation", [
      transition(":enter", [
        style({ transform: "translateY(10%)", opacity: 0 }),
        animate("500ms", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("500ms", style({ transform: "translateY(10%)", opacity: 0 })),
      ]),
    ]),
  ],
})
export class IPDMainComponent {
  public IPDPatientGridColumn: Array<any> = null;
  public IPDPatientFavouriteGridColumn: Array<any> = null;
  public PendingListGridColumn: Array<any> = null;
  public PatientId: number = 0;
  public templatedata: NotesModel = new NotesModel();
  public IDPPatientGridData: Array<InPatientVM> = null;
  public FilteredIDPPatientGridData: Array<InPatientVM> = null;
  public FavoritePatients: Array<InPatientVM> = new Array<InPatientVM>();
  public FavoritePatientIds: Array<number> = new Array<number>();
  public DepartmentList: Array<Department> = new Array<Department>();
  public SelectedDepartmentId: number = 0;
  public currentVisit: Visit = new Visit();
  public patientClinicalNotes = [];
  public freeNotesTempData: any;
  public procedureNotesTempData: any;
  public progressNotesTempData: any;
  public showViewNoteFreeNoteList: boolean = false;
  public showViewProcedureNoteList: boolean = false;
  public showProgressViewNoteList: boolean = false;
  public patVisit: Visit = new Visit();
  public options = {
    headers: new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
  };

  public showDischargeSummaryView: boolean = false;
  public selectedPatient: any;
  showPatientRecordPage: boolean;
  toDate: any;
  fromDate: any;

  constructor(
    public patientservice: PatientService,
    public callBackService: CallbackService,
    public http: HttpClient,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public visitService: VisitService,
    public msgBoxServ: MessageboxService,
    public notetemplateBLService: NoteTemplateBLService,
    public doctorsBLService: DoctorsBLService,
    public adtBlService: ADT_BLService,
    public admissionBLService: ADT_DLService,
    public securityService: SecurityService,
    public routeFromService: RouteFromService,
    public route: ActivatedRoute

  ) {
    this.IPDPatientGridColumn = GridColumnSettings.AdmittedAppointmentList;
    this.IPDPatientFavouriteGridColumn =
      GridColumnSettings.FavoriteAppointmentList;
    this.PendingListGridColumn = GridColumnSettings.PendingList;
    this.PageModeOnRouterChange();
    this.GetInpatientlist();
    this.patVisit = this.visitService.getGlobal();
    this.GetDepartmentList();
    this.GetPatientClinicalNotes();
  }

  public PageModeOnRouterChange() {
    let patientAdmissionStaus: string;
    this.route.data //.params //--> use params to retrieve route parameters
      .subscribe(dt => {
        patientAdmissionStaus = dt.patientAdmissionstatus;
      });

    if (patientAdmissionStaus == 'admitted') {
      this.GetInpatientlist();
    } else if (patientAdmissionStaus == 'discharged') {
      this.showPatientRecordPage = true; // On this true condition: date range will be shown to discharged patients between that range.
    }
  }
  GetInpatientlist() {
    this.admissionBLService.GetADTList("admitted").subscribe(
      (res) => {
        if (res.Status == "OK") {
          this.IDPPatientGridData = res.Results;
          this.IDPPatientGridData = this.IDPPatientGridData.slice();
          this.GetFavoritesList();
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }
  GetDepartmentList() {
    this.admissionBLService.GetDepartments().subscribe(
      (res) => {
        if (res.Status == "OK") {
          this.DepartmentList = res.Results;
        } else {
          this.msgBoxServ.showMessage("Error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("Error", [err.ErrorMessage]);
      }
    );
  }
  GetFavoritesList() {
    this.admissionBLService.GetEmployeeFavorites().subscribe(
      (res) => {
        if (res.Status == "OK") {
          if (res.Results != null) {
            this.FavoritePatientIds = res.Results;
            for (var i = 0; i < this.FavoritePatientIds.length; i++) {
              this.FavoritePatients = this.FavoritePatients.concat(
                this.IDPPatientGridData.filter(
                  (a) => a.PatientId == this.FavoritePatientIds[i]
                )
              );
              this.IDPPatientGridData.map((a) => {
                if (a.PatientId == this.FavoritePatientIds[i]) {
                  a.IsFavorite = true;
                }
              });
            }
          }
          this.IDPPatientGridData = this.IDPPatientGridData.slice();
          // this.changeDetector.detectChanges();
          this.FilteredIDPPatientGridData = this.IDPPatientGridData;
          if (this.securityService.loggedInUser.Employee.DepartmentId != null) {
            this.SelectedDepartmentId = this.securityService.loggedInUser.Employee.DepartmentId;
            this.FilterList(this.SelectedDepartmentId);
          }
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }

  GetPatientClinicalNotes() {
    this.http
      .get<any>(
        "/api/Clinical/PatientNotes?patientId=" +
        this.PatientId,
        this.options
      )
      .map((res) => res)
      .subscribe((res) => {
        if (res.Status == "OK") {
          this.patientClinicalNotes = res.Results;
          //this.patientClinicalNotes = this.patientClinicalNotes.filter(s => s.IsPending == true);
        } else {
          this.msgBoxServ.showMessage("failed", [
            "Unable to get patient clinical notes.",
          ]);
          console.log(res.ErrorMessage);
        }
      });
  }
  DocAppointmentGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "preview":
        {
          this.RouteToPatientOverview($event.Data);
        }
        break;
      case "labs":
        {
          this.RouteToOrders($event.Data, "labs");
        }
        break;
      case "imaging":
        {
          this.RouteToOrders($event.Data, "imaging");
        }
        break;
      case "notes":
        {
        }
        break;
      case "medication":
        {
        }
        break;
      case "addfavorite":
        {
          //chek if we can pass only data and not itemid.
          let patientId = $event.Data.PatientId;
          let itemId = JSON.stringify($event.Data.PatientId);
          let preferenceType = "Patient";
          this.admissionBLService
            .AddToFavorites(itemId, preferenceType, patientId)
            .subscribe((res) => {
              if (res.Status == "OK") {
                this.FavoritePatientIds.push(res.Results);
                this.FavoritePatients = this.FavoritePatients.concat(
                  this.IDPPatientGridData.filter(
                    (a) => a.PatientId == res.Results
                  )
                );
                this.IDPPatientGridData.map((a) => {
                  if (a.PatientId == res.Results) {
                    a.IsFavorite = true;
                  }
                });
                this.FilteredIDPPatientGridData.map((a) => {
                  if (a.PatientId == res.Results) {
                    a.IsFavorite = true;
                  }
                });
                this.FilteredIDPPatientGridData = this.FilteredIDPPatientGridData.slice();
                this.changeDetector.detectChanges();
              } else {
                console.log(
                  "couldn't add to favourite. Error_Message: " +
                  res.ErrorMessage
                );
              }
            });
        }
        break;
      case "removefavorite": {
        let patientId = $event.Data.PatientId;
        let itemId = JSON.stringify($event.Data.PatientId);
        let preferenceType = "Patient";
        this.admissionBLService
          .RemoveFromFavorites(itemId, preferenceType)
          .subscribe((res) => {
            if (res.Status == "OK") {
              this.FavoritePatientIds = this.FavoritePatientIds.filter(
                (a) => a != patientId
              );
              this.FavoritePatients = this.FavoritePatients.filter(
                (a) => a.PatientId != patientId
              );
              this.IDPPatientGridData.map((a) => {
                if (a.PatientId == patientId) {
                  a.IsFavorite = false;
                }
              });
              this.FilteredIDPPatientGridData.map((a) => {
                if (a.PatientId == patientId) {
                  a.IsFavorite = false;
                }
              });
              this.IDPPatientGridData = this.IDPPatientGridData.slice();
              this.FilteredIDPPatientGridData = this.FilteredIDPPatientGridData.slice();
              this.changeDetector.detectChanges();
            } else {
              console.log(
                "couldn't remove from favourite. Error_Message: " +
                res.ErrorMessage
              );
            }
          });
      }
      default:
        break;
    }
  }

  PendingListGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "showDetails":
        {
          //var TempType = $event.Data.TemplateName;
          this.templatedata = $event.Data;
          //  this.showViewNoteList = true;
          if ($event.Data.TemplateName == "Free Text") {
            this.notetemplateBLService
              .GetFreetextNoteTemplateByNotesId(this.templatedata.NotesId)
              .subscribe((res) => {
                if (res.Status == "OK") {
                  this.freeNotesTempData = res.Results;
                  this.showViewNoteFreeNoteList = true;
                } else {
                  this.msgBoxServ.showMessage("Failed", ["No Template."]);
                }
              });
            // console.log(this.templatedata.NotesId);
            //console.log(this.patientClinicalNotes[0].NotesId);
            // this.notetemplateBLService.GetFreetextNoteTemplate(this.patientClinicalNotes[0].NotesId)
          }

          if ($event.Data.TemplateName == "Procedure Note") {
            this.notetemplateBLService
              .GetProcedureNoteTemplateByNotesId(this.templatedata.NotesId)
              .subscribe((res) => {
                if (res.Status == "OK") {
                  this.procedureNotesTempData = res.Results;
                  this.showViewProcedureNoteList = true;
                } else {
                  this.msgBoxServ.showMessage("Failed", ["No Template."]);
                }
              });
          }
          if ($event.Data.TemplateName == "Progress Note") {
            this.notetemplateBLService
              .GetProgressNoteTemplateByNotesId(this.templatedata.NotesId)
              .subscribe((res) => {
                if (res.Status == "OK") {
                  this.progressNotesTempData = res.Results;
                  this.showProgressViewNoteList = true;
                } else {
                  this.msgBoxServ.showMessage("Failed", ["No Template."]);
                }
              });
          }
          if ($event.Data.TemplateName == "Discharge Note") {
            var patientId = $event.Data.PatientId;
            var patientVisitId = $event.Data.PatientVisitId;
            this.getPatientPlusBedInfo(patientId, patientVisitId);
          }
        }
        break;

      default:
        break;
    }
  }

  RouteToOrders(selectedVisit: Visit, routeTo: string) {
    this.SelectVisit(selectedVisit);
    this.routeFromService.RouteFrom = routeTo;
    this.router.navigate(["/Doctors/PatientOverviewMain/Orders"]);
  }
  RouteToPatientOverview(selectedVisit: Visit) {
    this.SelectVisit(selectedVisit);
    this.router.navigate(["/Doctors/PatientOverviewMain/PatientOverview"]);
  }
  SelectVisit(selectedVisit: any) {
    let currPatient = this.patientservice.getGlobal();
    let visitGlobal = this.visitService.getGlobal();
    currPatient.PatientId = selectedVisit.PatientId; //patient needed in problems part
    currPatient.PatientCode = selectedVisit.PatientCode;
    currPatient.Address = selectedVisit.Address;
    currPatient.PhoneNumber = selectedVisit.PhoneNumber;
    visitGlobal.PatientId = selectedVisit.PatientId;
    visitGlobal.PatientVisitId = selectedVisit.PatientVisitId;
    //currPatient.FirstName = selectedVisit.Patient.FirstName;
    //currPatient.LastName = selectedVisit.Patient.LastName;
    currPatient.Gender = selectedVisit.Gender;
    currPatient.DateOfBirth = selectedVisit.DateOfBirth;
    //currPatient.Age = selectedVisit.Patient.Age;
    currPatient.ShortName = selectedVisit.Name;
    visitGlobal.PerformerId = selectedVisit.AdmittingDoctorId;
    visitGlobal.PerformerName = selectedVisit.AdmittingDoctorName;
    visitGlobal.VisitDate = selectedVisit.AdmittedDate;
    visitGlobal.VisitType = "inpatient";
    // visitGlobal.ProviderName = selectedVisit.AdmittingDoctorName;
    //visitGlobal.ConcludeDate = selectedVisit.ConcludeDate;
    this.currentVisit = visitGlobal;
  }

  FilterList(deptId: number) {
    var dept = this.DepartmentList.find(x => x.DepartmentId == deptId);
    if (deptId == 0 || !dept) {
      this.FilteredIDPPatientGridData = this.IDPPatientGridData;
    } else {
      if (dept) {
        this.FilteredIDPPatientGridData = this.IDPPatientGridData.filter(
          a => a.Department == dept.DepartmentName
        );
      }
    }
  }

  Close() {
    this.showViewNoteFreeNoteList = false;
    this.showViewProcedureNoteList = false;
    this.showProgressViewNoteList = false;
    this.showDischargeSummaryView = false;
  }
  getPatientPlusBedInfo(patientId, patientVisitId) {
    this.adtBlService
      .GetPatientPlusBedInfo(patientId, patientVisitId)
      .subscribe((res) => {
        if (res.Status == "OK" && res.Results.length != 0) {
          this.selectedPatient = res.Results[0];
          this.showDischargeSummaryView = true;
        }
      });
  }
  onDateChange($event) {
    this.toDate = $event.toDate;
    this.fromDate = $event.fromDate;
    this.GetDischargedPatientList();
  }
  GetDischargedPatientList() {
    this.admissionBLService.GetDischargedPatientsList("discharged", this.fromDate, this.toDate).subscribe(
      (res) => {
        if (res.Status == "OK") {
          this.IDPPatientGridData = res.Results;
          this.IDPPatientGridData = this.IDPPatientGridData.slice();
          this.GetFavoritesList();
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }
}
