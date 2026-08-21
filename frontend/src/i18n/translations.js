export const translations = {
  EN: {
    common: {
      appName: "Mine Manager AI",
      loading: "Loading...",
      preparing: "Preparing...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      refresh: "Refresh",
      export: "Export",
      download: "Download",
      status: "Status",
      date: "Date",
      mine: "Mine",
      language: "Language",
      english: "English",
      mongolian: "Монгол",
      yes: "Yes",
      no: "No",
      none: "None",
      notAvailable: "Not available",
      noData: "No data available",
      current: "Current",
      target: "Target",
      actual: "Actual",
      plan: "Plan",
      variance: "Variance",
      trend: "Trend",
      forecast: "Forecast",
      drivers: "Drivers",
      recommendations: "Recommendations",
      details: "Details",
      viewDetails: "View Details",
      updated: "Updated",
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
      normal: "Normal",
      good: "Good",
      warning: "Warning",
      healthy: "Healthy",
      improving: "Improving",
      stable: "Stable",
      declining: "Declining",
      unknown: "Unknown",
    },
 
    navigation: {
      dashboard: "Dashboard",
      uploadReports: "Upload Reports",
      production: "Production",
      fleet: "Fleet",
      plant: "Plant",
      safety: "Safety",
      executiveActions: "Executive Actions",
      executiveReports: "Executive Reports",
      reports: "Reports",
      userManagement: "User Management",
      auditTrail: "Audit Trail",
      systemHealth: "System Health",
      security: "Security",
      settings: "Settings",
      supportDiagnostics: "Support Diagnostics",
      logout: "Logout",
    },
 
    dashboard: {
      title: "Executive Command Center",
      mineHealth: "Mine Health",
      executiveKpiAnalysis: "Executive KPI Analysis",
      priorityActions: "Priority Actions",
      aiDailyBriefing: "AI Daily Briefing",
      executiveInsights: "Executive Insights",
      predictiveIntelligence: "Predictive Intelligence",
      operationalPerformance: "Operational Performance",
      lastUpdated: "Last Updated",
 
      updatingDashboard: "Updating dashboard...",
      updatingKpis: "Updating KPI values and executive insights...",
      applyingScenario: "Applying scenario:",
      loadingScenario: "Loading scenario:",
      updating: "Updating",
      loadingKpi: "Loading KPI analysis...",
      preparingKpi: "Preparing drivers, recommendations, and forecast...",
      loadingKpiDetails: "Loading KPI details...",
      unableToPrepareKpi: "Unable to prepare the KPI analysis.",
 
      company: "Company",
      mine: "Mine",
      timezone: "Timezone",
      language: "Language",
      live: "Live",
      demo: "Demo",
      demoLoaded: "Demo Loaded",
      active: "Active",
      load: "Load",
      executive: "Executive",
      reset: "Reset",
      dayShift: "Day Shift",
 
      selectScenario: "Select demo scenario",
      highPerformingMine: "High Performing Mine",
      fleetBreakdown: "Fleet Breakdown",
      plantBottleneck: "Plant Bottleneck",
      safetyIncident: "Safety Incident",
      weatherDelay: "Heavy Rain / Weather Delay",
      winterOperations: "Winter Operations",
 
      stable: "Stable",
      excellent: "Excellent",
      highPriority: "High Priority",
      watch: "Watch",
      criticalReview: "Critical Review",
      weatherWatch: "Weather Watch",
      winterWatch: "Winter Watch",
      high: "High",
      medium: "Medium",
      low: "Low",
 
      overallOperationalHealth: "Overall Operational Health",
      mineHealthTrend: "Mine Health Trend",
      minorRisks: "Minor risks identified",
      attentionRequired: "Management attention required",
      versusLastWeek: "versus last week",
      versusYesterday: "vs yesterday",
 
      keyPerformanceIndicators: "Key Performance Indicators",
      viewAllKpis: "View All KPIs",
      orePerformance: "Ore Performance",
      wasteMovement: "Waste Movement",
      fleetPerformance: "Fleet Performance",
      plantPerformance: "Plant Performance",
      safetyIncidents: "Safety Incidents",
      target: "Target",
      availability: "Availability",
      throughput: "Throughput",
      score: "Score",
      actionRequired: "Action Required",
      openKpiAnalysis: "Open {title} analysis",
      last7Days: "Last 7 Days",
 
      viewAllActions: "View All Actions",
      viewFullBriefing: "View Full Briefing",
      leadershipFocus: "Leadership Focus",
      riskHeatMap: "Risk Heat Map",
      reviewRisks: "Review Risks",
      riskLow: "Low Risk",
      riskHigh: "High Risk",
      riskLowLabel: "Low",
      riskMediumLabel: "Medium",
      riskHighLabel: "High",
      riskExtremeLabel: "Extreme",
      riskProduction: "Production",
      riskEquipment: "Equipment",
      riskSafety: "Safety",
      riskGeotechnical: "Geotechnical",
      riskExternal: "External",
 
      dayMon: "Mon",
      dayTue: "Tue",
      dayWed: "Wed",
      dayThu: "Thu",
      dayFri: "Fri",
      daySat: "Sat",
      daySun: "Sun",
 
      dueToday: "Due Today",
      dueTomorrow: "Due Tomorrow",
      dueJul24: "Due Jul 24",
      kpiHint: "Select any KPI card to open its executive analysis.",
 
      liveSummaryUnavailable: "Live executive summary unavailable",
      liveSummaryUnavailableMessage:
        "The latest live KPI summary could not be loaded. Existing dashboard content is preserved.",
      retryExecutiveSummary: "Retry Executive Summary",
      analyticsUnavailable: "Shared analytics unavailable",
      analyticsUnavailableMessage:
        "Trend analytics could not be loaded. Core dashboard KPIs remain available.",
      retryAnalytics: "Retry Analytics",
      liveSummaryLoadError: "Unable to load the latest live executive KPI summary.",
      sharedAnalyticsLoadError: "Unable to load shared analytics.",
 
      executiveDemoLoaded: "Executive Demo Loaded",
      scenarioLoadedSuccessfully: "scenario loaded successfully.",
      demoLoadFailed: "Demo Load Failed",
      checkBackendAndRetry: "Check the backend connection and try again.",
      restoringLiveView: "Restoring live dashboard...",
      demoReset: "Demo Reset",
      restoredToLiveView: "Dashboard restored to live view.",
      resetFailed: "Reset Failed",
 
      scenarioContent: {
        highPerforming: {
          priorityAction:
            "Maintain high performance while monitoring fatigue and equipment stress",
          riskMessage:
            "Mine is exceeding plan across key operating areas. Main risk is sustaining performance without increasing fatigue or equipment wear.",
        },
        fleetBreakdown: {
          priorityAction:
            "Launch the fleet recovery plan and prioritize repairs on the highest-downtime trucks",
          riskMessage:
            "Fleet availability has declined to 68.8%, fleet utilization is 71.1%, and average breakdown duration has increased to 9.0 hours per truck. Production and maintenance recovery require coordinated management action.",
        },
        plantBottleneck: {
          priorityAction: "Review crusher and mill bottleneck constraints",
          riskMessage:
            "Plant throughput is below target. Processing bottleneck may impact daily production delivery.",
        },
        safetyIncident: {
          priorityAction:
            "Complete safety incident review and corrective action verification",
          riskMessage:
            "A recordable safety incident has been detected. Immediate leadership review is required.",
        },
        weatherDelay: {
          priorityAction:
            "Adjust mine plan for weather delay and prioritize safe haul road recovery",
          riskMessage:
            "Heavy rain is reducing haul road conditions, lowering fleet productivity and delaying waste movement. Focus on road maintenance, water management, and safe operating controls.",
        },
        winterOperations: {
          priorityAction:
            "Stabilize winter operating rhythm and confirm cold-weather equipment readiness",
          riskMessage:
            "Winter conditions are reducing equipment productivity and haulage efficiency. Main risks include cold starts, icy haul roads, reduced shift productivity, and increased maintenance demand.",
        },
        stable: {
          priorityAction: "Maintain current operating discipline",
          riskMessage: "No major operational risks detected from current demo data.",
          liveRiskMessage:
            "No major operational risks detected from current KPI thresholds.",
        },
      },
 
      briefings: {
        live:
          "{mineName} is currently operating with a Mine Health Score of {mineHealthScore}. Ore performance is {orePerformance}%, waste movement is {wastePerformance}%, fleet utilization is {fleetPerformance}%, plant performance is {plantPerformance}%, and safety incidents are {safetyIncidents}.",
        highPerforming:
          "{scenario}: {mineName} is exceeding plan across major operating areas with a Mine Health Score of {mineHealthScore}. Ore improved {oreTrend}, waste improved {wasteTrend}, and fleet performance remains strong. Leadership should focus on sustaining discipline while monitoring fatigue, equipment stress, and overproduction risk.",
        fleetBreakdown:
          "{scenario}: {mineName} is experiencing reduced haulage capacity. Fleet utilization has fallen to {fleetPerformance}%, changing {fleetTrend} versus yesterday. Maintenance recovery planning and equipment availability should be treated as today’s operating priority.",
        plantBottleneck:
          "{scenario}: Processing performance is constraining the operation. Plant performance has fallen to {plantPerformance}%, changing {plantTrend} versus yesterday. The immediate focus should be crusher, mill, and throughput constraint recovery.",
        safetyIncident:
          "{scenario}: A recordable safety incident has been detected. Leadership focus should shift immediately to incident review, corrective action verification, and visible field leadership.",
        weatherDelay:
          "{scenario}: Operations are under weather-related pressure. Ore delivery and waste movement are below plan, with waste movement changing {wasteTrend} versus yesterday. Leadership should prioritize road recovery, water management, and safe operating controls.",
        winterOperations:
          "{scenario}: {mineName} is operating under cold-weather constraints. Fleet productivity is changing {fleetTrend}, and waste movement is below plan. Leadership should focus on cold-start readiness, haul road ice controls, shift productivity, and maintenance response capacity.",
        stable:
          "{mineName} is operating within expected demo thresholds. Continue monitoring production, fleet, plant, safety, and workforce indicators.",
      },
 
      staticPriorityActions: {
        reviewLoadingConstraints:
          "Review loading constraints during the daily operating review",
        confirmMaintenanceRecovery:
          "Confirm maintenance recovery plan for critical equipment",
      },
 
      kpiDefinitions: {
        ore: {
          name: "Ore Performance",
          driver1: "Ore delivery against the daily mine plan",
          driver2: "Fleet availability and loading-unit productivity",
          driver3: "Crusher feed continuity and material quality",
          recommendation1:
            "Protect the highest-value ore movements in the next shift plan.",
          recommendation2:
            "Review loading and hauling constraints during the daily operating review.",
          recommendation3:
            "Confirm crusher feed continuity and stockpile readiness.",
        },
        waste: {
          name: "Waste Movement",
          driver1: "Haul road conditions and travel-cycle efficiency",
          driver2: "Waste fleet allocation and dispatch discipline",
          driver3: "Dump availability and dozer support",
          recommendation1:
            "Prioritize constrained waste routes and restore haul-road conditions.",
          recommendation2:
            "Rebalance trucks between ore and waste based on the shift bottleneck.",
          recommendation3:
            "Confirm dump capacity and dozer coverage before the next shift.",
        },
        fleet: {
          name: "Fleet Performance",
          driver1: "Mobile-equipment availability and unplanned downtime",
          driver2: "Queue time, idle time, and dispatch effectiveness",
          driver3: "Operator coverage and shift-change losses",
          recommendation1:
            "Assign owners to the top equipment downtime events.",
          recommendation2:
            "Review dispatch exceptions and excessive queue time.",
          recommendation3:
            "Protect fleet availability through the next maintenance window.",
        },
        plant: {
          name: "Plant Performance",
          driver1: "Crusher and mill operating availability",
          driver2: "Feed continuity, blend stability, and ore characteristics",
          driver3: "Planned and unplanned processing delays",
          recommendation1:
            "Review the largest throughput loss with the processing superintendent.",
          recommendation2:
            "Stabilize feed blend and stockpile replenishment.",
          recommendation3:
            "Confirm recovery actions for the next constrained plant asset.",
        },
        safety: {
          name: "Safety Incidents",
          driver1: "Critical-control verification and field leadership",
          driver2: "Changes in operating conditions and task risk",
          driver3: "Quality and closure of corrective actions",
          recommendation1:
            "Verify critical controls for the next shift's highest-risk activities.",
          recommendation2:
            "Escalate overdue safety actions to the responsible leader.",
          recommendation3:
            "Confirm visible field leadership in active work areas.",
        },
        mineHealth: {
          name: "Mine Health Score",
          driver1: "Production performance against plan",
          driver2: "Fleet and plant operating stability",
          driver3: "Safety performance and critical-risk exposure",
          recommendation1:
            "Prioritize the largest negative contributor to the Mine Health Score.",
          recommendation2:
            "Coordinate cross-functional recovery actions across operations and maintenance.",
          recommendation3:
            "Monitor leading indicators and confirm accountable action owners.",
        },
      },
 
      kpiDetailDynamic: {
        executiveInsight:
          "{mineName} {kpiName} is currently {currentValue}{unit} against a target of {target}{unit}. Under the {scenario} scenario, the main leadership focus is to protect operating discipline while addressing the most material constraint reflected in this KPI.",
        forecastHigh:
          "Without immediate corrective action, this KPI may continue to weaken during the next operating period.",
        forecastMedium:
          "Performance can recover toward target if the recommended actions are completed during the next shift cycle.",
        forecastLow:
          "Current performance is expected to remain stable if operating controls and planned actions are sustained.",
      },
    },
 
    executiveInsights: {
      "ariaLabel": "AI Executive Insights",
      "eyebrow": "Decision Support Intelligence",
      "title": "AI Executive Insights",
      "demoScenario": "Demo Scenario",
      "liveIntelligence": "Live Intelligence",
      "noHeadline": "No executive insight headline is currently available.",
      "reportingPeriodUnavailable": "Reporting period unavailable",
      "insightsCount": "{count} executive insights",
      "refreshAria": "Refresh executive insights",
      "loading": "Loading AI executive insights...",
      "unavailable": "Executive insights unavailable",
      "loadError": "Unable to load AI executive insights.",
      "empty": "No executive insights are currently available.",
      "executiveHeadline": "Executive Headline",
      "scenarios": {
        "highPerformingMine": "High Performing Mine",
        "fleetBreakdown": "Fleet Breakdown",
        "plantBottleneck": "Plant Bottleneck",
        "safetyIncident": "Safety Incident",
        "weatherDelay": "Heavy Rain / Weather Delay",
        "winterOperations": "Winter Operations"
      }
    },
 
    predictionSummary: {
      "ariaLabel": "Predictive Intelligence",
      "sprintLabel": "Sprint 10.19",
      "title": "Predictive Intelligence",
      "subtitle": "Short-term operational forecasts for the next three shifts.",
      "forecastGenerated": "Forecast generated",
      "notGenerated": "Not generated",
      "refreshing": "Refreshing",
      "refreshForecasts": "Refresh forecasts",
      "loadingTitle": "Loading Predictive Intelligence",
      "loadingMessage": "Analysing recent KPI performance and generating three-shift forecasts.",
      "errorTitle": "Forecasts could not be loaded",
      "loadError": "Unable to load Predictive Intelligence.",
      "tryAgain": "Try again",
      "executiveForecast": "Executive Forecast",
      "executiveForecastOutlook": "Executive Forecast Outlook",
      "forecastHorizon": "Forecast horizon: next three operational shifts",
      "overallConfidence": "Overall confidence",
      "availableForecasts": "Available forecasts",
      "dataQuality": "Data quality",
      "outlook": {
        "improving": "Improving",
        "attentionRequired": "Attention Required",
        "stable": "Stable",
        "unavailable": "Unavailable"
      },
      "dataQualityStatus": {
        "good": "Good",
        "fair": "Fair",
        "poor": "Poor",
        "complete": "Complete",
        "partial": "Partial",
        "limited": "Limited",
        "unknown": "Unknown"
      }
    },
 
    predictionCard: {
      "operationalKpi": "Operational KPI",
      "current": "Current",
      "threeShiftChange": "3-shift change",
      "percentagePoints": "pp",
      "nextShift": "Next shift",
      "shiftPlus2": "Shift +2",
      "shiftPlus3": "Shift +3",
      "forecastConfidence": "Forecast confidence",
      "confidenceAria": "Forecast confidence {confidence}%",
      "historyPoints": "Based on {count} historical points",
      "forecastUnavailable": "Forecast unavailable",
      "additionalHistoryRequired": "Additional historical KPI data is required before a forecast can be generated.",
      "trend": {
        "improving": "Improving",
        "declining": "Declining",
        "stable": "Stable",
        "unavailable": "Unavailable"
      },
      "ribbon": {
        "unavailable": "Unavailable",
        "executiveFocus": "Executive Focus",
        "criticalForecast": "Critical Forecast",
        "improving": "Improving",
        "watchList": "Watch List"
      },
      "health": {
        "unavailable": "Unavailable",
        "healthy": "Healthy",
        "watch": "Watch",
        "critical": "Critical"
      }
    },
 
    predictionRecommendation: {
      "title": "AI Recommended Action",
      "expectedBenefit": "Expected benefit",
      "suggestedOwner": "Suggested owner",
      "status": {
        "dataRequired": "Data Required",
        "priorityAction": "Priority Action",
        "maintainMomentum": "Maintain Momentum",
        "monitor": "Monitor",
        "maintainControls": "Maintain Controls",
        "executiveReview": "Executive Review",
        "validateForecast": "Validate Forecast"
      },
      "owner": {
        "dataReporting": "Data and Reporting Team",
        "miningOperations": "Mining Operations",
        "maintenanceDispatch": "Maintenance and Dispatch",
        "processingOperations": "Processing Operations",
        "hseOperations": "HSE and Operations",
        "mineManagement": "Mine Management Team",
        "operationalOwner": "Operational Owner"
      },
      "dataRequired": {
        "action": "Load additional historical KPI data before taking forecast-based action.",
        "benefit": "Improve forecast reliability and enable operational recommendations."
      },
      "ore": {
        "declining": {
          "action": "Review shovel availability, ore exposure, mining sequence, and crusher feed constraints before the next shift.",
          "benefit": "Reduce the forecast production decline and protect ore delivery against plan."
        },
        "improving": {
          "action": "Maintain the current ore mining sequence and monitor shovel and crusher performance.",
          "benefit": "Sustain production performance while protecting the current operating rhythm."
        },
        "stable": {
          "action": "Confirm ore exposure, shovel allocation, and crusher feed readiness for the next three shifts.",
          "benefit": "Prevent stable performance from moving into a declining production trend."
        }
      },
      "waste": {
        "declining": {
          "action": "Review truck allocation, haul-road delays, dump access, and waste movement priorities.",
          "benefit": "Protect waste stripping progress and reduce schedule disruption."
        },
        "stable": {
          "action": "Maintain current truck allocation and continue monitoring haul-road and dump constraints.",
          "benefit": "Keep waste movement aligned with the short-term mining plan."
        }
      },
      "fleet": {
        "declining": {
          "action": "Prioritize critical truck maintenance, review dispatch delays, and investigate utilization losses before the next shift.",
          "benefit": "Recover fleet capacity and reduce the predicted deterioration in availability and utilization."
        },
        "improving": {
          "action": "Maintain current dispatch and maintenance controls while monitoring equipment reliability.",
          "benefit": "Sustain fleet performance and protect production capacity."
        },
        "stable": {
          "action": "Review truck availability, utilization, idle time, and upcoming maintenance exposure.",
          "benefit": "Prevent stable fleet performance from moving into decline."
        }
      },
      "plant": {
        "declining": {
          "action": "Review throughput bottlenecks, recovery losses, feed variability, and planned plant downtime.",
          "benefit": "Reduce the forecast performance loss and protect processing output."
        },
        "stable": {
          "action": "Maintain current operating settings and monitor throughput, recovery, and feed stability.",
          "benefit": "Sustain plant performance through the forecast period."
        }
      },
      "safety": {
        "declining": {
          "action": "Review incidents, near misses, critical-risk controls, and supervisor field verification before the next shift.",
          "benefit": "Strengthen preventive controls and reduce exposure to high-consequence risk."
        },
        "stable": {
          "action": "Maintain current critical-risk controls and continue monitoring leading safety indicators.",
          "benefit": "Preserve strong safety performance through the forecast period."
        }
      },
      "health": {
        "declining": {
          "action": "Review the declining KPI drivers and assign owners to the highest-risk operational constraints.",
          "benefit": "Stabilize overall Mine Health before the decline affects multiple operating areas."
        },
        "improving": {
          "action": "Maintain the current operating rhythm and continue monitoring the leading KPI drivers.",
          "benefit": "Sustain the improving Mine Health position."
        },
        "stable": {
          "action": "Review the leading KPI drivers and maintain focus on production, fleet, plant, and safety controls.",
          "benefit": "Prevent a stable Mine Health forecast from moving into decline."
        }
      },
      "generic": {
        "declining": {
          "action": "Review the operational drivers behind the forecast decline and assign a corrective action owner.",
          "benefit": "Reduce the predicted KPI deterioration over the next three shifts."
        },
        "monitor": {
          "action": "Maintain current controls and monitor the KPI during the next three shifts.",
          "benefit": "Protect current performance and identify early deterioration."
        },
        "validate": {
          "action": "Validate the underlying data and review the forecast before taking action.",
          "benefit": "Improve decision quality by confirming the forecast inputs."
        }
      }
    },
 
    predictionSparkline: {
      "current": "Current",
      "forecastTrendAria": "Three-shift forecast trend",
      "noForecastAvailable": "No forecast available"
    },
 
    executiveForecastRiskStrip: {
      "ariaLabel": "Executive Forecast Summary",
      "eyebrow": "Executive Forecast Summary",
      "attentionRequired": "Operational attention required",
      "stablePosition": "Forecast position is stable",
      "kpisAtRisk": "KPIs at risk",
      "onWatch": "On watch",
      "improving": "Improving",
      "primaryRisks": "Primary risks",
      "noNegativeForecast": "No negative three-shift forecast identified.",
      "overallConfidence": "Overall confidence",
      "percentagePoints": "pp",
      "confidenceAria": "Overall forecast confidence"
    },
 
    executiveAiInsightCard: {
      "defaultTitle": "AI Executive Insight",
      "severity": {
        "critical": "Critical",
        "high": "High Priority",
        "medium": "Medium Priority",
        "low": "Low Priority",
        "unavailable": "Priority Unavailable"
      },
      "executiveSummary": "Executive Summary",
      "noExecutiveInterpretation": "Executive interpretation is not currently available for this KPI.",
      "performance": "Performance",
      "variance": "Variance",
      "performanceTrend": "Performance Trend",
      "noTrendInformation": "Trend information is not currently available.",
      "likelyDriver": "Likely Driver",
      "noDriverIdentified": "No material operating driver identified.",
      "estimatedImpact": "Estimated Impact",
      "noNegativeImpact": "No material negative impact estimated.",
      "recommendedPriority": "Recommended Management Priority",
      "continueMonitoring": "Continue monitoring operational performance.",
      "ruleBasedEstimate": "Rule-based estimate",
      "sourceBase": "Operational KPI trends, configured targets",
      "and": "and",
      "confidenceAria": "Executive insight confidence"
    },
 
    executiveKpiDetail: {
      "title": "Executive KPI Analysis",
      "kpiDetail": "KPI Detail",
      "liveData": "Live Data",
      "last7Days": "Last 7 Days",
      "generating": "Generating...",
      "exportPdf": "Export PDF",
      "closeAria": "Close KPI detail",
      "dismissExportSuccess": "Dismiss export success message",
      "dismissExportError": "Dismiss export error",
      "exportSuccess": "Executive KPI Analysis PDF downloaded successfully.",
      "exportError": "Unable to generate the Executive KPI PDF.",
      "loadErrorTitle": "Unable to load KPI analysis",
      "retry": "Retry",
      "currentValue": "Current Value",
      "currentPeriod": "Current period",
      "target": "Target",
      "configuredPlan": "Configured plan",
      "change": "Change",
      "versusPreviousPeriod": "Versus previous period",
      "confidence": "Confidence",
      "aiAnalysisConfidence": "AI analysis confidence",
      "performanceTrend": "Performance Trend",
      "dailyValuesSubtitle": "Daily values for the selected period",
      "trendChartAria": "KPI trend chart",
      "noTrendValues": "No trend values available.",
      "historicalAnalysis": "Historical Analysis",
      "operationalDrivers": "Operational Drivers",
      "operationalDriversSubtitle": "Linked operating conditions influencing this KPI",
      "supportingData": "Supporting Data",
      "supportingDataSubtitle": "Evidence used in the KPI analysis",
      "executiveStatus": "Executive Status",
      "noAnalysis": "No KPI analysis is available.",
      "configuredMine": "Configured Mine",
      "medium": "Medium",
      "operationalDriverFallback": "Operational Driver {number}",
      "dayFallback": "Day {number}",
      "statusAria": "KPI status: {status}",
      "status": {
        "unavailable": "Status unavailable",
        "unavailableHeadline": "Performance status cannot be calculated",
        "unavailableDescription": "Current performance or target information is unavailable.",
        "aboveTarget": "Above target",
        "aboveTargetHeadline": "Current performance is above target",
        "aboveTargetDescription": "Performance is {gap}% better than the configured target.",
        "belowTarget": "Below target",
        "belowTargetHeadline": "Current performance is below target",
        "belowTargetDescription": "Performance is {gap}% behind the configured target.",
        "nearTarget": "Near target",
        "nearTargetHeadline": "Current performance is close to target",
        "nearTargetDescription": "Performance is within {threshold}% of the configured target."
      }
    },
 
    executiveRecommendationCard: {
      "defaultTitle": "AI Recommended Actions",
      "aiDecisionSupport": "AI Decision Support",
      "saving": "Saving...",
      "defaults": {
        "operations": "Operations",
        "nextShift": "Next shift",
        "reviewRecommendation": "Review this operational recommendation."
      },
      "priority": {
        "high": "High Priority",
        "medium": "Medium Priority",
        "low": "Low Priority",
        "unavailable": "Priority Unavailable"
      },
      "status": {
        "open": "Open",
        "inProgress": "In Progress",
        "completed": "Completed",
        "blocked": "Blocked"
      },
      "errors": {
        "syncFailed": "Unable to synchronize executive actions.",
        "notSynchronized": "This action has not finished synchronizing with the backend.",
        "updateFailed": "Unable to update the action status."
      },
      "messages": {
        "statusUpdated": "Action status updated to {status}."
      },
      "syncing": "Syncing",
      "collapseAll": "Collapse All",
      "expandAll": "Expand All",
      "actionsCount": "{count} actions",
      "actionProgressSummaryAria": "Action progress summary",
      "executionOverview": "Execution Overview",
      "actionProgressSummary": "Action Progress Summary",
      "completedLower": "completed",
      "totalActions": "Total Actions",
      "overallCompletion": "Overall Completion",
      "actionCompletionProgressAria": "Action completion progress",
      "completedOfActions": "{complete} of {total} actions",
      "linkedTo": "Linked to",
      "linkedRootCause": "Linked Root Cause",
      "expectedOperationalBenefit": "Expected Operational Benefit",
      "actionWorkflow": "Action Workflow",
      "updateActionStatus": "Update action status",
      "statusPersistenceNote": "Status changes are saved to PostgreSQL and remain available after refreshing the browser.",
      "responsibleFunction": "Responsible Function",
      "recommendedTiming": "Recommended Timing",
      "loadingActions": "Loading executive actions",
      "noImmediateActions": "No immediate actions required",
      "synchronizingRecommendations": "Synchronizing AI recommendations with PostgreSQL.",
      "noAdditionalRecommendation": "Current KPI performance does not require an additional AI recommendation."
    },
 
    executiveRootCauseCard: {
      "defaultTitle": "Root Cause Analysis",
      "aiDiagnosticAnalysis": "AI Diagnostic Analysis",
      "collapseAll": "Collapse All",
      "expandAll": "Expand All",
      "identifiedCount": "{count} identified",
      "defaults": {
        "operations": "Operations",
        "operationalConstraint": "Operational constraint"
      },
      "impact": {
        "high": "High Impact",
        "medium": "Medium Impact",
        "low": "Low Impact",
        "unavailable": "Impact Unavailable"
      },
      "confidenceValue": "{confidence}% confidence",
      "confidenceUnavailable": "Confidence unavailable",
      "supportingEvidence": "Supporting Evidence",
      "expectedOperationalImpact": "Expected Operational Impact",
      "responsibleFunction": "Responsible Function",
      "aiConfidence": "AI Confidence",
      "aiConfidenceAria": "AI confidence for {title}",
      "noMaterialRootCauses": "No material root causes detected",
      "noSignificantConstraint": "Current KPI performance does not indicate a significant operational constraint."
    },
 
    historicalAnalysisCard: {
      "defaultTitle": "Historical Analysis",
      "trendLabel": "Trend",
      "rollingAverage": "Rolling Avg",
      "volatilityLabel": "Volatility",
      "previous": "Previous",
      "change": "Change",
      "aiTrendSummary": "AI Trend Summary",
      "summary": "Overall trend is {trend}. Rolling average is {average} with {volatility} volatility.",
      "trend": {
        "stable": "Stable",
        "improving": "Improving",
        "declining": "Declining"
      },
      "volatility": {
        "low": "Low",
        "medium": "Medium",
        "high": "High"
      }
    },
 
    operationalDriversGrid: {
      "defaultTitle": "Operational Drivers",
      "defaultSubtitle": "Linked operating conditions influencing this KPI",
      "defaultEmptyMessage": "Operational driver data is not available for this KPI.",
      "driverFallback": "Operational Driver {number}",
      "driverCountSingle": "{count} driver",
      "driverCountPlural": "{count} drivers",
      "loadingAria": "{title} loading",
      "noAnalysis": "No driver analysis available",
      "noChangeData": "No change data",
      "viewDetails": "View driver details",
      "openDetailsAria": "Open {name} details",
      "impact": {
        "critical": "Critical",
        "high": "High",
        "medium": "Medium",
        "low": "Low",
        "unrated": "Unrated"
      }
    },
 
    supportingDataTable: {
      "defaultTitle": "Supporting Data",
      "defaultSubtitle": "Evidence used in the KPI analysis",
      "defaultEmptyMessage": "Supporting data is not available for this KPI.",
      "rowFallback": "Row {number}",
      "rowCountSingle": "{count} row",
      "rowCountPlural": "{count} rows",
      "export": "Export",
      "exportAria": "Export supporting data",
      "loadingAria": "Supporting data loading",
      "noData": "No supporting data available",
      "date": "Date",
      "actual": "Actual",
      "plan": "Plan",
      "variance": "Variance",
      "percentOfPlan": "% of Plan"
    },
 
    relatedExecutiveActions: {
      "eyebrow": "Connected Executive Intelligence",
      "title": "Related Executive Actions",
      "subtitle": "Live management actions linked to this KPI.",
      "refresh": "Refresh",
      "refreshAria": "Refresh related executive actions",
      "openActionCenter": "Open Action Center",
      "summary": {
        "total": "Total",
        "completion": "Completion"
      },
      "status": {
        "open": "Open",
        "inProgress": "In Progress",
        "completed": "Completed",
        "blocked": "Blocked"
      },
      "priority": {
        "critical": "Critical",
        "high": "High",
        "medium": "Medium",
        "low": "Low"
      },
      "loadingTitle": "Loading executive actions",
      "loadingMessage": "Retrieving live action data for this KPI.",
      "errorTitle": "Unable to load executive actions",
      "retry": "Retry",
      "emptyTitle": "No related executive actions yet",
      "emptyMessage": "Actions created from this KPI will appear here automatically.",
      "untitledAction": "Untitled executive action",
      "updateStatusAria": "Update status for {title}",
      "ownerNotAssigned": "Owner not assigned",
      "noDueDate": "No due date",
      "rootCause": "Root Cause {cause}",
      "expectedBenefit": "Expected Benefit",
      "updatingStatus": "Updating status…"
    },
 
    executiveActionAnalytics: {
      title: "Executive Action Analytics",
      subtitle:
        "Management action performance, accountability, and completion insights.",
 
      refreshAnalytics: "Refresh Analytics",
      refreshing: "Refreshing...",
      retry: "Retry",
 
      completionRate: "Completion Rate",
      completionSubtitle:
        "{completed} of {total} actions completed",
 
      averageDaysToClose: "Average Days to Close",
      averageResolutionTime: "Average action resolution time",
 
      overdueActions: "Overdue Actions",
      overdueActionsSubtitle: "Actions beyond their due date",
 
      criticalActions: "Critical Actions",
      criticalActionsSubtitle: "Actions requiring urgent attention",
 
      priorityDistribution: "Priority Distribution",
      priorityDistributionSubtitle:
        "Current actions grouped by management priority.",
      noPriorityAnalytics: "No priority analytics are available.",
 
      statusDistribution: "Status Distribution",
      statusDistributionSubtitle:
        "Current actions grouped by execution status.",
      noStatusAnalytics: "No status analytics are available.",
 
      topActionOwners: "Top Action Owners",
      topActionOwnersSubtitle:
        "Owners with the highest number of assigned actions.",
      noOwnerAnalytics: "No owner analytics are available.",
 
      topKpiCategories: "Top KPI Categories",
      topKpiCategoriesSubtitle:
        "Operational areas generating the most management actions.",
      noKpiCategoryAnalytics:
        "No KPI category analytics are available.",
 
      priorityCritical: "Critical",
      priorityHigh: "High",
      priorityMedium: "Medium",
      priorityLow: "Low",
 
      statusOpen: "Open",
      statusInProgress: "In Progress",
      statusCompleted: "Completed",
      statusBlocked: "Blocked",
 
      unknown: "Unknown",
    },
 
    executiveActionSummary: {
      executionOverview: "Execution Overview",
      selectCardToFilter:
        "Select a card to filter the executive-action table.",
      summaryFilterActive: "Summary filter active",
 
      totalActions: "Total Actions",
      allExecutiveActions: "All executive actions",
      open: "Open",
      notYetStarted: "Not yet started",
      inProgress: "In Progress",
      currentlyBeingExecuted: "Currently being executed",
      completed: "Completed",
      successfullyClosed: "Successfully closed",
      blocked: "Blocked",
      requiresIntervention: "Requires intervention",
      completionRate: "Completion Rate",
      overallCompletion: "Overall completion",
 
      active: "Active",
      filtering: "Filtering",
      viewActions: "View actions",
 
      executiveActionCompletion: "Executive Action Completion",
      loadingActionProgress: "Loading action progress...",
      actionsCompletedProgress:
        "{completed} of {total} actions completed",
 
      deliveryAccountability: "Delivery & Accountability",
      deliveryDescription:
        "Time-sensitive actions, priority exposure, and closure performance.",
 
      dueToday: "Due Today",
      actionsRequiringAttentionToday:
        "Actions requiring attention today",
      overdue: "Overdue",
      pastDueAndStillActive: "Past due and still active",
      highPriority: "High Priority",
      criticalAndHighActiveActions:
        "Critical and high active actions",
      completedThisMonth: "Completed This Month",
      actionsClosedThisMonth: "Actions closed this month",
      averageCloseTime: "Average Close Time",
      averageDaysCreationToClosure:
        "Average days from creation to closure",
      daysValue: "{value} days",
    },
 
    executiveActionFilters: {
      title: "Filter Executive Actions",
      subtitle:
        "Narrow the table by keyword, status, priority, or owner.",
      clearFilters: "Clear Filters",
      search: "Search",
      searchActions: "Search actions",
      status: "Status",
      allStatuses: "All Statuses",
      open: "Open",
      toDo: "To Do",
      inProgress: "In Progress",
      blocked: "Blocked",
      completed: "Completed",
      priority: "Priority",
      allPriorities: "All Priorities",
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
      owner: "Owner",
      allOwners: "All Owners",
    },
 

    executiveActionDialog: {
      editTitle: "Edit Executive Action",
      createTitle: "Create Executive Action",
      editSubtitle:
        "Update ownership, priority, due date, and execution status.",
      createSubtitle:
        "Create a new operational action for management follow-up.",
      closeDialog: "Close dialog",

      actionDetails: "Action Details",
      actionTitle: "Action title",
      actionTitlePlaceholder:
        "Example: Investigate shovel breakdown",
      actionTitleHelper:
        "Use a clear, outcome-focused action title.",

      description: "Description",
      descriptionPlaceholder:
        "Describe the issue, expected outcome, and important context.",
      characterCount: "{count}/{max} characters",

      ownershipAndExecution:
        "Ownership and Execution",
      actionOwner: "Action owner",
      actionOwnerPlaceholder:
        "Example: Maintenance Superintendent",
      actionOwnerHelper:
        "Person or role accountable for the action.",

      dueDate: "Due date",
      dueDateHelper: "Target completion date.",

      priorityLabel: "Priority",
      priorityHelper:
        "Operational importance of this action.",

      statusLabel: "Status",
      statusHelper:
        "Current execution status.",

      categoryLabel: "Category",
      categoryHelper:
        "Used for filtering and reporting.",

      sourceLabel: "Source",
      sourceEditHelper:
        "How this action was originally created.",
      sourceCreateHelper:
        "New manager-created actions are saved as Manual.",

      liveKpiContext: "Live KPI Context",

      manualActionTitle:
        "Manual executive action",
      manualActionDescription:
        "This action will be recorded as manually created by a manager and will appear in the Executive Action Center after saving.",

      cancel: "Cancel",
      updating: "Updating...",
      creating: "Creating...",
      saveChanges: "Save Changes",
      createAction: "Create Action",

      validation: {
        actionTitleRequired:
          "Action title is required.",
        ownerRequired:
          "Action owner is required.",
        priorityRequired:
          "Priority is required.",
        statusRequired:
          "Status is required.",
        dueDateRequired:
          "Due date is required.",
      },

      priority: {
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low",
      },

      status: {
        open: "Open",
        toDo: "To Do",
        inProgress: "In Progress",
        blocked: "Blocked",
        completed: "Completed",
      },

      category: {
        geotechnical: "Geotechnical",
        environment: "Environment",
        other: "Other",
      },
    },

    executiveActionKpiContext: {
      linkedKpi: "Linked KPI",
      unknown: "Unknown",
      onTarget: "On Target",
      belowTarget: "Below Target",

      loading:
        "Loading live KPI context...",
      retry: "Retry",
      loadError:
        "Unable to load live KPI context for this executive action.",
      noKpiLinked:
        "No KPI is linked to this executive action.",

      liveKpiContext: "LIVE KPI CONTEXT",
      currentValue: "Current Value",
      target: "Target",
      variance: "Variance",
      relatedActions: "Related Actions",
      primaryRootCause:
        "Primary Root Cause",
      rootCauseUnavailable:
        "Root-cause analysis is not available for this KPI context yet.",

      backToKpiDashboard:
        "Back to KPI Dashboard",
      clearKpiFilter:
        "Clear KPI Filter",
      relatedActionsCount:
        "{count} Related Actions",
    },

    executiveActionTable: {
      changeStatus: "Change status",
      updating: "Updating...",
      untitledAction: "Untitled Executive Action",
      unassigned: "Unassigned",
      operations: "Operations",
      noDueDate: "No due date",
      manual: "Manual",
      overdue: "Overdue",
      editAction: "Edit action",
      deleteAction: "Delete action",
      emptyTitle: "No executive actions found",
      emptyMessage:
        "Create a new action or adjust the filters to display existing actions.",
      showingSingle: "Showing {count} executive action",
      showingPlural: "Showing {count} executive actions",
 
      columns: {
        action: "Action",
        category: "Category",
        priority: "Priority",
        owner: "Owner",
        dueDate: "Due Date",
        status: "Status",
        actions: "Actions",
      },
 
      status: {
        open: "Open",
        inProgress: "In Progress",
        completed: "Completed",
        blocked: "Blocked",
      },
 
      priority: {
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low",
      },
    },
 
    dynamicKpiNames: {
      mineHealth: "Mine Health",
      oreProduction: "Ore Production",
      wasteMovement: "Waste Movement",
      fleetPerformance: "Fleet Performance",
      plantPerformance: "Plant Performance",
      safetyPerformance: "Safety Performance",
    },
 
    dynamicScenarios: {
      highPerformingMine: "High Performing Mine",
      fleetBreakdown: "Fleet Breakdown",
      plantBottleneck: "Plant Bottleneck",
      safetyIncident: "Safety Incident",
      weatherDelay: "Heavy Rain / Weather Delay",
      winterOperations: "Winter Operations",
    },
 
    dynamicOutlooks: {
      improving: "Improving",
      declining: "Declining",
      stable: "Stable",
      attentionRequired: "Attention Required",
      unavailable: "Unavailable",
    },
 
    production: {
      title: "Production",
      orePlan: "Ore Plan",
      oreActual: "Ore Actual",
      wastePlan: "Waste Plan",
      wasteActual: "Waste Actual",

      operationalIntelligence: "Operational Intelligence",
      productionPerformance: "Production Performance",
      pageSubtitle:
        "Daily ore and waste movement performance against operating plan.",
      reportingDate: "Reporting Date",
      refreshProductionData: "Refresh production data",
      loadingProductionIntelligence:
        "Loading production intelligence...",
      unableToLoadAnalytics:
        "Unable to load production analytics.",

      dailyProductionStatus: "Daily Production Status",
      abovePlan: "Above Plan",
      nearPlan: "Near Plan",
      belowPlan: "Below Plan",
      statusDescriptionAbovePlan:
        "Production delivery is currently meeting or exceeding the operating plan.",
      statusDescriptionNearPlan:
        "Production delivery is close to plan and requires continued operational monitoring.",
      statusDescriptionBelowPlan:
        "Production delivery is currently below plan and requires management attention.",

      oreProduction: "Ore Production",
      wasteMovement: "Waste Movement",
      overallMaterialMovement: "Overall Material Movement",
      ofPlan: "of plan",
      combinedPlanAttainment: "Combined plan attainment",

      keyProductionIndicators: "Key Production Indicators",
      currentShiftPerformance:
        "Current shift performance against operating plan.",
      productionDelivery: "Production Delivery",
      materialMovement: "Material Movement",
      overallPerformance: "Overall Performance",
      planAttainment: "Plan Attainment",
      plan: "Plan",
      actual: "Actual",
      variance: "Variance",

      performanceHistory: "Performance History",
      productionPerformanceTrend:
        "Production Performance Trend",
      trendSubtitle:
        "Actual versus planned production performance over the last 30 days.",
      chartActualAgainstPlan:
        "actual performance against plan, last 30 days",
      thirtyDayTrend: "30 Day Trend",

      ore: "Ore",
      waste: "Waste",
      atOrAbovePlan: "At / Above Plan",
      actualAtOrAbovePlan: "Actual ≥ Plan",
      actualBelowPlan: "Actual < Plan",
    },
 
    fleet: {
      title: "Fleet Performance",

      operationalIntelligence:
        "Operational Intelligence",

      pageDescription:
        "Availability and utilization performance across the operating fleet.",

      reportingDate:
        "Reporting Date",

      unavailable:
        "Unavailable",

      unableToLoad:
        "Unable to load fleet analytics.",

      fleetKpi:
        "Fleet KPI",

      target:
        "Target",

      healthy:
        "Healthy",

      attentionRequired:
        "Attention Required",

      critical:
        "Critical",

      fleetOperatingStatus:
        "Fleet Operating Status",

      combinedPerformanceDescription:
        "Combined availability and utilization performance.",

      availability:
        "Availability",

      utilization:
        "Utilization",

      fleetPerformance:
        "Fleet Performance",

      fleetPerformanceTrend:
        "Fleet Performance Trend",

      chartActualAgainstTarget:
        "actual performance against target, last 30 days",

      actual:
        "Actual",

      variance:
        "Variance",

      atOrAboveTarget:
        "At / Above Target",

      belowTarget:
        "Below Target",

      actualAtOrAboveTarget:
        "Actual ≥ Target",

      actualBelowTarget:
        "Actual < Target",

      truckId:
        "Truck ID",
    },
 
    plant: {
      title: "Plant Performance",

      operationalIntelligence:
        "Operational Intelligence",

      pageDescription:
        "Throughput and recovery performance against operating targets.",

      reportingDate:
        "Reporting Date",

      unavailable:
        "Unavailable",

      unableToLoad:
        "Unable to load plant analytics.",

      plantKpi:
        "Plant KPI",

      target:
        "Target",

      healthy:
        "Healthy",

      attentionRequired:
        "Attention Required",

      critical:
        "Critical",

      plantOperatingStatus:
        "Plant Operating Status",

      combinedPerformanceDescription:
        "Combined throughput and recovery performance.",

      throughputPerformance:
        "Throughput Performance",

      recovery:
        "Recovery",

      plantPerformance:
        "Plant Performance",

      actual:
        "Actual",

      variance:
        "Variance",

      atOrAboveTarget:
        "At / Above Target",

      belowTarget:
        "Below Target",

      actualAtOrAboveTarget:
        "Actual ≥ Target",

      actualBelowTarget:
        "Actual < Target",

      plantPerformanceTrend:
        "Plant Performance Trend",

      chartActualAgainstTarget:
        "actual performance against target, last 30 days",

      throughput:
        "Throughput",

      throughputPlan:
        "Throughput Plan",

      throughputActual:
        "Throughput Actual",
    },
 
    safety: {
      title: "Safety",
      incidents: "Incidents",
      nearMisses: "Near Misses",
      criticalRisks: "Critical Risks",
      safetyScore: "Safety Score",

      operationalIntelligence: "Operational Intelligence",
      safetyPerformance: "Safety Performance",
      pageDescription:
        "Safety score, incidents, near misses, and critical risk performance.",
      reportingDate: "Reporting Date",
      unavailable: "Unavailable",
      refreshSafetyData: "Refresh safety data",
      unableToLoad: "Unable to load safety analytics.",

      safetyOperatingStatus: "Safety Operating Status",
      attentionRequired: "Attention Required",
      controlled: "Controlled",
      monitor: "Monitor",
      statusDescriptionAttention:
        "A recordable incident or critical risk requires management attention.",
      statusDescriptionControlled:
        "Safety performance is controlled with no current recordable incidents or critical risks.",
      statusDescriptionMonitor:
        "No current incidents or critical risks, but the Safety Score is below target.",

      safetyKpi: "Safety KPI",
      leadingIndicator: "Leading Indicator",
      criticalControl: "Critical Control",
      atOrAboveTarget: "At / above target",
      targetValue: "Target {value}%",
      noRecordableIncidents: "No recordable incidents",
      managementAttentionRequired: "Management attention required",
      noNearMissesReported: "No near misses reported",
      reviewAndLearn: "Review and learn",
      noOpenCriticalRisks: "No open critical risks",
      immediateAttentionRequired: "Immediate attention required",

      recordableIncidents: "Recordable Incidents",
      safetyPerformanceTrend: "Safety Performance Trend",
      chartActualAgainstTarget:
        "actual performance against target, last 30 days",
      score: "Score",
      target: "Target",
      actual: "Actual",
      variance: "Variance",
      atTarget: "At Target",
      aboveTarget: "Above Target",
      actualAtOrAboveTarget: "Actual ≥ Target",
      actualBelowTarget: "Actual < Target",
      noIncidents: "No Incidents",
      incidentRecorded: "Incident Recorded",
      noNearMisses: "No Near Misses",
      noCriticalRisks: "No Critical Risks",
      criticalRiskPresent: "Critical Risk Present",
    },
 
    reports: {
      title: "Executive Reports",
      headerDescription: "Generate executive-ready reports, operational reviews, board presentations, and structured data exports for mine leadership meetings.",
      pdfReports: "PDF Reports",
      powerPointBoardPack: "PowerPoint Board Pack",
      excelExport: "Excel Export",
      availableOutputs: "Available outputs",
      availableOutputsDescription: "Daily, weekly, monthly, PowerPoint, and Excel.",
      executiveBoardPack: "Executive Board Pack",
      executiveBoardPackSubtitle: "Board-ready PowerPoint presentation for executive operational reviews.",
      onDemand: "On demand",
      newLabel: "NEW",
      dailyExecutiveReport: "Daily Executive Report",
      dailyExecutiveReportSubtitle: "Meeting-ready daily summary for mine leadership.",
      weeklyOperationsReport: "Weekly Operations Report",
      weeklyOperationsReportSubtitle: "Operational trend review for weekly performance meetings.",
      monthlyKpiPack: "Monthly KPI Pack",
      monthlyKpiPackSubtitle: "Executive KPI pack for monthly leadership review.",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      includes: "Includes",
      executiveKpiSummary: "Executive KPI Summary",
      productionTrend: "Production Trend",
      fleetPlantSafety: "Fleet, Plant & Safety",
      keyOperationalRisks: "Key Operational Risks",
      managementActions: "Management Actions",
      executiveRecommendations: "Executive Recommendations",
      executiveSummary: "Executive Summary",
      productionPerformance: "Production Performance",
      fleetPlantStatus: "Fleet & Plant Status",
      safetyRiskOverview: "Safety & Risk Overview",
      priorityActions: "Priority Actions",
      weeklyKpiTrends: "Weekly KPI Trends",
      departmentPerformance: "Department Performance",
      riskMovement: "Risk Movement",
      aiRecommendations: "AI Recommendations",
      actionFollowUp: "Action Follow-up",
      mineHealthScore: "Mine Health Score",
      monthlyKpiSummary: "Monthly KPI Summary",
      productionVariance: "Production Variance",
      riskRegister: "Risk Register",
      managementCommentary: "Management Commentary",
      generatePowerPoint: "Generate PowerPoint",
      generatingPowerPoint: "Generating PowerPoint...",
      generatePdf: "Generate PDF",
      generatingPdf: "Generating PDF...",
      exportExcel: "Export Excel",
      generatingExcel: "Generating Excel...",
      excelExportSubtitle: "Export operational datasets for analysis, sharing, and Power BI.",
      production: "Production",
      fleet: "Fleet",
      plant: "Plant",
      safety: "Safety",
      maintenance: "Maintenance",
      reportHistory: "Report History",
      reportHistoryDescription: "Recent executive reports generated by Mine Manager AI.",
      refreshReportHistory: "Refresh report history",
      loadingReportHistory: "Loading report history...",
      noReportHistory: "No report history yet",
      noReportHistoryDescription: "Generate a PDF, PowerPoint, or Excel report to create the first history record.",
      report: "Report",
      format: "Format",
      mine: "Mine",
      generated: "Generated",
      size: "Size",
      status: "Status",
      unnamedReport: "Unnamed Report",
      system: "System",
      done: "Done",
      failed: "Failed",
      unknown: "Unknown",
      historyLoadError: "Unable to load report history. Please confirm the backend is running.",
      reportGenerateError: "Unable to generate the report. Please confirm the backend is running.",
      sessionExpired: "Your session has expired. Please sign in again.",
      noReportPermission: "You do not have permission to download this report.",
      reportServiceError: "The report service encountered an error. Please review the backend logs.",
      powerPointSuccess: "Executive PowerPoint Board Pack generated successfully.",
      dailySuccess: "Daily Executive Report generated successfully.",
      weeklySuccess: "Weekly Operations Report generated successfully.",
      monthlySuccess: "Monthly KPI Pack generated successfully.",
      excelSuccess: "Executive Excel workbook exported successfully.",
      excel: "Executive Excel Export",
      powerpoint: "Executive PowerPoint Board Pack",
      history: "Report History",
    },
 
    settings: {
      title: "Settings",
      company: "Company",
      mine: "Mine",
      language: "Language",
      timezone: "Timezone",
      configuration: "Configuration",
    },
  },
 
  MN: {
    common: {
      appName: "Mine Manager AI",
      loading: "Уншиж байна...",
      preparing: "Бэлтгэж байна...",
      save: "Хадгалах",
      cancel: "Цуцлах",
      close: "Хаах",
      refresh: "Шинэчлэх",
      export: "Экспорт",
      download: "Татах",
      status: "Төлөв",
      date: "Огноо",
      mine: "Уурхай",
      language: "Хэл",
      english: "English",
      mongolian: "Монгол",
      yes: "Тийм",
      no: "Үгүй",
      none: "Байхгүй",
      notAvailable: "Мэдээлэл байхгүй",
      noData: "Өгөгдөл байхгүй",
      current: "Одоогийн",
      target: "Зорилт",
      actual: "Гүйцэтгэл",
      plan: "Төлөвлөгөө",
      variance: "Зөрүү",
      trend: "Чиг хандлага",
      forecast: "Таамаг",
      drivers: "Нөлөөлөгч хүчин зүйлс",
      recommendations: "Зөвлөмж",
      details: "Дэлгэрэнгүй",
      viewDetails: "Дэлгэрэнгүй харах",
      updated: "Шинэчилсэн",
      critical: "Ноцтой",
      high: "Өндөр",
      medium: "Дунд",
      low: "Бага",
      normal: "Хэвийн",
      good: "Сайн",
      warning: "Анхаарах",
      healthy: "Хэвийн сайн",
      improving: "Сайжирч байна",
      stable: "Тогтвортой",
      declining: "Буурч байна",
      unknown: "Тодорхойгүй",
    },
 
    navigation: {
      dashboard: "Хяналтын самбар",
      uploadReports: "Тайлан оруулах",
      production: "Олборлолт",
      fleet: "Техник",
      plant: "Баяжуулах үйлдвэр",
      safety: "Аюулгүй ажиллагаа",
      executiveActions: "Удирдлагын арга хэмжээ",
      executiveReports: "Удирдлагын тайлан",
      reports: "Тайлан",
      userManagement: "Хэрэглэгчийн удирдлага",
      auditTrail: "Үйлдлийн бүртгэл",
      systemHealth: "Системийн төлөв",
      security: "Аюулгүй байдал",
      settings: "Тохиргоо",
      supportDiagnostics: "Системийн оношилгоо",
      logout: "Гарах",
    },
 
    dashboard: {
      title: "Уурхайн удирдлагын төв",
      mineHealth: "Уурхайн ерөнхий төлөв",
      executiveKpiAnalysis: "KPI удирдлагын шинжилгээ",
      priorityActions: "Нэн тэргүүний ажлууд",
      aiDailyBriefing: "AI өдрийн товч тойм",
      executiveInsights: "AI удирдлагын дүгнэлт",
      predictiveIntelligence: "Урьдчилсан төлөв",
      operationalPerformance: "Үйл ажиллагааны гүйцэтгэл",
      lastUpdated: "Сүүлд шинэчилсэн",
 
      updatingDashboard: "Хяналтын самбарыг шинэчилж байна...",
      updatingKpis: "KPI болон удирдлагын дүгнэлтийг шинэчилж байна...",
      applyingScenario: "Сценарийг хэрэгжүүлж байна:",
      loadingScenario: "Сценарийг ачаалж байна:",
      updating: "Шинэчилж байна",
      loadingKpi: "KPI шинжилгээг уншиж байна...",
      preparingKpi: "Нөлөөлөгч хүчин зүйл, зөвлөмж, таамгийг бэлтгэж байна...",
      loadingKpiDetails: "KPI дэлгэрэнгүй мэдээллийг уншиж байна...",
      unableToPrepareKpi: "KPI шинжилгээг бэлтгэх боломжгүй байна.",
 
      company: "Компани",
      mine: "Уурхай",
      timezone: "Цагийн бүс",
      language: "Хэл",
      live: "Бодит горим",
      demo: "Демо",
      demoLoaded: "Демо бэлэн",
      active: "Идэвхтэй",
      load: "Ачаалах",
      executive: "Удирдлагын демо",
      reset: "Сэргээх",
      dayShift: "Өдрийн ээлж",
 
      selectScenario: "Демо нөхцөл сонгох",
      highPerformingMine: "Өндөр гүйцэтгэл",
      fleetBreakdown: "Техникийн эвдрэл",
      plantBottleneck: "Үйлдвэрийн хүчин чадлын хязгаарлалт",
      safetyIncident: "Аюулгүй ажиллагааны тохиолдол",
      weatherDelay: "Цаг агаарын саатал",
      winterOperations: "Өвлийн ажиллагаа",
 
      stable: "Тогтвортой",
      excellent: "Маш сайн",
      highPriority: "Нэн тэргүүний",
      watch: "Анхаарах",
      criticalReview: "Яаралтай анхаарах",
      weatherWatch: "Цаг агаарын анхааруулга",
      winterWatch: "Өвлийн ажиллагааны хяналт",
      high: "Өндөр",
      medium: "Дунд",
      low: "Бага",
 
      overallOperationalHealth: "Уурхайн ерөнхий төлөв",
      mineHealthTrend: "Уурхайн төлөвийн хандлага",
      minorRisks: "Бага эрсдэл илэрсэн",
      attentionRequired: "Анхаарал шаардлагатай",
      versusLastWeek: "өнгөрсөн 7 хоногоос",
      versusYesterday: "өчигдрөөс",
 
      keyPerformanceIndicators: "Гол KPI үзүүлэлтүүд",
      viewAllKpis: "Бүх KPI-г харах",
      orePerformance: "Хүдэр олборлолт",
      wasteMovement: "Хөрс хуулалт",
      fleetPerformance: "Техникийн гүйцэтгэл",
      plantPerformance: "Үйлдвэрийн гүйцэтгэл",
      safetyIncidents: "Аюулгүй ажиллагааны тохиолдол",
      target: "Зорилт",
      availability: "Бэлэн байдал",
      throughput: "Боловсруулах хүчин чадал",
      score: "Үнэлгээ",
      actionRequired: "Арга хэмжээ авах",
      openKpiAnalysis: "{title} шинжилгээг нээх",
      last7Days: "Сүүлийн 7 хоног",
 
      viewAllActions: "Бүх ажлыг харах",
      viewFullBriefing: "Дэлгэрэнгүй харах",
      leadershipFocus: "Удирдлагын гол анхаарал",
      riskHeatMap: "Эрсдэлийн зураглал",
      reviewRisks: "Эрсдэлийг харах",
      riskLow: "Бага эрсдэл",
      riskHigh: "Өндөр эрсдэл",
      riskLowLabel: "Бага",
      riskMediumLabel: "Дунд",
      riskHighLabel: "Өндөр",
      riskExtremeLabel: "Маш өндөр",
      riskProduction: "Үйлдвэрлэл",
      riskEquipment: "Техник",
      riskSafety: "Аюулгүй ажиллагаа",
      riskGeotechnical: "Геотехник",
      riskExternal: "Гадаад эрсдэл",
 
      dayMon: "Да",
      dayTue: "Мя",
      dayWed: "Лх",
      dayThu: "Пү",
      dayFri: "Ба",
      daySat: "Бя",
      daySun: "Ня",
 
      dueToday: "Өнөөдөр",
      dueTomorrow: "Маргааш",
      dueJul24: "7-р сарын 24-нд",
      kpiHint: "KPI карт дээр дарж дэлгэрэнгүй шинжилгээг харна уу.",
 
      liveSummaryUnavailable: "Бодит удирдлагын хураангуй боломжгүй",
      liveSummaryUnavailableMessage:
        "Хамгийн сүүлийн бодит KPI хураангуйг ачаалж чадсангүй. Одоогийн хяналтын самбарын мэдээлэл хадгалагдана.",
      retryExecutiveSummary: "Удирдлагын хураангуйг дахин оролдох",
      analyticsUnavailable: "Нэгдсэн аналитик боломжгүй",
      analyticsUnavailableMessage:
        "Чиг хандлагын аналитикийг ачаалж чадсангүй. Үндсэн KPI мэдээлэл хэвийн үргэлжилнэ.",
      retryAnalytics: "Аналитикийг дахин оролдох",
      liveSummaryLoadError:
        "Хамгийн сүүлийн бодит удирдлагын KPI хураангуйг ачаалах боломжгүй байна.",
      sharedAnalyticsLoadError: "Нэгдсэн аналитикийг ачаалах боломжгүй байна.",
 
      executiveDemoLoaded: "Удирдлагын демо ачаалагдлаа",
      scenarioLoadedSuccessfully: "сценари амжилттай ачаалагдлаа.",
      demoLoadFailed: "Демо ачаалж чадсангүй",
      checkBackendAndRetry: "Backend холболтыг шалгаад дахин оролдоно уу.",
      restoringLiveView: "Бодит хяналтын самбарыг сэргээж байна...",
      demoReset: "Демо сэргээгдлээ",
      restoredToLiveView: "Хяналтын самбар бодит горимд сэргээгдлээ.",
      resetFailed: "Сэргээж чадсангүй",
 
      scenarioContent: {
        highPerforming: {
          priorityAction:
            "Өндөр гүйцэтгэлийг хадгалахдаа ажилтны ядрал болон техникийн ачааллыг хянах",
          riskMessage:
            "Уурхай үйл ажиллагааны гол чиглэлүүдээр төлөвлөгөөнөөс давж байна. Гол эрсдэл нь ажилтны ядрал болон техникийн элэгдлийг нэмэгдүүлэхгүйгээр гүйцэтгэлийг тогтвортой хадгалах явдал юм.",
        },
        fleetBreakdown: {
          priorityAction:
            "Техникийн сэргэлтийн төлөвлөгөөг хэрэгжүүлж, хамгийн их зогсолттой машинуудын засварыг нэн тэргүүнд гүйцэтгэх",
          riskMessage:
            "Техникийн бэлэн байдал 68.8% хүртэл буурч, ашиглалт 71.1% болсон бөгөөд нэг машинд ногдох эвдрэлийн дундаж хугацаа 9.0 цаг болж нэмэгдсэн. Үйлдвэрлэл болон засварын сэргэлтэд уялдаа холбоотой удирдлагын арга хэмжээ шаардлагатай.",
        },
        plantBottleneck: {
          priorityAction:
            "Бутлуур болон тээрмийн хүчин чадлын хязгаарлалтыг шалгах",
          riskMessage:
            "Үйлдвэрийн боловсруулалт зорилтоос доогуур байна. Процессын хязгаарлалт нь өдрийн үйлдвэрлэлийн гүйцэтгэлд нөлөөлж болзошгүй.",
        },
        safetyIncident: {
          priorityAction:
            "Аюулгүй ажиллагааны тохиолдлын шалгалт болон залруулах арга хэмжээний баталгаажуулалтыг дуусгах",
          riskMessage:
            "Бүртгэгдэх аюулгүй ажиллагааны тохиолдол илэрсэн. Удирдлагын яаралтай хяналт шаардлагатай.",
        },
        weatherDelay: {
          priorityAction:
            "Цаг агаарын сааталд уурхайн төлөвлөгөөг тохируулж, тээврийн замын аюулгүй сэргэлтийг нэн тэргүүнд хэрэгжүүлэх",
          riskMessage:
            "Их бороо тээврийн замын нөхцөлийг муутгаж, техникийн бүтээмжийг бууруулан хөрс хуулалтыг саатуулж байна. Зам засвар, усны менежмент болон аюулгүй ажиллагааны хяналтад төвлөрнө үү.",
        },
        winterOperations: {
          priorityAction:
            "Өвлийн ажиллагааны хэмнэлийг тогтворжуулж, хүйтний нөхцөл дэх техникийн бэлэн байдлыг баталгаажуулах",
          riskMessage:
            "Өвлийн нөхцөл техникийн бүтээмж болон тээвэрлэлтийн үр ашгийг бууруулж байна. Гол эрсдэлүүдэд хүйтэн асаалт, мөстсөн зам, ээлжийн бүтээмж буурах болон засварын ачаалал нэмэгдэх орно.",
        },
        stable: {
          priorityAction: "Одоогийн үйл ажиллагааны сахилга батыг хадгалах",
          riskMessage:
            "Одоогийн демо өгөгдлөөр томоохон үйл ажиллагааны эрсдэл илрээгүй.",
          liveRiskMessage:
            "Одоогийн KPI босго үзүүлэлтээр томоохон үйл ажиллагааны эрсдэл илрээгүй.",
        },
      },
 
      briefings: {
        live:
          "{mineName} уурхайн одоогийн нэгдсэн төлөвийн үнэлгээ {mineHealthScore}. Хүдрийн гүйцэтгэл {orePerformance}%, хөрс хуулалт {wastePerformance}%, техникийн ашиглалт {fleetPerformance}%, үйлдвэрийн гүйцэтгэл {plantPerformance}%, аюулгүй ажиллагааны тохиолдол {safetyIncidents} байна.",
        highPerforming:
          "{scenario}: {mineName} уурхайн үйл ажиллагааны гол чиглэлүүд төлөвлөгөөнөөс давж, нэгдсэн төлөвийн үнэлгээ {mineHealthScore} байна. Хүдэр {oreTrend}, хөрс хуулалт {wasteTrend}-ийн өөрчлөлттэй бөгөөд техникийн гүйцэтгэл сайн хэвээр байна. Удирдлага гүйцэтгэлийн сахилга батыг хадгалахдаа ядрал, техникийн ачаалал болон хэт үйлдвэрлэлийн эрсдэлийг хянах шаардлагатай.",
        fleetBreakdown:
          "{scenario}: {mineName} уурхайн тээвэрлэлтийн хүчин чадал буурсан байна. Техникийн ашиглалт {fleetPerformance}% болж, өчигдрөөс {fleetTrend} өөрчлөгдсөн. Засварын сэргэлтийн төлөвлөлт болон техникийн бэлэн байдлыг өнөөдрийн үйл ажиллагааны нэн тэргүүний асуудал болгох шаардлагатай.",
        plantBottleneck:
          "{scenario}: Боловсруулалтын гүйцэтгэл үйл ажиллагааг хязгаарлаж байна. Үйлдвэрийн гүйцэтгэл {plantPerformance}% болж, өчигдрөөс {plantTrend} өөрчлөгдсөн. Бутлуур, тээрэм болон боловсруулалтын хүчин чадлын хязгаарлалтыг нэн даруй сэргээхэд төвлөрөх шаардлагатай.",
        safetyIncident:
          "{scenario}: Бүртгэгдэх аюулгүй ажиллагааны тохиолдол илэрсэн. Удирдлагын анхаарлыг тохиолдлын шалгалт, залруулах арга хэмжээний баталгаажуулалт болон талбай дахь харагдахуйц манлайлалд нэн даруй шилжүүлэх шаардлагатай.",
        weatherDelay:
          "{scenario}: Үйл ажиллагаа цаг агаарын дарамтад байна. Хүдрийн нийлүүлэлт болон хөрс хуулалт төлөвлөгөөнөөс доогуур, хөрс хуулалт өчигдрөөс {wasteTrend} өөрчлөгдсөн. Замын сэргэлт, усны менежмент болон аюулгүй ажиллагааны хяналтыг нэн тэргүүнд хэрэгжүүлэх шаардлагатай.",
        winterOperations:
          "{scenario}: {mineName} уурхай хүйтний нөхцөлд ажиллаж байна. Техникийн бүтээмж {fleetTrend} өөрчлөгдөж, хөрс хуулалт төлөвлөгөөнөөс доогуур байна. Хүйтэн асаалтын бэлэн байдал, замын мөсний хяналт, ээлжийн бүтээмж болон засварын хариу арга хэмжээний хүчин чадалд төвлөрөх шаардлагатай.",
        stable:
          "{mineName} уурхай демо горимын хүлээгдэж буй босго үзүүлэлтийн хүрээнд ажиллаж байна. Үйлдвэрлэл, техник, үйлдвэр, аюулгүй ажиллагаа болон хүний нөөцийн үзүүлэлтүүдийг үргэлжлүүлэн хянана уу.",
      },
 
      staticPriorityActions: {
        reviewLoadingConstraints:
          "Өдрийн үйл ажиллагааны хяналтаар ачилтын хязгаарлалтыг шалгах",
        confirmMaintenanceRecovery:
          "Чухал техникийн засварын сэргэлтийн төлөвлөгөөг баталгаажуулах",
      },
 
      kpiDefinitions: {
        ore: {
          name: "Хүдрийн олборлолтын гүйцэтгэл",
          driver1: "Өдрийн уурхайн төлөвлөгөөтэй харьцуулсан хүдрийн нийлүүлэлт",
          driver2: "Техникийн бэлэн байдал болон ачих төхөөрөмжийн бүтээмж",
          driver3: "Бутлуурын тэжээлийн тасралтгүй байдал болон материалын чанар",
          recommendation1:
            "Дараагийн ээлжийн төлөвлөгөөнд хамгийн өндөр үнэ цэнтэй хүдрийн хөдөлгөөнийг хамгаална уу.",
          recommendation2:
            "Өдрийн үйл ажиллагааны хяналтаар ачилт болон тээвэрлэлтийн хязгаарлалтыг шалгана уу.",
          recommendation3:
            "Бутлуурын тэжээлийн тасралтгүй байдал болон овоолгын бэлэн байдлыг баталгаажуулна уу.",
        },
        waste: {
          name: "Хөрс хуулалтын гүйцэтгэл",
          driver1: "Тээврийн замын нөхцөл болон циклийн үр ашиг",
          driver2: "Хөрс хуулалтын техникийн хуваарилалт болон диспетчерийн сахилга бат",
          driver3: "Буулгалтын талбайн бэлэн байдал болон бульдозерын дэмжлэг",
          recommendation1:
            "Хязгаарлагдсан хөрс тээврийн замуудыг нэн тэргүүнд сэргээж, замын нөхцөлийг сайжруулна уу.",
          recommendation2:
            "Ээлжийн гол хязгаарлалтад үндэслэн хүдэр болон хөрсний хооронд машинуудыг дахин хуваарилна уу.",
          recommendation3:
            "Дараагийн ээлжээс өмнө буулгалтын багтаамж болон бульдозерын хамрах хүрээг баталгаажуулна уу.",
        },
        fleet: {
          name: "Техникийн гүйцэтгэл",
          driver1: "Хөдөлгөөнт техникийн бэлэн байдал болон төлөвлөгдөөгүй зогсолт",
          driver2: "Дарааллын хугацаа, сул зогсолт болон диспетчерийн үр ашиг",
          driver3: "Операторын хүрэлцээ болон ээлж солилтын алдагдал",
          recommendation1:
            "Техникийн хамгийн их зогсолтын тохиолдлуудад хариуцсан эзэн томилно уу.",
          recommendation2:
            "Диспетчерийн зөрүү болон хэт их дарааллын хугацааг шалгана уу.",
          recommendation3:
            "Дараагийн засварын цонхоор техникийн бэлэн байдлыг хамгаална уу.",
        },
        plant: {
          name: "Үйлдвэрийн гүйцэтгэл",
          driver1: "Бутлуур болон тээрмийн ашиглалтын бэлэн байдал",
          driver2: "Тэжээлийн тасралтгүй байдал, хольцын тогтвортой байдал болон хүдрийн шинж чанар",
          driver3: "Төлөвлөгөөт болон төлөвлөгдөөгүй боловсруулалтын саатал",
          recommendation1:
            "Боловсруулалтын ахлах ажилтантай хамгийн том хүчин чадлын алдагдлыг шалгана уу.",
          recommendation2:
            "Тэжээлийн хольц болон овоолгын нөхөн дүүргэлтийг тогтворжуулна уу.",
          recommendation3:
            "Дараагийн хязгаарлагдсан үйлдвэрийн тоног төхөөрөмжийн сэргээх арга хэмжээг баталгаажуулна уу.",
        },
        safety: {
          name: "Аюулгүй ажиллагааны тохиолдол",
          driver1: "Чухал хяналтын баталгаажуулалт болон талбайн манлайлал",
          driver2: "Үйл ажиллагааны нөхцөл болон ажлын эрсдэлийн өөрчлөлт",
          driver3: "Залруулах арга хэмжээний чанар болон хаалт",
          recommendation1:
            "Дараагийн ээлжийн хамгийн өндөр эрсдэлтэй ажлуудын чухал хяналтыг баталгаажуулна уу.",
          recommendation2:
            "Хугацаа хэтэрсэн аюулгүй ажиллагааны арга хэмжээг хариуцсан удирдлагад шат ахиулна уу.",
          recommendation3:
            "Идэвхтэй ажлын талбайд харагдахуйц удирдлагын манлайллыг баталгаажуулна уу.",
        },
        mineHealth: {
          name: "Уурхайн нэгдсэн төлөвийн үнэлгээ",
          driver1: "Төлөвлөгөөтэй харьцуулсан үйлдвэрлэлийн гүйцэтгэл",
          driver2: "Техник болон үйлдвэрийн үйл ажиллагааны тогтвортой байдал",
          driver3: "Аюулгүй ажиллагааны гүйцэтгэл болон ноцтой эрсдэлийн өртөлт",
          recommendation1:
            "Уурхайн нэгдсэн төлөвийн үнэлгээнд хамгийн их сөргөөр нөлөөлж буй хүчин зүйлийг нэн тэргүүнд шийдвэрлэнэ үү.",
          recommendation2:
            "Үйл ажиллагаа болон засварын багуудын хооронд нөхөн сэргээх арга хэмжээг уялдуулна уу.",
          recommendation3:
            "Тэргүүлэх үзүүлэлтүүдийг хянаж, арга хэмжээ бүрийн хариуцсан эзнийг баталгаажуулна уу.",
        },
      },
 
      kpiDetailDynamic: {
        executiveInsight:
          "{mineName} уурхайн {kpiName} одоогоор {currentValue}{unit}, зорилт {target}{unit} байна. {scenario} сценари нөхцөлд удирдлагын гол анхаарал нь үйл ажиллагааны сахилга батыг хамгаалахын зэрэгцээ энэ KPI-д туссан хамгийн чухал хязгаарлалтыг шийдвэрлэхэд чиглэнэ.",
        forecastHigh:
          "Яаралтай залруулах арга хэмжээ авахгүй бол энэ KPI дараагийн үйл ажиллагааны хугацаанд цаашид муудаж болзошгүй.",
        forecastMedium:
          "Зөвлөмжит арга хэмжээнүүдийг дараагийн ээлжийн циклд хэрэгжүүлбэл гүйцэтгэл зорилтын түвшин рүү сэргэх боломжтой.",
        forecastLow:
          "Үйл ажиллагааны хяналт болон төлөвлөсөн арга хэмжээг хадгалбал одоогийн гүйцэтгэл тогтвортой байх төлөвтэй.",
      },
    },
 
    executiveInsights: {
      "ariaLabel": "AI удирдлагын дүгнэлт",
      "eyebrow": "Шийдвэр дэмжих AI шинжилгээ",
      "title": "AI удирдлагын дүгнэлт",
      "demoScenario": "Демо сценари",
      "liveIntelligence": "Бодит үеийн шинжилгээ",
      "noHeadline": "Одоогоор удирдлагын дүгнэлтийн гарчиг байхгүй байна.",
      "reportingPeriodUnavailable": "Тайлант хугацааны мэдээлэл байхгүй",
      "insightsCount": "{count} удирдлагын дүгнэлт",
      "refreshAria": "Удирдлагын дүгнэлтийг шинэчлэх",
      "loading": "AI удирдлагын дүгнэлтийг уншиж байна...",
      "unavailable": "Удирдлагын дүгнэлт боломжгүй",
      "loadError": "AI удирдлагын дүгнэлтийг ачаалах боломжгүй байна.",
      "empty": "Одоогоор удирдлагын дүгнэлт байхгүй байна.",
      "executiveHeadline": "Гол дүгнэлт",
      "scenarios": {
        "highPerformingMine": "Өндөр гүйцэтгэлтэй уурхай",
        "fleetBreakdown": "Техникийн эвдрэл",
        "plantBottleneck": "Үйлдвэрийн хязгаарлалт",
        "safetyIncident": "Аюулгүй ажиллагааны тохиолдол",
        "weatherDelay": "Их бороо / Цаг агаарын саатал",
        "winterOperations": "Өвлийн ажиллагаа"
      }
    },
 
    predictionSummary: {
      "ariaLabel": "Урьдчилсан төлөв",
      "sprintLabel": "Спринт 10.19",
      "title": "Урьдчилсан төлөв",
      "subtitle": "Дараагийн 3 ээлжийн үйл ажиллагааны төлөв.",
      "forecastGenerated": "Таамаг үүсгэсэн",
      "notGenerated": "Үүсгээгүй",
      "refreshing": "Шинэчилж байна",
      "refreshForecasts": "Таамгийг шинэчлэх",
      "loadingTitle": "Урьдчилан таамаглах шинжилгээг уншиж байна",
      "loadingMessage": "Сүүлийн KPI гүйцэтгэлийг шинжилж, дараагийн гурван ээлжийн таамгийг үүсгэж байна.",
      "errorTitle": "Таамгийг ачаалж чадсангүй",
      "loadError": "Урьдчилан таамаглах шинжилгээг ачаалах боломжгүй байна.",
      "tryAgain": "Дахин оролдох",
      "executiveForecast": "Удирдлагын төлөв",
      "executiveForecastOutlook": "Удирдлагын урьдчилсан төлөв",
      "forecastHorizon": "Хугацаа: дараагийн 3 ээлж",
      "overallConfidence": "Итгэлцлийн түвшин",
      "availableForecasts": "Бэлэн таамаг",
      "dataQuality": "Өгөгдлийн чанар",
      "outlook": {
        "improving": "Сайжирч байна",
        "attentionRequired": "Анхаарал шаардлагатай",
        "stable": "Тогтвортой",
        "unavailable": "Боломжгүй"
      },
      "dataQualityStatus": {
        "good": "Сайн",
        "fair": "Дунд",
        "poor": "Муу",
        "complete": "Бүрэн",
        "partial": "Хэсэгчилсэн",
        "limited": "Хязгаарлагдмал",
        "unknown": "Тодорхойгүй"
      }
    },
 
    predictionCard: {
      "operationalKpi": "Үйл ажиллагааны KPI",
      "current": "Одоогийн",
      "threeShiftChange": "3 ээлжийн өөрчлөлт",
      "percentagePoints": "п.п.",
      "nextShift": "Дараагийн ээлж",
      "shiftPlus2": "Ээлж +2",
      "shiftPlus3": "Ээлж +3",
      "forecastConfidence": "Таамгийн итгэлцэл",
      "confidenceAria": "Таамгийн итгэлцэл {confidence}%",
      "historyPoints": "{count} түүхэн өгөгдлийн цэгт үндэслэв",
      "forecastUnavailable": "Таамаг боломжгүй",
      "additionalHistoryRequired": "Таамаг үүсгэхийн өмнө KPI-ийн нэмэлт түүхэн өгөгдөл шаардлагатай.",
      "trend": {
        "improving": "Сайжирч байна",
        "declining": "Буурч байна",
        "stable": "Тогтвортой",
        "unavailable": "Боломжгүй"
      },
      "ribbon": {
        "unavailable": "Боломжгүй",
        "executiveFocus": "Анхаарах",
        "criticalForecast": "Ноцтой төлөв",
        "improving": "Сайжирч байна",
        "watchList": "Анхаарах"
      },
      "health": {
        "unavailable": "Боломжгүй",
        "healthy": "Хэвийн сайн",
        "watch": "Анхаарах",
        "critical": "Ноцтой"
      }
    },
 
    predictionRecommendation: {
      "title": "AI санал болгосон арга хэмжээ",
      "expectedBenefit": "Хүлээгдэж буй үр өгөөж",
      "suggestedOwner": "Хариуцах баг",
      "status": {
        "dataRequired": "Өгөгдөл шаардлагатай",
        "priorityAction": "Нэн тэргүүний ажил",
        "maintainMomentum": "Сайн гүйцэтгэлийг хадгалах",
        "monitor": "Хянах",
        "maintainControls": "Одоогийн хяналтыг хадгалах",
        "executiveReview": "Удирдлагаар хянах",
        "validateForecast": "Таамгийг нягтлах"
      },
      "owner": {
        "dataReporting": "Өгөгдөл ба тайлагналын баг",
        "miningOperations": "Уурхайн үйл ажиллагаа",
        "maintenanceDispatch": "Засвар ба диспетчер",
        "processingOperations": "Боловсруулах үйлдвэрийн үйл ажиллагаа",
        "hseOperations": "ХАБЭА ба үйл ажиллагаа",
        "mineManagement": "Уурхайн удирдлагын баг",
        "operationalOwner": "Үйл ажиллагааны хариуцагч"
      },
      "dataRequired": {
        "action": "Таамагт үндэслэн арга хэмжээ авахаас өмнө нэмэлт түүхэн KPI өгөгдөл ачаална уу.",
        "benefit": "Таамгийн найдвартай байдлыг сайжруулж, үйл ажиллагааны зөвлөмж гаргах боломж бүрдүүлнэ."
      },
      "ore": {
        "declining": {
          "action": "Дараагийн ээлжээс өмнө экскаваторын бэлэн байдал, хүдэр ил гаргалт, олборлолтын дараалал болон бутлуурын тэжээлийн хязгаарлалтыг шалгана уу.",
          "benefit": "Таамагласан үйлдвэрлэлийн бууралтыг багасгаж, хүдрийн нийлүүлэлтийг төлөвлөгөөтэй нийцүүлэн хамгаална."
        },
        "improving": {
          "action": "Одоогийн хүдэр олборлолтын дарааллыг хадгалж, экскаватор болон бутлуурын гүйцэтгэлийг хянана уу.",
          "benefit": "Одоогийн үйл ажиллагааны хэмнэлийг хамгаалан үйлдвэрлэлийн гүйцэтгэлийг тогтвортой хадгална."
        },
        "stable": {
          "action": "Дараагийн гурван ээлжийн хүдэр ил гаргалт, экскаваторын хуваарилалт болон бутлуурын тэжээлийн бэлэн байдлыг баталгаажуулна уу.",
          "benefit": "Тогтвортой гүйцэтгэл буурах хандлагад орохоос сэргийлнэ."
        }
      },
      "waste": {
        "declining": {
          "action": "Машины хуваарилалт, тээврийн замын саатал, буулгалтын талбайн боломж болон хөрс хуулалтын тэргүүлэх ажлыг шалгана уу.",
          "benefit": "Хөрс хуулалтын явцыг хамгаалж, хуваарийн тасалдлыг бууруулна."
        },
        "stable": {
          "action": "Одоогийн машины хуваарилалтыг хадгалж, тээврийн зам болон буулгалтын талбайн хязгаарлалтыг үргэлжлүүлэн хянана уу.",
          "benefit": "Хөрс хуулалтыг богино хугацааны уурхайн төлөвлөгөөтэй нийцүүлнэ."
        }
      },
      "fleet": {
        "declining": {
          "action": "Чухал машинуудын засварыг нэн тэргүүнд хийж, диспетчерийн саатал болон ашиглалтын алдагдлыг дараагийн ээлжээс өмнө шалгана уу.",
          "benefit": "Техникийн хүчин чадлыг сэргээж, бэлэн байдал болон ашиглалтын таамагласан бууралтыг багасгана."
        },
        "improving": {
          "action": "Техникийн найдвартай байдлыг хянахын зэрэгцээ одоогийн диспетчер ба засварын хяналтыг хадгална уу.",
          "benefit": "Техникийн гүйцэтгэлийг хадгалж, үйлдвэрлэлийн хүчин чадлыг хамгаална."
        },
        "stable": {
          "action": "Машины бэлэн байдал, ашиглалт, сул зогсолт болон удахгүй болох засварын эрсдэлийг шалгана уу.",
          "benefit": "Тогтвортой техникийн гүйцэтгэл буурахаас сэргийлнэ."
        }
      },
      "plant": {
        "declining": {
          "action": "Боловсруулалтын хүчин чадлын саад, металл авалтын алдагдал, тэжээлийн хэлбэлзэл болон төлөвлөсөн зогсолтыг шалгана уу.",
          "benefit": "Таамагласан гүйцэтгэлийн алдагдлыг багасгаж, боловсруулалтын гарцыг хамгаална."
        },
        "stable": {
          "action": "Одоогийн ажиллагааны тохиргоог хадгалж, боловсруулалт, металл авалт болон тэжээлийн тогтвортой байдлыг хянана уу.",
          "benefit": "Таамгийн хугацаанд үйлдвэрийн гүйцэтгэлийг хадгална."
        }
      },
      "safety": {
        "declining": {
          "action": "Дараагийн ээлжээс өмнө тохиолдол, осолд дөхсөн тохиолдол, ноцтой эрсдэлийн хяналт болон удирдагчийн талбайн баталгаажуулалтыг шалгана уу.",
          "benefit": "Урьдчилан сэргийлэх хяналтыг бэхжүүлж, өндөр үр дагавартай эрсдэлийн өртөлтийг бууруулна."
        },
        "stable": {
          "action": "Одоогийн ноцтой эрсдэлийн хяналтыг хадгалж, аюулгүй ажиллагааны тэргүүлэх үзүүлэлтүүдийг үргэлжлүүлэн хянана уу.",
          "benefit": "Таамгийн хугацаанд аюулгүй ажиллагааны сайн гүйцэтгэлийг хадгална."
        }
      },
      "health": {
        "declining": {
          "action": "Буурч буй KPI-ийн нөлөөлөгч хүчин зүйлсийг шалгаж, хамгийн өндөр эрсдэлтэй үйл ажиллагааны хязгаарлалтад хариуцагч томилно уу.",
          "benefit": "Бууралт олон үйл ажиллагааны чиглэлд нөлөөлөхөөс өмнө уурхайн нэгдсэн төлөвийг тогтворжуулна."
        },
        "improving": {
          "action": "Одоогийн үйл ажиллагааны хэмнэлийг хадгалж, тэргүүлэх KPI нөлөөлөгч хүчин зүйлсийг үргэлжлүүлэн хянана уу.",
          "benefit": "Уурхайн нэгдсэн төлөвийн сайжирч буй байдлыг хадгална."
        },
        "stable": {
          "action": "Тэргүүлэх KPI нөлөөлөгч хүчин зүйлсийг шалгаж, үйлдвэрлэл, техник, үйлдвэр, аюулгүй ажиллагааны хяналтад төвлөрнө үү.",
          "benefit": "Уурхайн нэгдсэн төлөвийн тогтвортой таамаг буурах хандлагад орохоос сэргийлнэ."
        }
      },
      "generic": {
        "declining": {
          "action": "Таамагласан бууралтын цаадах үйл ажиллагааны нөлөөлөгч хүчин зүйлсийг шалгаж, залруулах арга хэмжээний хариуцагч томилно уу.",
          "benefit": "Дараагийн гурван ээлжийн KPI-ийн таамагласан муудалтыг бууруулна."
        },
        "monitor": {
          "action": "Одоогийн хяналтуудыг хадгалж, дараагийн гурван ээлжид KPI-г хянана уу.",
          "benefit": "Одоогийн гүйцэтгэлийг хамгаалж, эрт үеийн муудалтыг илрүүлнэ."
        },
        "validate": {
          "action": "Арга хэмжээ авахаас өмнө үндсэн өгөгдлийг баталгаажуулж, таамгийг шалгана уу.",
          "benefit": "Таамгийн оролтыг баталгаажуулснаар шийдвэрийн чанарыг сайжруулна."
        }
      }
    },
 
    predictionSparkline: {
      "current": "Одоогийн",
      "forecastTrendAria": "Гурван ээлжийн таамгийн хандлага",
      "noForecastAvailable": "Таамаг байхгүй"
    },
 
    executiveForecastRiskStrip: {
      "ariaLabel": "Удирдлагын таамгийн хураангуй",
      "eyebrow": "Урьдчилсан төлөвийн хураангуй",
      "attentionRequired": "Анхаарал шаардлагатай",
      "stablePosition": "Таамгийн төлөв тогтвортой байна",
      "kpisAtRisk": "Эрсдэлтэй KPI",
      "onWatch": "Анхаарах",
      "improving": "Сайжирч байна",
      "primaryRisks": "Гол эрсдэлүүд",
      "noNegativeForecast": "Гурван ээлжийн сөрөг таамаг илрээгүй.",
      "overallConfidence": "Итгэлцлийн түвшин",
      "percentagePoints": "п.п.",
      "confidenceAria": "Таамгийн нийт итгэлцлийн түвшин"
    },
 
    executiveAiInsightCard: {
      "defaultTitle": "AI удирдлагын дүгнэлт",
      "severity": {
        "critical": "Ноцтой",
        "high": "Өндөр ач холбогдолтой",
        "medium": "Дунд ач холбогдолтой",
        "low": "Бага ач холбогдолтой",
        "unavailable": "Ач холбогдлын мэдээлэлгүй"
      },
      "executiveSummary": "Товч дүгнэлт",
      "noExecutiveInterpretation": "Энэ KPI-ийн удирдлагын тайлбар одоогоор байхгүй.",
      "performance": "Гүйцэтгэл",
      "variance": "Зөрүү",
      "performanceTrend": "Гүйцэтгэлийн хандлага",
      "noTrendInformation": "Чиг хандлагын мэдээлэл одоогоор байхгүй.",
      "likelyDriver": "Гол нөлөөлөгч хүчин зүйл",
      "noDriverIdentified": "Материаллаг үйл ажиллагааны нөлөөлөгч хүчин зүйл илрээгүй.",
      "estimatedImpact": "Болзошгүй нөлөө",
      "noNegativeImpact": "Материаллаг сөрөг нөлөө тооцоологдоогүй.",
      "recommendedPriority": "Удирдлагын зөвлөмжит тэргүүлэх чиглэл",
      "continueMonitoring": "Үйл ажиллагааны гүйцэтгэлийг үргэлжлүүлэн хянана уу.",
      "ruleBasedEstimate": "Дүрэмд суурилсан үнэлгээ",
      "sourceBase": "Үйл ажиллагааны KPI хандлага, тохируулсан зорилтууд",
      "and": "болон",
      "confidenceAria": "Удирдлагын дүгнэлтийн итгэлцэл"
    },
 
    executiveKpiDetail: {
      "title": "KPI удирдлагын шинжилгээ",
      "kpiDetail": "KPI дэлгэрэнгүй",
      "liveData": "Бодит үеийн өгөгдөл",
      "last7Days": "Сүүлийн 7 хоног",
      "generating": "Үүсгэж байна...",
      "exportPdf": "PDF экспортлох",
      "closeAria": "KPI дэлгэрэнгүйг хаах",
      "dismissExportSuccess": "Экспорт амжилттай гэсэн мэдэгдлийг хаах",
      "dismissExportError": "Экспортын алдааны мэдэгдлийг хаах",
      "exportSuccess": "Удирдлагын KPI шинжилгээний PDF амжилттай татагдлаа.",
      "exportError": "Удирдлагын KPI PDF үүсгэх боломжгүй байна.",
      "loadErrorTitle": "KPI шинжилгээг ачаалах боломжгүй",
      "retry": "Дахин оролдох",
      "currentValue": "Одоогийн",
      "currentPeriod": "Одоогийн хугацаа",
      "target": "Зорилт",
      "configuredPlan": "Төлөвлөгөө",
      "change": "Өөрчлөлт",
      "versusPreviousPeriod": "Өмнөх хугацаатай харьцуулахад",
      "confidence": "Итгэлцэл",
      "aiAnalysisConfidence": "AI итгэлцэл",
      "performanceTrend": "Гүйцэтгэлийн хандлага",
      "dailyValuesSubtitle": "Сонгосон хугацааны өдрийн утгууд",
      "trendChartAria": "KPI чиг хандлагын график",
      "noTrendValues": "Чиг хандлагын утга байхгүй.",
      "historicalAnalysis": "Өмнөх үеийн шинжилгээ",
      "operationalDrivers": "Гүйцэтгэлд нөлөөлж буй хүчин зүйлс",
      "operationalDriversSubtitle": "Энэ KPI-д нөлөөлж буй холбоотой үйл ажиллагааны нөхцөл",
      "supportingData": "Үндэслэл болсон өгөгдөл",
      "supportingDataSubtitle": "KPI шинжилгээнд ашигласан нотолгоо",
      "executiveStatus": "KPI төлөв",
      "noAnalysis": "KPI шинжилгээ байхгүй.",
      "configuredMine": "Тохируулсан уурхай",
      "medium": "Дунд",
      "operationalDriverFallback": "Үйл ажиллагааны нөлөөлөгч хүчин зүйл {number}",
      "dayFallback": "Өдөр {number}",
      "statusAria": "KPI төлөв: {status}",
      "status": {
        "unavailable": "Төлөв тодорхойгүй",
        "unavailableHeadline": "Гүйцэтгэлийн төлөвийг тооцоолох боломжгүй",
        "unavailableDescription": "Одоогийн гүйцэтгэл эсвэл зорилтын мэдээлэл байхгүй.",
        "aboveTarget": "Зорилтоос дээгүүр",
        "aboveTargetHeadline": "Одоогийн гүйцэтгэл зорилтоос дээгүүр байна",
        "aboveTargetDescription": "Гүйцэтгэл тохируулсан зорилтоос {gap}% илүү байна.",
        "belowTarget": "Зорилтоос доогуур",
        "belowTargetHeadline": "Одоогийн гүйцэтгэл зорилтоос доогуур байна",
        "belowTargetDescription": "Гүйцэтгэл тохируулсан зорилтоос {gap}% хоцорч байна.",
        "nearTarget": "Зорилтод ойр",
        "nearTargetHeadline": "Одоогийн гүйцэтгэл зорилтод ойр байна",
        "nearTargetDescription": "Гүйцэтгэл тохируулсан зорилтын {threshold}%-ийн хүрээнд байна."
      }
    },
 
    executiveRecommendationCard: {
      "defaultTitle": "AI санал болгосон ажлууд",
      "aiDecisionSupport": "AI шийдвэр дэмжлэг",
      "saving": "Хадгалж байна...",
      "defaults": {
        "operations": "Үйл ажиллагаа",
        "nextShift": "Дараагийн ээлж",
        "reviewRecommendation": "Энэ үйл ажиллагааны зөвлөмжийг шалгана уу."
      },
      "priority": {
        "high": "Өндөр ач холбогдолтой",
        "medium": "Дунд ач холбогдолтой",
        "low": "Бага ач холбогдолтой",
        "unavailable": "Ач холбогдлын мэдээлэлгүй"
      },
      "status": {
        "open": "Нээлттэй",
        "inProgress": "Хэрэгжиж байна",
        "completed": "Дууссан",
        "blocked": "Хаалттай"
      },
      "errors": {
        "syncFailed": "Удирдлагын арга хэмжээг синк хийх боломжгүй.",
        "notSynchronized": "Энэ арга хэмжээ backend-тэй синк хийж дуусаагүй байна.",
        "updateFailed": "Арга хэмжээний төлөвийг шинэчлэх боломжгүй."
      },
      "messages": {
        "statusUpdated": "Арга хэмжээний төлөв {status} болж шинэчлэгдлээ."
      },
      "syncing": "Синк хийж байна",
      "collapseAll": "Бүгдийг хураах",
      "expandAll": "Бүгдийг дэлгэх",
      "actionsCount": "{count} арга хэмжээ",
      "actionProgressSummaryAria": "Арга хэмжээний явцын хураангуй",
      "executionOverview": "Хэрэгжилтийн төлөв",
      "actionProgressSummary": "Ажлын явц",
      "completedLower": "дууссан",
      "totalActions": "Нийт ажил",
      "overallCompletion": "Нийт биелэлт",
      "actionCompletionProgressAria": "Арга хэмжээний биелэлтийн явц",
      "completedOfActions": "{total} арга хэмжээнээс {complete} дууссан",
      "linkedTo": "Холбоотой",
      "linkedRootCause": "Холбоотой үндсэн шалтгаан",
      "expectedOperationalBenefit": "Хүлээгдэж буй үр өгөөж",
      "actionWorkflow": "Арга хэмжээний урсгал",
      "updateActionStatus": "Арга хэмжээний төлөвийг шинэчлэх",
      "statusPersistenceNote": "Төлөвийн өөрчлөлт PostgreSQL-д хадгалагдах бөгөөд браузерыг шинэчилсний дараа ч хэвээр байна.",
      "responsibleFunction": "Хариуцах нэгж",
      "recommendedTiming": "Зөвлөмжит хугацаа",
      "loadingActions": "Удирдлагын арга хэмжээг ачаалж байна",
      "noImmediateActions": "Яаралтай арга хэмжээ шаардлагагүй",
      "synchronizingRecommendations": "AI зөвлөмжийг PostgreSQL-тэй синк хийж байна.",
      "noAdditionalRecommendation": "Одоогийн KPI гүйцэтгэл нэмэлт AI зөвлөмж шаардлагагүй байна."
    },
 
    executiveRootCauseCard: {
      "defaultTitle": "Үндсэн шалтгаан",
      "aiDiagnosticAnalysis": "AI шалтгааны шинжилгээ",
      "collapseAll": "Бүгдийг хураах",
      "expandAll": "Бүгдийг дэлгэх",
      "identifiedCount": "{count} илэрсэн",
      "defaults": {
        "operations": "Үйл ажиллагаа",
        "operationalConstraint": "Үйл ажиллагааны хязгаарлалт"
      },
      "impact": {
        "high": "Өндөр нөлөө",
        "medium": "Дунд нөлөө",
        "low": "Бага нөлөө",
        "unavailable": "Нөлөөний мэдээлэлгүй"
      },
      "confidenceValue": "{confidence}% итгэлцэл",
      "confidenceUnavailable": "Итгэлцлийн мэдээлэлгүй",
      "supportingEvidence": "Үндэслэл",
      "expectedOperationalImpact": "Үйл ажиллагаанд үзүүлэх нөлөө",
      "responsibleFunction": "Хариуцах нэгж",
      "aiConfidence": "AI итгэлцэл",
      "aiConfidenceAria": "{title}-ийн AI итгэлцэл",
      "noMaterialRootCauses": "Материаллаг үндсэн шалтгаан илрээгүй",
      "noSignificantConstraint": "Одоогийн KPI гүйцэтгэл мэдэгдэхүйц үйл ажиллагааны хязгаарлалт байгааг харуулахгүй байна."
    },
 
    historicalAnalysisCard: {
      "defaultTitle": "Өмнөх үеийн шинжилгээ",
      "trendLabel": "Хандлага",
      "rollingAverage": "Хөдөлгөөнт дундаж",
      "volatilityLabel": "Хэлбэлзэл",
      "previous": "Өмнөх",
      "change": "Өөрчлөлт",
      "aiTrendSummary": "AI хандлагын дүгнэлт",
      "summary": "Нийт хандлага {trend}. Гулсах дундаж {average}, хэлбэлзэл {volatility}.",
      "trend": {
        "stable": "Тогтвортой",
        "improving": "Сайжирч байна",
        "declining": "Буурч байна"
      },
      "volatility": {
        "low": "Бага",
        "medium": "Дунд",
        "high": "Өндөр"
      }
    },
 
    operationalDriversGrid: {
      "defaultTitle": "Үйл ажиллагааны нөлөөлөгч хүчин зүйлс",
      "defaultSubtitle": "Энэ KPI-д нөлөөлж буй холбоотой үйл ажиллагааны нөхцөл",
      "defaultEmptyMessage": "Энэ KPI-ийн үйл ажиллагааны нөлөөлөгч хүчин зүйлийн өгөгдөл байхгүй.",
      "driverFallback": "Үйл ажиллагааны нөлөөлөгч хүчин зүйл {number}",
      "driverCountSingle": "{count} хүчин зүйл",
      "driverCountPlural": "{count} хүчин зүйл",
      "loadingAria": "{title} ачаалж байна",
      "noAnalysis": "Нөлөөлөгч хүчин зүйлийн шинжилгээ байхгүй",
      "noChangeData": "Өөрчлөлтийн өгөгдөл байхгүй",
      "viewDetails": "Нөлөөлөгч хүчин зүйлийн дэлгэрэнгүй",
      "openDetailsAria": "{name}-ийн дэлгэрэнгүйг нээх",
      "impact": {
        "critical": "Ноцтой",
        "high": "Өндөр",
        "medium": "Дунд",
        "low": "Бага",
        "unrated": "Үнэлээгүй"
      }
    },
 
    supportingDataTable: {
      "defaultTitle": "Дэмжих өгөгдөл",
      "defaultSubtitle": "KPI шинжилгээнд ашигласан нотолгоо",
      "defaultEmptyMessage": "Энэ KPI-ийн дэмжих өгөгдөл байхгүй.",
      "rowFallback": "Мөр {number}",
      "rowCountSingle": "{count} мөр",
      "rowCountPlural": "{count} мөр",
      "export": "Экспорт",
      "exportAria": "Дэмжих өгөгдлийг экспортлох",
      "loadingAria": "Дэмжих өгөгдлийг ачаалж байна",
      "noData": "Дэмжих өгөгдөл байхгүй",
      "date": "Огноо",
      "actual": "Гүйцэтгэл",
      "plan": "Төлөвлөгөө",
      "variance": "Зөрүү",
      "percentOfPlan": "Төлөвлөгөөний %"
    },
 
    relatedExecutiveActions: {
      "eyebrow": "Холбогдсон удирдлагын аналитик",
      "title": "Холбоотой удирдлагын арга хэмжээ",
      "subtitle": "Энэ KPI-тай холбоотой бодит үеийн удирдлагын арга хэмжээнүүд.",
      "refresh": "Шинэчлэх",
      "refreshAria": "Холбоотой удирдлагын арга хэмжээг шинэчлэх",
      "openActionCenter": "Арга хэмжээний төвийг нээх",
      "summary": {
        "total": "Нийт",
        "completion": "Биелэлт"
      },
      "status": {
        "open": "Нээлттэй",
        "inProgress": "Хэрэгжиж байна",
        "completed": "Дууссан",
        "blocked": "Хаалттай"
      },
      "priority": {
        "critical": "Ноцтой",
        "high": "Өндөр",
        "medium": "Дунд",
        "low": "Бага"
      },
      "loadingTitle": "Удирдлагын арга хэмжээг ачаалж байна",
      "loadingMessage": "Энэ KPI-ийн бодит арга хэмжээний өгөгдлийг авч байна.",
      "errorTitle": "Удирдлагын арга хэмжээг ачаалж чадсангүй",
      "retry": "Дахин оролдох",
      "emptyTitle": "Холбоотой удирдлагын арга хэмжээ одоогоор алга",
      "emptyMessage": "Энэ KPI-аас үүсгэсэн арга хэмжээнүүд энд автоматаар харагдана.",
      "untitledAction": "Гарчиггүй удирдлагын арга хэмжээ",
      "updateStatusAria": "{title}-ийн төлөвийг шинэчлэх",
      "ownerNotAssigned": "Хариуцагч томилоогүй",
      "noDueDate": "Дуусах огноо байхгүй",
      "rootCause": "Үндсэн шалтгаан {cause}",
      "expectedBenefit": "Хүлээгдэж буй үр өгөөж",
      "updatingStatus": "Төлөвийг шинэчилж байна…"
    },
 
    executiveActionAnalytics: {
      title: "Удирдлагын арга хэмжээний шинжилгээ",
      subtitle:
        "Удирдлагын арга хэмжээний гүйцэтгэл, хариуцлага болон хэрэгжилтийн шинжилгээ.",
 
      refreshAnalytics: "Шинжилгээг шинэчлэх",
      refreshing: "Шинэчилж байна...",
      retry: "Дахин оролдох",
 
      completionRate: "Хэрэгжилтийн хувь",
      completionSubtitle:
        "{total} арга хэмжээнээс {completed} нь хэрэгжсэн",
 
      averageDaysToClose: "Хаах дундаж хоног",
      averageResolutionTime: "Арга хэмжээг шийдвэрлэж хаах дундаж хугацаа",
 
      overdueActions: "Хугацаа хэтэрсэн арга хэмжээ",
      overdueActionsSubtitle: "Дуусах хугацаа хэтэрсэн арга хэмжээнүүд",
 
      criticalActions: "Ноцтой арга хэмжээ",
      criticalActionsSubtitle: "Яаралтай анхаарал шаардлагатай арга хэмжээнүүд",
 
      priorityDistribution: "Эрэмбийн хуваарилалт",
      priorityDistributionSubtitle:
        "Одоогийн арга хэмжээнүүдийг удирдлагын эрэмбээр ангилсан байдал.",
      noPriorityAnalytics: "Эрэмбийн шинжилгээний мэдээлэл байхгүй байна.",
 
      statusDistribution: "Төлөвийн хуваарилалт",
      statusDistributionSubtitle:
        "Одоогийн арга хэмжээнүүдийг хэрэгжилтийн төлөвөөр ангилсан байдал.",
      noStatusAnalytics: "Төлөвийн шинжилгээний мэдээлэл байхгүй байна.",
 
      topActionOwners: "Хамгийн олон арга хэмжээ хариуцагчид",
      topActionOwnersSubtitle:
        "Хамгийн олон арга хэмжээ хариуцан хэрэгжүүлж буй эзэд.",
      noOwnerAnalytics: "Хариуцагчийн шинжилгээний мэдээлэл байхгүй байна.",
 
      topKpiCategories: "Гол KPI ангиллууд",
      topKpiCategoriesSubtitle:
        "Удирдлагын хамгийн олон арга хэмжээ үүсгэж буй үйл ажиллагааны чиглэлүүд.",
      noKpiCategoryAnalytics:
        "KPI ангиллын шинжилгээний мэдээлэл байхгүй байна.",
 
      priorityCritical: "Ноцтой",
      priorityHigh: "Өндөр",
      priorityMedium: "Дунд",
      priorityLow: "Бага",
 
      statusOpen: "Нээлттэй",
      statusInProgress: "Хэрэгжиж байна",
      statusCompleted: "Дууссан",
      statusBlocked: "Саатсан",
 
      unknown: "Тодорхойгүй",
    },
 
    executiveActionSummary: {
      executionOverview: "Гүйцэтгэлийн тойм",
      selectCardToFilter:
        "Карт сонгож удирдлагын арга хэмжээний хүснэгтийг шүүнэ үү.",
      summaryFilterActive: "Тоймын шүүлтүүр идэвхтэй",
 
      totalActions: "Нийт арга хэмжээ",
      allExecutiveActions: "Удирдлагын бүх арга хэмжээ",
      open: "Нээлттэй",
      notYetStarted: "Хараахан эхлээгүй",
      inProgress: "Хэрэгжиж байна",
      currentlyBeingExecuted: "Одоогоор хэрэгжүүлж байна",
      completed: "Дууссан",
      successfullyClosed: "Амжилттай хаагдсан",
      blocked: "Саатсан",
      requiresIntervention: "Удирдлагын оролцоо шаардлагатай",
      completionRate: "Гүйцэтгэлийн хувь",
      overallCompletion: "Нийт гүйцэтгэл",
 
      active: "Идэвхтэй",
      filtering: "Шүүж байна",
      viewActions: "Арга хэмжээг харах",
 
      executiveActionCompletion: "Удирдлагын арга хэмжээний гүйцэтгэл",
      loadingActionProgress:
        "Арга хэмжээний гүйцэтгэлийг уншиж байна...",
      actionsCompletedProgress:
        "{total} арга хэмжээнээс {completed} нь дууссан",
 
      deliveryAccountability: "Хэрэгжилт ба хариуцлага",
      deliveryDescription:
        "Хугацаатай арга хэмжээ, тэргүүлэх эрсдэл болон хаалтын гүйцэтгэл.",
 
      dueToday: "Өнөөдөр дуусах",
      actionsRequiringAttentionToday:
        "Өнөөдөр анхаарал шаардлагатай арга хэмжээ",
      overdue: "Хугацаа хэтэрсэн",
      pastDueAndStillActive:
        "Хугацаа хэтэрсэн боловч идэвхтэй хэвээр",
      highPriority: "Өндөр ач холбогдолтой",
      criticalAndHighActiveActions:
        "Ноцтой болон өндөр ач холбогдолтой идэвхтэй арга хэмжээ",
      completedThisMonth: "Энэ сард дууссан",
      actionsClosedThisMonth: "Энэ сард хаагдсан арга хэмжээ",
      averageCloseTime: "Хаалтын дундаж хугацаа",
      averageDaysCreationToClosure:
        "Үүсгэснээс хаах хүртэлх дундаж хоног",
      daysValue: "{value} хоног",
    },
 
    executiveActionFilters: {
      title: "Удирдлагын арга хэмжээг шүүх",
      subtitle:
        "Түлхүүр үг, төлөв, ач холбогдол эсвэл хариуцагчаар хүснэгтийг шүүнэ.",
      clearFilters: "Шүүлтүүр цэвэрлэх",
      search: "Хайх",
      searchActions: "Арга хэмжээ хайх",
      status: "Төлөв",
      allStatuses: "Бүх төлөв",
      open: "Нээлттэй",
      toDo: "Хийх",
      inProgress: "Хэрэгжиж байна",
      blocked: "Саатсан",
      completed: "Дууссан",
      priority: "Ач холбогдол",
      allPriorities: "Бүх ач холбогдол",
      critical: "Ноцтой",
      high: "Өндөр",
      medium: "Дунд",
      low: "Бага",
      owner: "Хариуцагч",
      allOwners: "Бүх хариуцагч",
    },
 

    executiveActionDialog: {
      editTitle:
        "Удирдлагын арга хэмжээг засах",
      createTitle:
        "Удирдлагын арга хэмжээ үүсгэх",
      editSubtitle:
        "Хариуцагч, эрэмбэ, дуусах хугацаа болон хэрэгжилтийн төлөвийг шинэчилнэ.",
      createSubtitle:
        "Удирдлагын хяналтад зориулсан шинэ үйл ажиллагааны арга хэмжээ үүсгэнэ.",
      closeDialog: "Цонхыг хаах",

      actionDetails:
        "Арга хэмжээний мэдээлэл",
      actionTitle:
        "Арга хэмжээний нэр",
      actionTitlePlaceholder:
        "Жишээ: Экскаваторын эвдрэлийг шалгах",
      actionTitleHelper:
        "Тодорхой, үр дүнд чиглэсэн арга хэмжээний нэр ашиглана уу.",

      description: "Тайлбар",
      descriptionPlaceholder:
        "Асуудал, хүлээгдэж буй үр дүн болон чухал нөхцөл байдлыг тайлбарлана уу.",
      characterCount:
        "{count}/{max} тэмдэгт",

      ownershipAndExecution:
        "Хариуцлага ба хэрэгжилт",
      actionOwner:
        "Арга хэмжээний хариуцагч",
      actionOwnerPlaceholder:
        "Жишээ: Засварын ахлах ажилтан",
      actionOwnerHelper:
        "Арга хэмжээг хэрэгжүүлэх хариуцлагатай ажилтан эсвэл албан тушаал.",

      dueDate: "Дуусах огноо",
      dueDateHelper:
        "Зорилтот дуусах огноо.",

      priorityLabel: "Эрэмбэ",
      priorityHelper:
        "Энэ арга хэмжээний үйл ажиллагааны ач холбогдол.",

      statusLabel: "Төлөв",
      statusHelper:
        "Одоогийн хэрэгжилтийн төлөв.",

      categoryLabel: "Ангилал",
      categoryHelper:
        "Шүүлтүүр болон тайлагналд ашиглана.",

      sourceLabel: "Эх үүсвэр",
      sourceEditHelper:
        "Энэ арга хэмжээ анх хэрхэн үүссэнийг харуулна.",
      sourceCreateHelper:
        "Менежерийн шинээр үүсгэсэн арга хэмжээ Гараар гэсэн эх үүсвэртэй хадгалагдана.",

      liveKpiContext:
        "Live KPI контекст",

      manualActionTitle:
        "Гараар үүсгэсэн удирдлагын арга хэмжээ",
      manualActionDescription:
        "Энэ арга хэмжээ менежерийн гараар үүсгэсэн арга хэмжээ хэлбэрээр бүртгэгдэж, хадгалсны дараа Удирдлагын арга хэмжээний төвд харагдана.",

      cancel: "Цуцлах",
      updating:
        "Шинэчилж байна...",
      creating:
        "Үүсгэж байна...",
      saveChanges:
        "Өөрчлөлтийг хадгалах",
      createAction:
        "Арга хэмжээ үүсгэх",

      validation: {
        actionTitleRequired:
          "Арга хэмжээний нэр шаардлагатай.",
        ownerRequired:
          "Арга хэмжээний хариуцагч шаардлагатай.",
        priorityRequired:
          "Эрэмбэ сонгох шаардлагатай.",
        statusRequired:
          "Төлөв сонгох шаардлагатай.",
        dueDateRequired:
          "Дуусах огноо шаардлагатай.",
      },

      priority: {
        critical: "Ноцтой",
        high: "Өндөр",
        medium: "Дунд",
        low: "Бага",
      },

      status: {
        open: "Нээлттэй",
        toDo: "Хийх",
        inProgress: "Хэрэгжиж байна",
        blocked: "Саатсан",
        completed: "Дууссан",
      },

      category: {
        geotechnical: "Геотехник",
        environment: "Байгаль орчин",
        other: "Бусад",
      },
    },

    executiveActionKpiContext: {
      linkedKpi: "Холбогдсон KPI",
      unknown: "Тодорхойгүй",
      onTarget:
        "Зорилтот түвшинд",
      belowTarget:
        "Зорилтот түвшнээс доогуур",

      loading:
        "Live KPI контекстийг ачаалж байна...",
      retry: "Дахин оролдох",
      loadError:
        "Энэ удирдлагын арга хэмжээний Live KPI контекстийг ачаалж чадсангүй.",
      noKpiLinked:
        "Энэ удирдлагын арга хэмжээнд KPI холбогдоогүй байна.",

      liveKpiContext:
        "LIVE KPI КОНТЕКСТ",
      currentValue:
        "Одоогийн утга",
      target: "Зорилт",
      variance: "Зөрүү",
      relatedActions:
        "Холбогдох арга хэмжээ",
      primaryRootCause:
        "Үндсэн шалтгаан",
      rootCauseUnavailable:
        "Энэ KPI контекстийн үндсэн шалтгааны шинжилгээ одоогоор байхгүй байна.",

      backToKpiDashboard:
        "KPI самбар руу буцах",
      clearKpiFilter:
        "KPI шүүлтүүрийг арилгах",
      relatedActionsCount:
        "{count} холбогдох арга хэмжээ",
    },

    executiveActionTable: {
      changeStatus: "Төлөв өөрчлөх",
      updating: "Шинэчилж байна...",
      untitledAction: "Нэргүй удирдлагын арга хэмжээ",
      unassigned: "Хариуцагч томилоогүй",
      operations: "Үйл ажиллагаа",
      noDueDate: "Дуусах хугацаа байхгүй",
      manual: "Гараар",
      overdue: "Хугацаа хэтэрсэн",
      editAction: "Арга хэмжээг засах",
      deleteAction: "Арга хэмжээг устгах",
      emptyTitle: "Удирдлагын арга хэмжээ олдсонгүй",
      emptyMessage:
        "Шинэ арга хэмжээ үүсгэх эсвэл одоогийн арга хэмжээг харахын тулд шүүлтүүрийг өөрчилнө үү.",
      showingSingle: "{count} удирдлагын арга хэмжээ харуулж байна",
      showingPlural: "{count} удирдлагын арга хэмжээ харуулж байна",
 
      columns: {
        action: "Арга хэмжээ",
        category: "Ангилал",
        priority: "Ач холбогдол",
        owner: "Хариуцагч",
        dueDate: "Дуусах хугацаа",
        status: "Төлөв",
        actions: "Үйлдэл",
      },
 
      status: {
        open: "Нээлттэй",
        inProgress: "Хэрэгжиж байна",
        completed: "Дууссан",
        blocked: "Саатсан",
      },
 
      priority: {
        critical: "Ноцтой",
        high: "Өндөр",
        medium: "Дунд",
        low: "Бага",
      },
    },
 
    dynamicKpiNames: {
      mineHealth: "Уурхайн нэгдсэн төлөв",
      oreProduction: "Хүдрийн олборлолт",
      wasteMovement: "Хөрс хуулалт",
      fleetPerformance: "Техникийн гүйцэтгэл",
      plantPerformance: "Үйлдвэрийн гүйцэтгэл",
      safetyPerformance: "Аюулгүй ажиллагааны гүйцэтгэл",
    },
 
    dynamicScenarios: {
      highPerformingMine: "Өндөр гүйцэтгэлтэй уурхай",
      fleetBreakdown: "Техникийн эвдрэл",
      plantBottleneck: "Үйлдвэрийн хязгаарлалт",
      safetyIncident: "Аюулгүй ажиллагааны тохиолдол",
      weatherDelay: "Их бороо / Цаг агаарын саатал",
      winterOperations: "Өвлийн ажиллагаа",
    },
 
    dynamicOutlooks: {
      improving: "Сайжирч байна",
      declining: "Буурч байна",
      stable: "Тогтвортой",
      attentionRequired: "Анхаарал шаардлагатай",
      unavailable: "Боломжгүй",
    },
 
    production: {
      title: "Олборлолт",
      orePlan: "Хүдрийн төлөвлөгөө",
      oreActual: "Хүдрийн гүйцэтгэл",
      wastePlan: "Хөрс хуулалтын төлөвлөгөө",
      wasteActual: "Хөрс хуулалтын гүйцэтгэл",

      operationalIntelligence: "Үйл ажиллагааны мэдээлэл",
      productionPerformance: "Олборлолтын гүйцэтгэл",
      pageSubtitle:
        "Өдрийн хүдрийн олборлолт болон хөрс хуулалтын гүйцэтгэлийг төлөвлөгөөтэй харьцуулсан үзүүлэлт.",
      reportingDate: "Тайлангийн огноо",
      refreshProductionData: "Олборлолтын мэдээллийг шинэчлэх",
      loadingProductionIntelligence:
        "Олборлолтын мэдээллийг уншиж байна...",
      unableToLoadAnalytics:
        "Олборлолтын шинжилгээг ачаалж чадсангүй.",

      dailyProductionStatus: "Өдрийн олборлолтын төлөв",
      abovePlan: "Төлөвлөгөөнөөс давсан",
      nearPlan: "Төлөвлөгөөтэй ойролцоо",
      belowPlan: "Төлөвлөгөөнөөс доогуур",
      statusDescriptionAbovePlan:
        "Олборлолтын гүйцэтгэл одоогоор төлөвлөгөөнд хүрсэн эсвэл давсан байна.",
      statusDescriptionNearPlan:
        "Олборлолтын гүйцэтгэл төлөвлөгөөтэй ойролцоо байгаа тул үйл ажиллагааны хяналтыг үргэлжлүүлэх шаардлагатай.",
      statusDescriptionBelowPlan:
        "Олборлолтын гүйцэтгэл одоогоор төлөвлөгөөнөөс доогуур байгаа тул удирдлагын анхаарал шаардлагатай.",

      oreProduction: "Хүдрийн олборлолт",
      wasteMovement: "Хөрс хуулалт",
      overallMaterialMovement: "Нийт материалын хөдөлгөөн",
      ofPlan: "төлөвлөгөөний",
      combinedPlanAttainment: "Нэгдсэн төлөвлөгөөний биелэлт",

      keyProductionIndicators: "Олборлолтын гол үзүүлэлтүүд",
      currentShiftPerformance:
        "Одоогийн ээлжийн гүйцэтгэлийг төлөвлөгөөтэй харьцуулсан үзүүлэлт.",
      productionDelivery: "Олборлолтын гүйцэтгэл",
      materialMovement: "Материалын хөдөлгөөн",
      overallPerformance: "Нэгдсэн гүйцэтгэл",
      planAttainment: "Төлөвлөгөөний биелэлт",
      plan: "Төлөвлөгөө",
      actual: "Гүйцэтгэл",
      variance: "Зөрүү",

      performanceHistory: "Гүйцэтгэлийн түүх",
      productionPerformanceTrend:
        "Олборлолтын гүйцэтгэлийн чиг хандлага",
      trendSubtitle:
        "Сүүлийн 30 хоногийн бодит болон төлөвлөсөн олборлолтын гүйцэтгэлийн харьцуулалт.",
      chartActualAgainstPlan:
        "бодит гүйцэтгэлийг төлөвлөгөөтэй харьцуулсан, сүүлийн 30 хоног",
      thirtyDayTrend: "30 хоногийн чиг хандлага",

      ore: "Хүдэр",
      waste: "Хөрс",
      atOrAbovePlan: "Төлөвлөгөөнд хүрсэн / давсан",
      actualAtOrAbovePlan: "Гүйцэтгэл ≥ Төлөвлөгөө",
      actualBelowPlan: "Гүйцэтгэл < Төлөвлөгөө",
    },
 
    fleet: {
      title: "Техникийн гүйцэтгэл",

      operationalIntelligence:
        "Үйл ажиллагааны мэдээлэл",

      pageDescription:
        "Үйл ажиллагаанд ашиглагдаж буй техникийн бэлэн байдал болон ашиглалтын гүйцэтгэл.",

      reportingDate:
        "Тайлангийн огноо",

      unavailable:
        "Мэдээлэл байхгүй",

      unableToLoad:
        "Техникийн гүйцэтгэлийн мэдээллийг ачаалж чадсангүй.",

      fleetKpi:
        "Техникийн KPI",

      target:
        "Зорилтот түвшин",

      healthy:
        "Хэвийн",

      attentionRequired:
        "Анхаарал шаардлагатай",

      critical:
        "Ноцтой",

      fleetOperatingStatus:
        "Техникийн үйл ажиллагааны төлөв",

      combinedPerformanceDescription:
        "Бэлэн байдал болон ашиглалтын нэгдсэн гүйцэтгэл.",

      availability:
        "Бэлэн байдал",

      utilization:
        "Ашиглалт",

      fleetPerformance:
        "Техникийн гүйцэтгэл",

      fleetPerformanceTrend:
        "Техникийн гүйцэтгэлийн чиг хандлага",

      chartActualAgainstTarget:
        "бодит гүйцэтгэлийг зорилтот түвшинтэй харьцуулсан, сүүлийн 30 хоног",

      actual:
        "Гүйцэтгэл",

      variance:
        "Зөрүү",

      atOrAboveTarget:
        "Зорилтот түвшинд хүрсэн / давсан",

      belowTarget:
        "Зорилтот түвшнээс доогуур",

      actualAtOrAboveTarget:
        "Гүйцэтгэл ≥ Зорилт",

      actualBelowTarget:
        "Гүйцэтгэл < Зорилт",

      truckId:
        "Техникийн дугаар",
    },
 
    plant: {
      title: "Баяжуулах үйлдвэрийн гүйцэтгэл",

      operationalIntelligence:
        "Үйл ажиллагааны мэдээлэл",

      pageDescription:
        "Боловсруулах хүчин чадал болон металл авалтын гүйцэтгэлийг зорилтот түвшинтэй харьцуулсан үзүүлэлт.",

      reportingDate:
        "Тайлангийн огноо",

      unavailable:
        "Мэдээлэл байхгүй",

      unableToLoad:
        "Баяжуулах үйлдвэрийн гүйцэтгэлийн мэдээллийг ачаалж чадсангүй.",

      plantKpi:
        "Үйлдвэрийн KPI",

      target:
        "Зорилтот түвшин",

      healthy:
        "Хэвийн",

      attentionRequired:
        "Анхаарал шаардлагатай",

      critical:
        "Ноцтой",

      plantOperatingStatus:
        "Баяжуулах үйлдвэрийн үйл ажиллагааны төлөв",

      combinedPerformanceDescription:
        "Боловсруулах хүчин чадал болон металл авалтын нэгдсэн гүйцэтгэл.",

      throughputPerformance:
        "Боловсруулах хүчин чадлын гүйцэтгэл",

      recovery:
        "Металл авалт",

      plantPerformance:
        "Үйлдвэрийн гүйцэтгэл",

      actual:
        "Гүйцэтгэл",

      variance:
        "Зөрүү",

      atOrAboveTarget:
        "Зорилтот түвшинд хүрсэн / давсан",

      belowTarget:
        "Зорилтот түвшнээс доогуур",

      actualAtOrAboveTarget:
        "Гүйцэтгэл ≥ Зорилт",

      actualBelowTarget:
        "Гүйцэтгэл < Зорилт",

      plantPerformanceTrend:
        "Үйлдвэрийн гүйцэтгэлийн чиг хандлага",

      chartActualAgainstTarget:
        "бодит гүйцэтгэлийг зорилтот түвшинтэй харьцуулсан, сүүлийн 30 хоног",

      throughput:
        "Боловсруулах хүчин чадал",

      throughputPlan:
        "Боловсруулалтын төлөвлөгөө",

      throughputActual:
        "Боловсруулалтын гүйцэтгэл",
    },
 
    safety: {
      title: "Аюулгүй ажиллагаа",
      incidents: "Осол, зөрчил",
      nearMisses: "Осолд дөхсөн тохиолдол",
      criticalRisks: "Ноцтой эрсдэл",
      safetyScore: "Аюулгүй ажиллагааны үнэлгээ",

      operationalIntelligence: "Үйл ажиллагааны мэдээлэл",
      safetyPerformance: "Аюулгүй ажиллагааны гүйцэтгэл",
      pageDescription:
        "Аюулгүй ажиллагааны үнэлгээ, осол зөрчил, осолд дөхсөн тохиолдол болон ноцтой эрсдэлийн гүйцэтгэл.",
      reportingDate: "Тайлангийн огноо",
      unavailable: "Мэдээлэл байхгүй",
      refreshSafetyData: "Аюулгүй ажиллагааны мэдээллийг шинэчлэх",
      unableToLoad: "Аюулгүй ажиллагааны шинжилгээг ачаалж чадсангүй.",

      safetyOperatingStatus: "Аюулгүй ажиллагааны төлөв",
      attentionRequired: "Анхаарал шаардлагатай",
      controlled: "Хяналттай",
      monitor: "Хянах",
      statusDescriptionAttention:
        "Бүртгэгдэх осол, зөрчил эсвэл ноцтой эрсдэл илэрсэн тул удирдлагын анхаарал шаардлагатай.",
      statusDescriptionControlled:
        "Одоогоор бүртгэгдэх осол, зөрчил болон ноцтой эрсдэлгүй, аюулгүй ажиллагааны гүйцэтгэл хяналттай байна.",
      statusDescriptionMonitor:
        "Одоогоор осол, зөрчил болон ноцтой эрсдэлгүй боловч аюулгүй ажиллагааны үнэлгээ зорилтот түвшнээс доогуур байна.",

      safetyKpi: "Аюулгүй ажиллагааны KPI",
      leadingIndicator: "Тэргүүлэх үзүүлэлт",
      criticalControl: "Ноцтой эрсдэлийн хяналт",
      atOrAboveTarget: "Зорилтот түвшинд хүрсэн / давсан",
      targetValue: "Зорилт {value}%",
      noRecordableIncidents: "Бүртгэгдэх осол, зөрчил байхгүй",
      managementAttentionRequired: "Удирдлагын анхаарал шаардлагатай",
      noNearMissesReported: "Осолд дөхсөн тохиолдол бүртгэгдээгүй",
      reviewAndLearn: "Шалгаж, сургамж авах",
      noOpenCriticalRisks: "Нээлттэй ноцтой эрсдэл байхгүй",
      immediateAttentionRequired: "Яаралтай анхаарал шаардлагатай",

      recordableIncidents: "Бүртгэгдэх осол, зөрчил",
      safetyPerformanceTrend: "Аюулгүй ажиллагааны гүйцэтгэлийн чиг хандлага",
      chartActualAgainstTarget:
        "бодит гүйцэтгэлийг зорилтот түвшинтэй харьцуулсан, сүүлийн 30 хоног",
      score: "Үнэлгээ",
      target: "Зорилт",
      actual: "Гүйцэтгэл",
      variance: "Зөрүү",
      atTarget: "Зорилтот түвшинд",
      aboveTarget: "Зорилтоос дээгүүр",
      actualAtOrAboveTarget: "Гүйцэтгэл ≥ Зорилт",
      actualBelowTarget: "Гүйцэтгэл < Зорилт",
      noIncidents: "Осол, зөрчил байхгүй",
      incidentRecorded: "Осол, зөрчил бүртгэгдсэн",
      noNearMisses: "Осолд дөхсөн тохиолдол байхгүй",
      noCriticalRisks: "Ноцтой эрсдэл байхгүй",
      criticalRiskPresent: "Ноцтой эрсдэл илэрсэн",
    },
 
    reports: {
      title: "Удирдлагын тайлан",
      headerDescription: "Уурхайн удирдлагын хуралд зориулсан удирдлагын тайлан, үйл ажиллагааны тойм, ТУЗ-ийн танилцуулга болон бүтэцтэй өгөгдлийн экспортыг үүсгэнэ.",
      pdfReports: "PDF тайлангууд",
      powerPointBoardPack: "PowerPoint удирдлагын багц",
      excelExport: "Excel экспорт",
      availableOutputs: "Боломжит гаралт",
      availableOutputsDescription: "Өдөр, долоо хоног, сар, PowerPoint болон Excel.",
      executiveBoardPack: "Удирдлагын танилцуулгын багц",
      executiveBoardPackSubtitle: "Удирдлагын үйл ажиллагааны тоймд зориулсан PowerPoint танилцуулга.",
      onDemand: "Шаардлагатай үед",
      newLabel: "ШИНЭ",
      dailyExecutiveReport: "Өдөр тутмын удирдлагын тайлан",
      dailyExecutiveReportSubtitle: "Уурхайн удирдлагын өдөр тутмын хуралд бэлэн хураангуй.",
      weeklyOperationsReport: "Долоо хоногийн үйл ажиллагааны тайлан",
      weeklyOperationsReportSubtitle: "Долоо хоногийн гүйцэтгэлийн хуралд зориулсан үйл ажиллагааны чиг хандлагын тойм.",
      monthlyKpiPack: "Сарын KPI багц",
      monthlyKpiPackSubtitle: "Сарын удирдлагын тоймд зориулсан KPI багц.",
      daily: "Өдөр тутам",
      weekly: "Долоо хоног бүр",
      monthly: "Сар бүр",
      includes: "Багтсан",
      executiveKpiSummary: "Удирдлагын KPI хураангуй",
      productionTrend: "Олборлолтын чиг хандлага",
      fleetPlantSafety: "Техник, үйлдвэр ба аюулгүй ажиллагаа",
      keyOperationalRisks: "Үйл ажиллагааны гол эрсдэлүүд",
      managementActions: "Удирдлагын арга хэмжээ",
      executiveRecommendations: "Удирдлагын зөвлөмж",
      executiveSummary: "Удирдлагын хураангуй",
      productionPerformance: "Олборлолтын гүйцэтгэл",
      fleetPlantStatus: "Техник ба үйлдвэрийн төлөв",
      safetyRiskOverview: "Аюулгүй ажиллагаа ба эрсдэлийн тойм",
      priorityActions: "Тэргүүлэх арга хэмжээ",
      weeklyKpiTrends: "Долоо хоногийн KPI чиг хандлага",
      departmentPerformance: "Хэлтсийн гүйцэтгэл",
      riskMovement: "Эрсдэлийн өөрчлөлт",
      aiRecommendations: "AI зөвлөмж",
      actionFollowUp: "Арга хэмжээний хяналт",
      mineHealthScore: "Уурхайн эрүүл мэндийн оноо",
      monthlyKpiSummary: "Сарын KPI хураангуй",
      productionVariance: "Олборлолтын хэлбэлзэл",
      riskRegister: "Эрсдэлийн бүртгэл",
      managementCommentary: "Удирдлагын тайлбар",
      generatePowerPoint: "PowerPoint үүсгэх",
      generatingPowerPoint: "PowerPoint үүсгэж байна...",
      generatePdf: "PDF үүсгэх",
      generatingPdf: "PDF үүсгэж байна...",
      exportExcel: "Excel экспортлох",
      generatingExcel: "Excel үүсгэж байна...",
      excelExportSubtitle: "Үйл ажиллагааны өгөгдлийг шинжилгээ, хуваалцах болон Power BI-д ашиглахаар экспортлоно.",
      production: "Олборлолт",
      fleet: "Техник",
      plant: "Үйлдвэр",
      safety: "Аюулгүй ажиллагаа",
      maintenance: "Засвар үйлчилгээ",
      reportHistory: "Тайлангийн түүх",
      reportHistoryDescription: "Mine Manager AI-аар саяхан үүсгэсэн удирдлагын тайлангууд.",
      refreshReportHistory: "Тайлангийн түүхийг шинэчлэх",
      loadingReportHistory: "Тайлангийн түүхийг ачаалж байна...",
      noReportHistory: "Тайлангийн түүх одоогоор алга",
      noReportHistoryDescription: "Эхний түүхийн бичлэгийг үүсгэхийн тулд PDF, PowerPoint эсвэл Excel тайлан үүсгэнэ үү.",
      report: "Тайлан",
      format: "Формат",
      mine: "Уурхай",
      generated: "Үүсгэсэн",
      size: "Хэмжээ",
      status: "Төлөв",
      unnamedReport: "Нэргүй тайлан",
      system: "Систем",
      done: "Дууссан",
      failed: "Амжилтгүй",
      unknown: "Тодорхойгүй",
      historyLoadError: "Тайлангийн түүхийг ачаалж чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.",
      reportGenerateError: "Тайлан үүсгэж чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.",
      sessionExpired: "Таны нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.",
      noReportPermission: "Танд энэ тайланг татах эрх байхгүй байна.",
      reportServiceError: "Тайлангийн үйлчилгээний алдаа гарлаа. Backend log-ийг шалгана уу.",
      powerPointSuccess: "Удирдлагын PowerPoint багц амжилттай үүслээ.",
      dailySuccess: "Өдөр тутмын удирдлагын тайлан амжилттай үүслээ.",
      weeklySuccess: "Долоо хоногийн үйл ажиллагааны тайлан амжилттай үүслээ.",
      monthlySuccess: "Сарын KPI багц амжилттай үүслээ.",
      excelSuccess: "Удирдлагын Excel файл амжилттай экспортлогдлоо.",
      excel: "Удирдлагын Excel экспорт",
      powerpoint: "Удирдлагын PowerPoint багц",
      history: "Тайлангийн түүх",
    },
 
    settings: {
      title: "Тохиргоо",
      company: "Компани",
      mine: "Уурхай",
      language: "Хэл",
      timezone: "Цагийн бүс",
      configuration: "Тохиргоо",
    },
  },
};
 
export default translations;
