import { useState, useRef } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

import api from "../../utils/ApiHandler";
import NotificationMsg from "../../components/NotificationMsg";

import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HowToRegIcon from "@mui/icons-material/HowToReg";

import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Chip,
  Autocomplete,
} from "@mui/material";

const AttendanceControl = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceTime, setAttendanceTime] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const snackbarRef = useRef(null);

  const fetchUsers = async () => {
    if (usersLoaded && users.length > 0) return;

    setUserLoading(true);
    try {
      const response = await api.get("/api/users");

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        setUsersLoaded(true);
      } else {
        snackbarRef.current.showMessage("error", "Error on getting users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      snackbarRef.current.showMessage("error", "Failed to fetch users");
    } finally {
      setUserLoading(false);
    }
  };

  const handleAddAttendance = async () => {
    if (!selectedUser) {
      snackbarRef.current.showMessage("warning", "Please select a user!");
      return;
    }

    setLoading(true);
    try {
      const localDateString = attendanceTime.format("YYYY-MM-DDTHH:mm:ss");

      const tzOffset = attendanceTime.format("Z");
      const dateWithTZ = `${localDateString}${tzOffset}`;

      const userData = {
        user_id: selectedUser.id,
        timestamp: dateWithTZ,
      };
      const response = await api.post("/api/attendance", userData);

      if (response.status === 201) {
        snackbarRef.current.showMessage("success", "Added");

        setSelectedUser(null);
        setAttendanceTime(dayjs());
      } else {
        snackbarRef.current.showMessage("error", "Error on adding records");
      }
    } catch (error) {
      console.error("Failed to add attendance:", error);
      snackbarRef.current.showMessage(
        "error",
        "Failed to add attendance record"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <NotificationMsg ref={snackbarRef} />
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Attendance Record
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              id="select-user"
              options={users}
              getOptionLabel={(option) =>
                `${option.username} - ${option.department} (${option.position})`
              }
              loading={userLoading}
              value={selectedUser}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
              }}
              onOpen={() => {
                fetchUsers();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <PersonIcon color="action" sx={{ mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {userLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      <PersonIcon />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="body1">{option.username}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.department} - {option.position}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Check-in Time"
                value={attendanceTime}
                onChange={(newValue) => setAttendanceTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    InputProps: {
                      startAdornment: (
                        <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                      ),
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<HowToRegIcon />}
                onClick={handleAddAttendance}
                disabled={loading || !selectedUser}
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Add New Attendance Record"
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {selectedUser && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Info:
          </Typography>

          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {selectedUser.username}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Department: {selectedUser.department}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Position: {selectedUser.position}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Chip
                    label={`User ID: ${selectedUser.id}`}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceControl;
