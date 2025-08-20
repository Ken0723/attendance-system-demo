import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Fab } from "@mui/material";
import { useAuth } from "../components/auth/AuthContext";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { green, red } from "@mui/material/colors";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import api from "../utils/ApiHandler";

const Dashboard = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [todayData, setTodayData] = useState(null);
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const hasCheckedIn = todayData && todayData.checkInTime;

  const attendanceStatusSx = {
    bgcolor: hasCheckedIn ? green[500] : red[500],
    width: "100px",
    height: "100px",
    "&:hover": {
      bgcolor: hasCheckedIn ? green[700] : red[700],
    },
  };

  const fetchTodayRecords = async () => {
    try {
      const response = await api.get(
        `/api/attendance?user_id=${
          user.db_info.id
        }&start_date=${startDate.format(
          "YYYY-MM-DD"
        )}&end_date=${endDate.format("YYYY-MM-DD")}`
      );

      const data = response.data;
      setTodayData(data[0]);
    } catch (error) {
      console.error("Error fetching today attendance:", error);
    }
  };

  useEffect(() => {
    fetchTodayRecords();
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return "Not recorded";

    return dayjs.utc(timeString).format("h:mm A");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              backgroundColor: hasCheckedIn ? green[50] : red[50],
              border: `1px solid ${hasCheckedIn ? green[200] : red[200]}`,
              borderRadius: 2,
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Fab sx={{ ...attendanceStatusSx, pointerEvents: "none" }}>
                  {hasCheckedIn ? (
                    <CheckIcon sx={{ fontSize: "64px" }} />
                  ) : (
                    <CloseIcon sx={{ fontSize: "64px" }} />
                  )}
                </Fab>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: hasCheckedIn ? green[800] : red[800],
                  fontWeight: 600,
                  mb: 1,
                  mt: 1,
                }}
              >
                {hasCheckedIn
                  ? "Attendance Recorded Successfully"
                  : "No Attendance Record"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                }}
              >
                {hasCheckedIn ? (
                  <CheckIcon sx={{ color: green[500], fontSize: 20 }} />
                ) : (
                  <CloseIcon sx={{ color: red[500], fontSize: 20 }} />
                )}
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Check-in time:{" "}
                  {todayData ? formatTime(todayData.checkInTime) : ""}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
