import {
  Box,
  LinearProgress,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";

import {
  useLanguage,
} from "../../context/LanguageContext";


const SUMMARY_CARDS = [
  {
    key: "total",
    labelKey:
      "executiveActionSummary.totalActions",
    helperKey:
      "executiveActionSummary.allExecutiveActions",
    symbol: "Σ",
    tone: "neutral",
    clickable: true,
  },
  {
    key: "open",
    labelKey:
      "executiveActionSummary.open",
    helperKey:
      "executiveActionSummary.notYetStarted",
    symbol: "○",
    tone: "neutral",
    clickable: true,
  },
  {
    key: "in_progress",
    labelKey:
      "executiveActionSummary.inProgress",
    helperKey:
      "executiveActionSummary.currentlyBeingExecuted",
    symbol: "◐",
    tone: "blue",
    clickable: true,
  },
  {
    key: "completed",
    labelKey:
      "executiveActionSummary.completed",
    helperKey:
      "executiveActionSummary.successfullyClosed",
    symbol: "✓",
    tone: "green",
    clickable: true,
  },
  {
    key: "blocked",
    labelKey:
      "executiveActionSummary.blocked",
    helperKey:
      "executiveActionSummary.requiresIntervention",
    symbol: "⊘",
    tone: "red",
    clickable: true,
  },
  {
    key: "completion_percentage",
    labelKey:
      "executiveActionSummary.completionRate",
    helperKey:
      "executiveActionSummary.overallCompletion",
    symbol: "↗",
    tone: "primary",
    clickable: false,
  },
];


const PROGRESS_CARDS = [
  {
    key: "due_today",
    labelKey:
      "executiveActionSummary.dueToday",
    helperKey:
      "executiveActionSummary.actionsRequiringAttentionToday",
    symbol: "⌚",
    tone: "amber",
    clickable: true,
  },
  {
    key: "overdue",
    labelKey:
      "executiveActionSummary.overdue",
    helperKey:
      "executiveActionSummary.pastDueAndStillActive",
    symbol: "!",
    tone: "red",
    clickable: true,
  },
  {
    key: "high_priority",
    labelKey:
      "executiveActionSummary.highPriority",
    helperKey:
      "executiveActionSummary.criticalAndHighActiveActions",
    symbol: "↑",
    tone: "orange",
    clickable: true,
  },
  {
    key: "completed_this_month",
    labelKey:
      "executiveActionSummary.completedThisMonth",
    helperKey:
      "executiveActionSummary.actionsClosedThisMonth",
    symbol: "✓",
    tone: "green",
    clickable: true,
  },
  {
    key: "average_days_to_close",
    labelKey:
      "executiveActionSummary.averageCloseTime",
    helperKey:
      "executiveActionSummary.averageDaysCreationToClosure",
    symbol: "◷",
    tone: "blue",
    clickable: false,
  },
];


function translateTemplate(
  t,
  key,
  variables = {}
) {
  let text = String(
    t(key) || ""
  );

  Object.entries(
    variables
  ).forEach(
    ([name, value]) => {
      text = text.replaceAll(
        `{${name}}`,
        String(value ?? "")
      );
    }
  );

  return text;
}


function getToneStyles(
  tone,
  primaryColor
) {
  const tones = {
    neutral: {
      color: "#475569",
      backgroundColor:
        "#f1f5f9",
      borderColor:
        "#e2e8f0",
      activeBackground:
        "#e2e8f0",
    },

    blue: {
      color: "#1d4ed8",
      backgroundColor:
        "#eff6ff",
      borderColor:
        "#bfdbfe",
      activeBackground:
        "#dbeafe",
    },

    green: {
      color: "#15803d",
      backgroundColor:
        "#f0fdf4",
      borderColor:
        "#bbf7d0",
      activeBackground:
        "#dcfce7",
    },

    red: {
      color: "#b91c1c",
      backgroundColor:
        "#fef2f2",
      borderColor:
        "#fecaca",
      activeBackground:
        "#fee2e2",
    },

    amber: {
      color: "#a16207",
      backgroundColor:
        "#fefce8",
      borderColor:
        "#fde68a",
      activeBackground:
        "#fef3c7",
    },

    orange: {
      color: "#c2410c",
      backgroundColor:
        "#fff7ed",
      borderColor:
        "#fed7aa",
      activeBackground:
        "#ffedd5",
    },

    primary: {
      color: primaryColor,
      backgroundColor:
        `${primaryColor}12`,
      borderColor:
        `${primaryColor}35`,
      activeBackground:
        `${primaryColor}20`,
    },
  };

  return (
    tones[tone] ||
    tones.neutral
  );
}


function formatMetricValue(
  card,
  value,
  language,
  t
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    if (
      card.key ===
      "completion_percentage"
    ) {
      return "0%";
    }

    if (
      card.key ===
      "average_days_to_close"
    ) {
      return translateTemplate(
        t,
        "executiveActionSummary.daysValue",
        {
          value: "0.0",
        }
      );
    }

    return "0";
  }

  if (
    card.key ===
    "completion_percentage"
  ) {
    const decimals =
      numericValue % 1 === 0
        ? 0
        : 1;

    return `${numericValue.toFixed(
      decimals
    )}%`;
  }

  if (
    card.key ===
    "average_days_to_close"
  ) {
    return translateTemplate(
      t,
      "executiveActionSummary.daysValue",
      {
        value:
          numericValue.toFixed(
            1
          ),
      }
    );
  }

  return numericValue.toLocaleString(
    language === "MN"
      ? "mn-MN"
      : "en-US"
  );
}


function SummaryCard({
  card,
  summary,
  loading,
  primaryColor,
  activeFilter,
  onCardClick,
  language,
  t,
}) {
  const toneStyles =
    getToneStyles(
      card.tone,
      primaryColor
    );

  const value =
    summary?.[card.key] ?? 0;

  const isClickable =
    Boolean(
      card.clickable &&
      onCardClick &&
      !loading
    );

  const isActive =
    activeFilter ===
    card.key;

  const label =
    t(card.labelKey);

  const helper =
    t(card.helperKey);

  const handleClick = () => {
    if (!isClickable) {
      return;
    }

    onCardClick(
      card.key
    );
  };

  const handleKeyDown = (
    event
  ) => {
    if (!isClickable) {
      return;
    }

    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onCardClick(
        card.key
      );
    }
  };

  return (
    <Paper
      component={
        isClickable
          ? "button"
          : "div"
      }
      type={
        isClickable
          ? "button"
          : undefined
      }
      role={
        isClickable
          ? "button"
          : undefined
      }
      tabIndex={
        isClickable
          ? 0
          : undefined
      }
      aria-pressed={
        isClickable
          ? isActive
          : undefined
      }
      aria-label={
        isClickable
          ? label
          : undefined
      }
      onClick={
        isClickable
          ? handleClick
          : undefined
      }
      onKeyDown={
        isClickable
          ? handleKeyDown
          : undefined
      }
      elevation={0}
      sx={{
        width: "100%",
        minHeight: 188,
        p: 2.5,

        borderRadius:
          "18px",

        border:
          "1px solid",

        borderColor:
          isActive
            ? toneStyles.color
            : "#e2e8f0",

        backgroundColor:
          isActive
            ? toneStyles.activeBackground
            : "#ffffff",

        display: "flex",

        flexDirection:
          "column",

        justifyContent:
          "space-between",

        textAlign:
          "left",

        fontFamily:
          "inherit",

        appearance:
          "none",

        cursor:
          isClickable
            ? "pointer"
            : "default",

        position:
          "relative",

        overflow:
          "hidden",

        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",

        "&:hover":
          isClickable
            ? {
                transform:
                  "translateY(-2px)",

                borderColor:
                  toneStyles.color,

                boxShadow:
                  "0 12px 28px rgba(15, 23, 42, 0.08)",
              }
            : {},

        "&:focus-visible": {
          outline:
            `3px solid ${toneStyles.borderColor}`,
          outlineOffset: 3,
        },
      }}
    >
      {isActive && (
        <Box
          sx={{
            position:
              "absolute",

            top: 0,
            left: 0,
            right: 0,

            height: 4,

            backgroundColor:
              toneStyles.color,
          }}
        />
      )}

      <Box
        sx={{
          display:
            "flex",

          alignItems:
            "flex-start",

          justifyContent:
            "space-between",

          gap: 2,
        }}
      >
        <Box>
          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              gap: 0.75,

              flexWrap:
                "wrap",
            }}
          >
            <Typography
              sx={{
                color:
                  isActive
                    ? toneStyles.color
                    : "#475569",

                fontSize: 13,

                fontWeight:
                  800,

                letterSpacing:
                  "0.01em",
              }}
            >
              {label}
            </Typography>

            {isActive && (
              <Box
                component="span"
                sx={{
                  px: 0.8,
                  py: 0.25,

                  borderRadius:
                    "999px",

                  color:
                    toneStyles.color,

                  backgroundColor:
                    "#ffffff",

                  border:
                    `1px solid ${toneStyles.borderColor}`,

                  fontSize: 10,

                  fontWeight:
                    900,

                  lineHeight:
                    1.4,

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.04em",
                }}
              >
                {t(
                  "executiveActionSummary.active"
                )}
              </Box>
            )}
          </Box>

          {loading ? (
            <Skeleton
              variant="text"
              width={74}
              height={58}
              sx={{
                mt: 0.8,
              }}
            />
          ) : (
            <Typography
              sx={{
                mt: 0.75,

                color:
                  "#0f172a",

                fontSize: {
                  xs: 30,
                  md: 34,
                },

                fontWeight:
                  900,

                lineHeight:
                  1.15,

                letterSpacing:
                  "-0.03em",
              }}
            >
              {formatMetricValue(
                card,
                value,
                language,
                t
              )}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,

            flexShrink: 0,

            borderRadius:
              "13px",

            color:
              toneStyles.color,

            backgroundColor:
              isActive
                ? "#ffffff"
                : toneStyles.backgroundColor,

            border:
              `1px solid ${toneStyles.borderColor}`,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            fontSize: 20,

            fontWeight:
              900,
          }}
        >
          {card.symbol}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2.25,

          display:
            "flex",

          alignItems: {
            xs:
              "flex-start",
            sm:
              "center",
          },

          justifyContent:
            "space-between",

          gap: 1,
        }}
      >
        <Typography
          sx={{
            color:
              isActive
                ? "#334155"
                : "#64748b",

            fontSize:
              12.5,

            lineHeight:
              1.5,
          }}
        >
          {helper}
        </Typography>

        {isClickable && (
          <Typography
            component="span"
            sx={{
              flexShrink: 0,

              color:
                toneStyles.color,

              fontSize: 11,

              fontWeight:
                800,
            }}
          >
            {isActive
              ? t(
                  "executiveActionSummary.filtering"
                )
              : t(
                  "executiveActionSummary.viewActions"
                )}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}


function CompletionProgress({
  summary,
  loading,
  primaryColor,
  language,
  t,
}) {
  const rawPercentage =
    Number(
      summary
        ?.completion_percentage ??
        0
    );

  const percentage =
    Number.isFinite(
      rawPercentage
    )
      ? Math.min(
          Math.max(
            rawPercentage,
            0
          ),
          100
        )
      : 0;

  const completed =
    Number(
      summary?.completed ??
        0
    );

  const total =
    Number(
      summary?.total ??
        0
    );

  const locale =
    language === "MN"
      ? "mn-MN"
      : "en-US";

  const progressDescription =
    translateTemplate(
      t,
      "executiveActionSummary.actionsCompletedProgress",
      {
        completed:
          completed.toLocaleString(
            locale
          ),

        total:
          total.toLocaleString(
            locale
          ),
      }
    );

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,

        p: {
          xs: 2,
          md: 2.5,
        },

        borderRadius:
          "16px",

        border:
          "1px solid #e2e8f0",

        backgroundColor:
          "#ffffff",
      }}
    >
      <Box
        sx={{
          display:
            "flex",

          alignItems: {
            xs:
              "flex-start",
            sm:
              "center",
          },

          justifyContent:
            "space-between",

          flexDirection: {
            xs:
              "column",
            sm:
              "row",
          },

          gap: 1,

          mb: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              color:
                "#0f172a",

              fontSize: 15,

              fontWeight:
                800,
            }}
          >
            {t(
              "executiveActionSummary.executiveActionCompletion"
            )}
          </Typography>

          <Typography
            sx={{
              mt: 0.35,

              color:
                "#64748b",

              fontSize:
                12.5,
            }}
          >
            {loading
              ? t(
                  "executiveActionSummary.loadingActionProgress"
                )
              : progressDescription}
          </Typography>
        </Box>

        {loading ? (
          <Skeleton
            width={52}
            height={30}
          />
        ) : (
          <Typography
            sx={{
              color:
                primaryColor,

              fontSize: 18,

              fontWeight:
                900,
            }}
          >
            {percentage.toFixed(
              percentage % 1 ===
                0
                ? 0
                : 1
            )}
            %
          </Typography>
        )}
      </Box>

      {loading ? (
        <Skeleton
          variant="rounded"
          height={10}
        />
      ) : (
        <LinearProgress
          variant="determinate"
          value={percentage}
          aria-label={t(
            "executiveActionSummary.executiveActionCompletion"
          )}
          sx={{
            height: 10,

            borderRadius:
              "999px",

            backgroundColor:
              "#e2e8f0",

            "& .MuiLinearProgress-bar":
              {
                borderRadius:
                  "999px",

                backgroundColor:
                  primaryColor,
              },
          }}
        />
      )}
    </Paper>
  );
}


function ExecutiveActionSummary({
  summary,
  loading = false,
  primaryColor = "#16a34a",
  onCardClick,
  activeFilter = "",
}) {
  const {
    language,
    t,
  } = useLanguage();

  return (
    <Box>
      <Box
        sx={{
          display:
            "flex",

          alignItems: {
            xs:
              "flex-start",
            sm:
              "center",
          },

          justifyContent:
            "space-between",

          flexDirection: {
            xs:
              "column",
            sm:
              "row",
          },

          gap: 1,

          mb: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color:
                "#0f172a",

              fontSize: 20,

              fontWeight:
                800,
            }}
          >
            {t(
              "executiveActionSummary.executionOverview"
            )}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,

              color:
                "#64748b",

              fontSize:
                13.5,
            }}
          >
            {t(
              "executiveActionSummary.selectCardToFilter"
            )}
          </Typography>
        </Box>

        {activeFilter && (
          <Typography
            sx={{
              color:
                primaryColor,

              fontSize:
                12.5,

              fontWeight:
                800,
            }}
          >
            {t(
              "executiveActionSummary.summaryFilterActive"
            )}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

              sm:
                "repeat(2, minmax(0, 1fr))",

              lg:
                "repeat(3, minmax(0, 1fr))",

              xl:
                "repeat(6, minmax(0, 1fr))",
            },

          gap: 2,
        }}
      >
        {SUMMARY_CARDS.map(
          (card) => (
            <SummaryCard
              key={
                card.key
              }
              card={
                card
              }
              summary={
                summary
              }
              loading={
                loading
              }
              primaryColor={
                primaryColor
              }
              activeFilter={
                activeFilter
              }
              onCardClick={
                onCardClick
              }
              language={
                language
              }
              t={t}
            />
          )
        )}
      </Box>

      <CompletionProgress
        summary={
          summary
        }
        loading={
          loading
        }
        primaryColor={
          primaryColor
        }
        language={
          language
        }
        t={t}
      />

      <Box
        sx={{
          mt: 4,
          mb: 2,
        }}
      >
        <Typography
          sx={{
            color:
              "#0f172a",

            fontSize: 20,

            fontWeight:
              800,
          }}
        >
          {t(
            "executiveActionSummary.deliveryAccountability"
          )}
        </Typography>

        <Typography
          sx={{
            mt: 0.4,

            color:
              "#64748b",

            fontSize:
              13.5,
          }}
        >
          {t(
            "executiveActionSummary.deliveryDescription"
          )}
        </Typography>
      </Box>

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

              sm:
                "repeat(2, minmax(0, 1fr))",

              lg:
                "repeat(3, minmax(0, 1fr))",

              xl:
                "repeat(5, minmax(0, 1fr))",
            },

          gap: 2,
        }}
      >
        {PROGRESS_CARDS.map(
          (card) => (
            <SummaryCard
              key={
                card.key
              }
              card={
                card
              }
              summary={
                summary
              }
              loading={
                loading
              }
              primaryColor={
                primaryColor
              }
              activeFilter={
                activeFilter
              }
              onCardClick={
                onCardClick
              }
              language={
                language
              }
              t={t}
            />
          )
        )}
      </Box>
    </Box>
  );
}


export default ExecutiveActionSummary;