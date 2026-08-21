import React, {
  useMemo,
  useState,
} from "react";

import { useDropzone } from "react-dropzone";
import axios from "axios";
import * as XLSX from "xlsx";

import { API_BASE_URL } from "../config/apiConfig";
import { getAIBriefing } from "../services/dashboardApi";
import { useConfig } from "../context/ConfigContext";
import { useLanguage } from "../context/LanguageContext";

import {
  FaIndustry,
  FaTruckMoving,
  FaLeaf,
  FaHardHat,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaBrain,
} from "react-icons/fa";

import "./UploadReports.css";


/* =========================================================
   PAGE TRANSLATIONS
========================================================= */

const TRANSLATIONS = {
  EN: {
    pageTitle:
      "Daily Data Center",

    pageSubtitle:
      "Upload daily operational reports to prepare Mine Manager AI briefing.",

    dataCompleteness:
      "Data Completeness",

    reports: {
      production:
        "Production Report",

      fleet:
        "Fleet Report",

      plant:
        "Plant Report",

      safety:
        "Safety Report",
    },

    noFileSelected:
      "No file selected",

    dragFile:
      "Drag Excel here or click to browse",

    dropFile:
      "Drop the Excel file here...",

    supportedFiles:
      ".xlsx, .xls, .csv supported",

    waiting:
      "Waiting for upload",

    validating:
      "Validating Excel columns...",

    validatingFile:
      "Validating file...",

    uploading:
      "Uploading report...",

    uploadingFile:
      "Uploading file...",

    uploaded:
      "Validated and uploaded successfully",

    columnsValidated:
      "Columns validated successfully.",

    missingColumns:
      "Missing columns",

    requiredColumns:
      "Required columns:",

    emptyWorkbook:
      "The workbook does not contain a readable worksheet.",

    emptyFile:
      "The selected file is empty.",

    sessionExpired:
      "Your login session has expired. Please log in again.",

    noPermission:
      "You do not have permission to upload this report.",

    uploadFailed:
      "Upload failed. Please check the backend endpoint.",

    notAuthenticated:
      "Not authenticated. Please log in again before uploading.",

    unsupportedFile:
      "Unsupported file. Please upload an Excel or CSV file.",

    validationError:
      "Validation error",

    currentUser:
      "Current User",

    generateBriefing:
      "Generate AI Daily Briefing",

    briefingDisabled:
      "Upload all required reports to activate the AI Daily Briefing button.",

    briefingNoContent:
      "The briefing service returned no briefing content.",

    briefingTitle:
      "AI DAILY BRIEFING",

    risks:
      "RISKS",

    noRisks:
      "No major operational risks identified.",

    priorityActions:
      "PRIORITY ACTIONS",

    noPriorityActions:
      "No priority actions generated.",

    briefingFailed:
      "Failed to generate briefing.",

    uploadHistory:
      "Upload History",

    noHistory:
      "No reports uploaded yet.",

    success:
      "Success",

    table: {
      report:
        "Report",

      file:
        "File",

      user:
        "User",

      uploadTime:
        "Upload Time",

      status:
        "Status",
    },
  },


  MN: {
    pageTitle:
      "Өдөр тутмын өгөгдлийн төв",

    pageSubtitle:
      "Mine Manager AI мэдээлэл боловсруулахад шаардлагатай өдөр тутмын үйл ажиллагааны тайлангуудыг оруулна уу.",

    dataCompleteness:
      "Өгөгдлийн бүрдэл",

    reports: {
      production:
        "Олборлолтын тайлан",

      fleet:
        "Техникийн тайлан",

      plant:
        "Баяжуулах үйлдвэрийн тайлан",

      safety:
        "Аюулгүй ажиллагааны тайлан",
    },

    noFileSelected:
      "Файл сонгоогүй",

    dragFile:
      "Excel файлаа энд чирэх эсвэл дарж сонгоно уу",

    dropFile:
      "Excel файлаа энд байрлуулна уу...",

    supportedFiles:
      ".xlsx, .xls, .csv формат дэмжинэ",

    waiting:
      "Файл оруулахыг хүлээж байна",

    validating:
      "Excel багануудыг шалгаж байна...",

    validatingFile:
      "Файлыг шалгаж байна...",

    uploading:
      "Тайланг оруулж байна...",

    uploadingFile:
      "Файлыг оруулж байна...",

    uploaded:
      "Шалгалт амжилттай. Файл амжилттай орлоо.",

    columnsValidated:
      "Багануудын шалгалт амжилттай.",

    missingColumns:
      "Дутуу баганууд",

    requiredColumns:
      "Шаардлагатай баганууд:",

    emptyWorkbook:
      "Excel файлд унших боломжтой хүснэгт олдсонгүй.",

    emptyFile:
      "Сонгосон файл хоосон байна.",

    sessionExpired:
      "Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.",

    noPermission:
      "Энэ тайланг оруулах эрх танд байхгүй байна.",

    uploadFailed:
      "Файл оруулахад алдаа гарлаа. Backend холболтыг шалгана уу.",

    notAuthenticated:
      "Та нэвтрээгүй байна. Файл оруулахын өмнө дахин нэвтэрнэ үү.",

    unsupportedFile:
      "Дэмжигдээгүй файл байна. Excel эсвэл CSV файл оруулна уу.",

    validationError:
      "Өгөгдлийн шалгалтын алдаа",

    currentUser:
      "Одоогийн хэрэглэгч",

    generateBriefing:
      "AI өдөр тутмын мэдээлэл боловсруулах",

    briefingDisabled:
      "AI өдөр тутмын мэдээлэл боловсруулахын тулд шаардлагатай бүх тайланг оруулна уу.",

    briefingNoContent:
      "AI мэдээллийн үйлчилгээ үр дүн буцаасангүй.",

    briefingTitle:
      "AI ӨДӨР ТУТМЫН МЭДЭЭЛЭЛ",

    risks:
      "ЭРСДЭЛ",

    noRisks:
      "Үйл ажиллагааны томоохон эрсдэл илрээгүй.",

    priorityActions:
      "НЭН ТҮРҮҮНД ХИЙХ АРГА ХЭМЖЭЭ",

    noPriorityActions:
      "Нэн тэргүүний арга хэмжээ үүсээгүй.",

    briefingFailed:
      "AI мэдээлэл боловсруулахад алдаа гарлаа.",

    uploadHistory:
      "Файл оруулсан түүх",

    noHistory:
      "Одоогоор тайлан оруулаагүй байна.",

    success:
      "Амжилттай",

    table: {
      report:
        "Тайлан",

      file:
        "Файл",

      user:
        "Хэрэглэгч",

      uploadTime:
        "Оруулсан хугацаа",

      status:
        "Төлөв",
    },
  },
};


/* =========================================================
   REPORT CONFIG
========================================================= */

const REPORT_CONFIG = {
  production: {
    icon:
      <FaIndustry />,

    endpoint:
      "/upload/production",

    requiredColumns: [
      "report_date",
      "ore_plan",
      "ore_actual",
      "waste_plan",
      "waste_actual",
    ],
  },


  fleet: {
    icon:
      <FaTruckMoving />,

    endpoint:
      "/upload/fleet",

    requiredColumns: [
      "report_date",
      "truck_id",
      "availability",
      "utilization",
    ],
  },


  plant: {
    icon:
      <FaLeaf />,

    endpoint:
      "/upload/plant",

    requiredColumns: [
      "report_date",
      "throughput_plan",
      "throughput_actual",
      "recovery",
    ],
  },


  safety: {
    icon:
      <FaHardHat />,

    endpoint:
      "/upload/safety",

    requiredColumns: [
      "report_date",
      "incidents",
      "near_misses",
      "critical_risks",
      "safety_score",
    ],
  },
};


/* =========================================================
   AUTH HELPERS
========================================================= */

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser,
    );
  } catch (error) {
    console.warn(
      "Unable to read stored user information.",
      error,
    );

    return null;
  }
};


const getAccessToken = () => {
  return (
    localStorage.getItem(
      "access_token",
    ) ||
    localStorage.getItem(
      "token",
    ) ||
    ""
  );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

function UploadReports() {
  const {
    mine,
  } = useConfig();

  const {
    language,
  } = useLanguage();


  const currentLanguage =
    language === "MN"
      ? "MN"
      : "EN";


  const t =
    TRANSLATIONS[
      currentLanguage
    ];


  const mineName =
    mine?.mine_name ||
    "Achit-Ikht Copper Cathode Operation";


  const storedUser =
    getStoredUser();


  const uploadedBy =
    storedUser?.full_name ||
    storedUser?.name ||
    storedUser?.email ||
    t.currentUser;


  /* =======================================================
     ERROR MESSAGE HELPER
  ======================================================= */

  const extractUploadErrorMessage = (
    error,
  ) => {
    const detail =
      error?.response
        ?.data?.detail;


    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }


    if (
      Array.isArray(
        detail,
      )
    ) {
      return detail
        .map((item) => {
          if (
            typeof item ===
            "string"
          ) {
            return item;
          }

          return (
            item?.msg ||
            item?.message ||
            t.validationError
          );
        })
        .join(", ");
    }


    if (
      detail?.message
    ) {
      return detail.message;
    }


    if (
      detail?.error
    ) {
      return detail.error;
    }


    if (
      error?.response
        ?.status === 401
    ) {
      return t.sessionExpired;
    }


    if (
      error?.response
        ?.status === 403
    ) {
      return t.noPermission;
    }


    return (
      error?.response
        ?.data?.message ||
      error?.message ||
      t.uploadFailed
    );
  };


  /* =======================================================
     REPORT STATE
  ======================================================= */

  const [
    reports,
    setReports,
  ] = useState(() => {
    const initialState =
      {};

    Object.keys(
      REPORT_CONFIG,
    ).forEach((key) => {
      initialState[key] = {
        status:
          "waiting",

        fileName:
          "",

        progress:
          0,

        messageKey:
          "waiting",

        customMessage:
          "",

        uploadedAt:
          "",

        uploadedBy,
      };
    });

    return initialState;
  });


  /* =======================================================
     HISTORY
  ======================================================= */

  const uploadHistory =
    useMemo(() => {
      return Object.entries(
        reports,
      )
        .filter(
          ([, report]) =>
            report.status ===
            "success",
        )
        .map(
          ([
            key,
            report,
          ]) => ({
            report:
              t.reports[
                key
              ],

            fileName:
              report.fileName,

            uploadedBy:
              report.uploadedBy,

            uploadedAt:
              report.uploadedAt,

            status:
              t.success,
          }),
        );
    }, [
      reports,
      t,
    ]);


  const completedCount =
    Object.values(
      reports,
    ).filter(
      (report) =>
        report.status ===
        "success",
    ).length;


  const completeness =
    Math.round(
      (
        completedCount /
        Object.keys(
          REPORT_CONFIG,
        ).length
      ) * 100,
    );


  const allReportsUploaded =
    completedCount ===
    Object.keys(
      REPORT_CONFIG,
    ).length;


  /* =======================================================
     EXCEL VALIDATION
  ======================================================= */

  const normalizeColumn = (
    column,
  ) =>
    String(column)
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "_",
      );


  const validateExcelColumns =
    async (
      file,
      requiredColumns,
    ) => {
      const data =
        await file.arrayBuffer();


      const workbook =
        XLSX.read(
          data,
          {
            type:
              "array",
          },
        );


      const firstSheetName =
        workbook
          .SheetNames[0];


      const worksheet =
        workbook
          .Sheets[
            firstSheetName
          ];


      if (!worksheet) {
        return {
          valid:
            false,

          missingColumns:
            requiredColumns,

          message:
            t.emptyWorkbook,
        };
      }


      const rows =
        XLSX.utils
          .sheet_to_json(
            worksheet,
            {
              header:
                1,

              raw:
                false,

              blankrows:
                false,
            },
          );


      if (
        !rows ||
        rows.length === 0
      ) {
        return {
          valid:
            false,

          missingColumns:
            requiredColumns,

          message:
            t.emptyFile,
        };
      }


      const headerRow =
        Array.isArray(
          rows[0],
        )
          ? rows[0].map(
              normalizeColumn,
            )
          : [];


      const missingColumns =
        requiredColumns.filter(
          (column) =>
            !headerRow.includes(
              normalizeColumn(
                column,
              ),
            ),
        );


      return {
        valid:
          missingColumns.length ===
          0,

        missingColumns,

        message:
          missingColumns.length ===
          0
            ? t.columnsValidated
            : `${
                t.missingColumns
              }: ${missingColumns.join(
                ", ",
              )}`,
      };
    };


  /* =======================================================
     STATE UPDATE
  ======================================================= */

  const updateReport = (
    reportKey,
    changes,
  ) => {
    setReports(
      (
        previousReports,
      ) => ({
        ...previousReports,

        [reportKey]: {
          ...previousReports[
            reportKey
          ],

          ...changes,
        },
      }),
    );
  };


  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUpload =
    async (
      reportKey,
      acceptedFiles,
    ) => {
      const file =
        acceptedFiles[0];


      if (!file) {
        return;
      }


      const config =
        REPORT_CONFIG[
          reportKey
        ];


      updateReport(
        reportKey,
        {
          status:
            "validating",

          fileName:
            file.name,

          progress:
            0,

          messageKey:
            "validating",

          customMessage:
            "",

          uploadedAt:
            "",
        },
      );


      try {
        const validation =
          await validateExcelColumns(
            file,
            config.requiredColumns,
          );


        if (
          !validation.valid
        ) {
          updateReport(
            reportKey,
            {
              status:
                "error",

              progress:
                0,

              messageKey:
                "",

              customMessage:
                validation.message,
            },
          );

          return;
        }


        const accessToken =
          getAccessToken();


        if (!accessToken) {
          updateReport(
            reportKey,
            {
              status:
                "error",

              progress:
                0,

              messageKey:
                "",

              customMessage:
                t.notAuthenticated,
            },
          );

          return;
        }


        const formData =
          new FormData();


        formData.append(
          "file",
          file,
        );


        updateReport(
          reportKey,
          {
            status:
              "uploading",

            progress:
              0,

            messageKey:
              "uploading",

            customMessage:
              "",
          },
        );


        await axios.post(
          `${API_BASE_URL}${config.endpoint}`,
          formData,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },

            timeout:
              60000,

            onUploadProgress:
              (
                progressEvent,
              ) => {
                const total =
                  progressEvent
                    .total ||
                  file.size;


                const percentCompleted =
                  total
                    ? Math.round(
                        (
                          progressEvent
                            .loaded *
                          100
                        ) /
                          total,
                      )
                    : 0;


                updateReport(
                  reportKey,
                  {
                    progress:
                      percentCompleted,
                  },
                );
              },
          },
        );


        updateReport(
          reportKey,
          {
            status:
              "success",

            progress:
              100,

            messageKey:
              "uploaded",

            customMessage:
              "",

            uploadedAt:
              new Date()
                .toLocaleString(
                  currentLanguage ===
                  "MN"
                    ? "mn-MN"
                    : "en-US",
                ),

            uploadedBy,
          },
        );


        window.dispatchEvent(
          new CustomEvent(
            "reportUploaded",
            {
              detail: {
                reportType:
                  reportKey,

                fileName:
                  file.name,
              },
            },
          ),
        );


        if (
          reportKey ===
          "production"
        ) {
          window.dispatchEvent(
            new Event(
              "productionUploaded",
            ),
          );
        }
      } catch (error) {
        console.error(
          `Unable to upload ${reportKey} report:`,
          error,
        );


        updateReport(
          reportKey,
          {
            status:
              "error",

            progress:
              0,

            messageKey:
              "",

            customMessage:
              extractUploadErrorMessage(
                error,
              ),
          },
        );
      }
    };


  /* =======================================================
     REJECTED FILE
  ======================================================= */

  const handleRejectedFiles =
    (
      reportKey,
      rejectedFiles,
    ) => {
      const firstRejection =
        rejectedFiles?.[0];


      const firstError =
        firstRejection
          ?.errors?.[0];


      updateReport(
        reportKey,
        {
          status:
            "error",

          progress:
            0,

          fileName:
            firstRejection
              ?.file?.name ||
            "",

          messageKey:
            "",

          customMessage:
            firstError?.message ||
            t.unsupportedFile,
        },
      );
    };


  /* =======================================================
     AI BRIEFING
  ======================================================= */

  const handleGenerateBriefing =
    async () => {
      if (
        !allReportsUploaded
      ) {
        return;
      }


      try {
        const briefing =
          await getAIBriefing(
            mineName,
          );


        if (
          !briefing?.briefing
        ) {
          alert(
            t.briefingNoContent,
          );

          return;
        }


        const risks =
          Array.isArray(
            briefing.risks,
          )
            ? briefing.risks
            : [];


        const priorityActions =
          Array.isArray(
            briefing
              .priority_actions,
          )
            ? briefing
                .priority_actions
            : [];


        const briefingMessage =
          [
            t.briefingTitle,

            "",

            briefing.briefing,

            "",

            t.risks,

            risks.length >
            0
              ? risks
                  .map(
                    (
                      risk,
                      index,
                    ) =>
                      `${
                        index + 1
                      }. ${risk}`,
                  )
                  .join(
                    "\n",
                  )
              : t.noRisks,

            "",

            t.priorityActions,

            priorityActions.length >
            0
              ? priorityActions
                  .map(
                    (
                      action,
                      index,
                    ) =>
                      `${
                        index + 1
                      }. ${action}`,
                  )
                  .join(
                    "\n",
                  )
              : t.noPriorityActions,
          ].join(
            "\n",
          );


        alert(
          briefingMessage,
        );
      } catch (error) {
        console.error(
          "Unable to generate AI Daily Briefing:",
          error,
        );


        const detail =
          error?.response
            ?.data?.detail ||
          error?.message ||
          t.briefingFailed;


        alert(
          typeof detail ===
            "string"
            ? detail
            : t.briefingFailed,
        );
      }
    };


  /* =======================================================
     REPORT MESSAGE
  ======================================================= */

  const getReportMessage = (
    report,
  ) => {
    if (
      report.customMessage
    ) {
      return report.customMessage;
    }


    if (
      report.messageKey &&
      t[
        report.messageKey
      ]
    ) {
      return t[
        report.messageKey
      ];
    }


    return t.waiting;
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="upload-page">

      <div className="upload-header">

        <div>

          <h1>
            {t.pageTitle}
          </h1>


          <p>
            {t.pageSubtitle}
          </p>

        </div>


        <div className="completion-card">

          <span>
            {t.dataCompleteness}
          </span>


          <strong>
            {completeness}%
          </strong>


          <div className="completion-bar">

            <div
              className="completion-fill"
              style={{
                width:
                  `${completeness}%`,
              }}
            />

          </div>

        </div>

      </div>


      <div className="upload-grid">

        {Object.entries(
          REPORT_CONFIG,
        ).map(
          ([
            key,
            config,
          ]) => (
            <UploadCard
              key={
                key
              }

              reportKey={
                key
              }

              config={{
                ...config,

                title:
                  t.reports[
                    key
                  ],
              }}

              report={
                reports[
                  key
                ]
              }

              reportMessage={
                getReportMessage(
                  reports[
                    key
                  ],
                )
              }

              onUpload={
                handleUpload
              }

              onRejected={
                handleRejectedFiles
              }

              t={
                t
              }
            />
          ),
        )}

      </div>


      <div className="briefing-section">

        <button
          type="button"

          className={`briefing-button ${
            allReportsUploaded
              ? "active"
              : "disabled"
          }`}

          disabled={
            !allReportsUploaded
          }

          onClick={
            handleGenerateBriefing
          }
        >

          <FaBrain />

          {
            t.generateBriefing
          }

        </button>


        {!allReportsUploaded && (
          <p>
            {
              t.briefingDisabled
            }
          </p>
        )}

      </div>


      <div className="history-section">

        <h2>
          {
            t.uploadHistory
          }
        </h2>


        {uploadHistory.length ===
        0 ? (
          <p className="empty-history">
            {
              t.noHistory
            }
          </p>
        ) : (
          <table>

            <thead>

              <tr>

                <th>
                  {
                    t.table
                      .report
                  }
                </th>


                <th>
                  {
                    t.table
                      .file
                  }
                </th>


                <th>
                  {
                    t.table
                      .user
                  }
                </th>


                <th>
                  {
                    t.table
                      .uploadTime
                  }
                </th>


                <th>
                  {
                    t.table
                      .status
                  }
                </th>

              </tr>

            </thead>


            <tbody>

              {uploadHistory.map(
                (
                  item,
                  index,
                ) => (
                  <tr
                    key={`${item.report}-${item.fileName}-${index}`}
                  >

                    <td>
                      {
                        item.report
                      }
                    </td>


                    <td>
                      {
                        item.fileName
                      }
                    </td>


                    <td>
                      {
                        item.uploadedBy
                      }
                    </td>


                    <td>
                      {
                        item.uploadedAt
                      }
                    </td>


                    <td>

                      <span className="success-badge">
                        {
                          item.status
                        }
                      </span>

                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   UPLOAD CARD
========================================================= */

function UploadCard({
  reportKey,
  config,
  report,
  reportMessage,
  onUpload,
  onRejected,
  t,
}) {
  const isUploading =
    report.status ===
      "uploading" ||
    report.status ===
      "validating";


  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        [
          ".xlsx",
        ],

      "application/vnd.ms-excel":
        [
          ".xls",
        ],

      "text/csv":
        [
          ".csv",
        ],
    },


    multiple:
      false,


    disabled:
      isUploading,


    onDropAccepted:
      (
        acceptedFiles,
      ) =>
        onUpload(
          reportKey,
          acceptedFiles,
        ),


    onDropRejected:
      (
        rejectedFiles,
      ) =>
        onRejected(
          reportKey,
          rejectedFiles,
        ),
  });


  return (
    <div
      className={`upload-card ${report.status}`}
    >

      <div className="card-top">

        <div className="card-icon">
          {
            config.icon
          }
        </div>


        <div>

          <h3>
            {
              config.title
            }
          </h3>


          <p>
            {
              report.fileName ||
              t.noFileSelected
            }
          </p>

        </div>


        <div className="status-icon">

          {report.status ===
            "success" && (
            <FaCheckCircle />
          )}


          {report.status ===
            "error" && (
            <FaExclamationTriangle />
          )}

        </div>

      </div>


      <div
        {...getRootProps()}

        className={`drop-zone ${
          isDragActive
            ? "drag-active"
            : ""
        } ${
          isUploading
            ? "drop-zone-disabled"
            : ""
        }`}
      >

        <input
          {...getInputProps()}
        />


        <FaCloudUploadAlt
          className="upload-cloud"
        />


        {isUploading ? (
          <p>
            {report.status ===
            "validating"
              ? t.validatingFile
              : t.uploadingFile}
          </p>
        ) : isDragActive ? (
          <p>
            {
              t.dropFile
            }
          </p>
        ) : (
          <p>
            {
              t.dragFile
            }
          </p>
        )}


        <span>
          {
            t.supportedFiles
          }
        </span>

      </div>


      {(report.status ===
        "uploading" ||
        report.progress > 0) && (
        <div className="progress-area">

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width:
                  `${report.progress}%`,
              }}
            />

          </div>


          <span>
            {
              report.progress
            }%
          </span>

        </div>
      )}


      <div className="report-message">
        {
          reportMessage
        }
      </div>


      <div className="required-columns">

        <strong>
          {
            t.requiredColumns
          }
        </strong>


        <p>
          {
            config.requiredColumns.join(
              ", ",
            )
          }
        </p>

      </div>

    </div>
  );
}


export default UploadReports;