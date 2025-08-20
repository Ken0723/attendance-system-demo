import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Chip,
} from "@mui/material";
import { useAuth } from "../components/auth/AuthContext";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import dayjs from "dayjs";
import api from "../utils/ApiHandler";

const Attendance = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState(dayjs());
  const [dailySummary, setDailySummary] = useState([]);
  const [detailedView, setDetailedView] = useState(false);
  const [detailedRecords, setDetailedRecords] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchDailySummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/api/attendance?user_id=${
          user.db_info.id
        }&start_date=${startDate.format(
          "YYYY-MM-DD"
        )}&end_date=${endDate.format("YYYY-MM-DD")}`
      );

      const data = response.data;

      setDailySummary(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary]);

  const formatDate = (timestamp) => {
    return timestamp.substring(0, 10);
  };

  const formatTime = (timestamp) => {
    return timestamp.substring(11, 16);
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                />
                <DesktopDatePicker
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  sx={{ marginLeft: "1%", marginRight: "1%" }}
                />
              </LocalizationProvider>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchDailySummary}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Search"}
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={12}>
            <Box
              sx={{
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  bgcolor: "divider",
                }}
              />

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                dailySummary.map((day) => (
                  <Box
                    key={day.date}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 3,
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        position: "absolute",
                        left: -4,
                        zIndex: 1,
                      }}
                    />

                    <Card
                      sx={{
                        ml: 3,
                        width: "100%",
                        bgcolor: "background.paper",
                        boxShadow: 1,
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ fontWeight: "medium" }}
                          >
                            {formatDate(day.date)}
                          </Typography>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                bgcolor: "background.default",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Check-in
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ color: "info.main" }}
                              >
                                {formatTime(day.checkInTime)}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                bgcolor: "background.default",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Check-out
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ color: "info.main" }}
                              >
                                {formatTime(day.checkOutTime)}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                bgcolor: "background.default",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Work Duration
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  color:
                                    day.workDuration >= 9
                                      ? "success.main"
                                      : "warning.main",
                                }}
                              >
                                {day.workDuration.toFixed(2)} 小時
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Collapse in={detailedView[day.date]}>
                          <Box
                            sx={{
                              mt: 2,
                              pt: 2,
                              borderTop: 1,
                              borderColor: "divider",
                            }}
                          >
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              All Check-in Records:
                            </Typography>

                            {detailedRecords[day.date] ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                }}
                              >
                                {detailedRecords[day.date].map((record) => (
                                  <Chip
                                    key={record.id}
                                    label={formatTime(record.timestamp)}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  py: 1,
                                }}
                              >
                                <CircularProgress size={24} />
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Box>
                ))
              )}

              {!isLoading && dailySummary.length === 0 && (
                <Typography sx={{ ml: 3, mt: 3, color: "text.secondary" }}>
                  Not found
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Attendance;
