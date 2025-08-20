import { useState, useRef, useCallback, useEffect } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import dayjs from "dayjs";

import { useAuth } from "../../components/auth/AuthContext";
import api from "../../utils/ApiHandler";
import NotificationMsg from "../../components/NotificationMsg";

import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SearchIcon from "@mui/icons-material/Search";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { pink } from "@mui/material/colors";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const EventCard = ({ event, onDelete, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const isEventEnded = new Date(event.date) <= new Date();

  const formattedDate = new Date(event.date).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (event) {
      setEditName(event.name);
      setEditDesc(event.desc || "");
      setEditDate(dayjs(event.date));
    }
  }, [event]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure to delete "${event.name}"？`
    );

    if (confirmDelete) {
      setIsDeleting(true);
      try {
        const response = await api.delete(`/api/events/${event.id}`);

        if (response.status === 200 && response.data && response.data.delete) {
          onDelete(response.data.delete);
          console.log(`Deleted ID: ${response.data.delete}`);
        }

        onDelete(event.id);
      } catch (error) {
        console.error("Error on deleting event:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveEdit = async () => {
    setIsEditing(true);
    try {
      const localDateString = editDate.format("YYYY-MM-DDTHH:mm:ss");
      const tzOffset = editDate.format("Z");
      const dateWithTZ = `${localDateString}${tzOffset}`;

      const eventData = {
        name: editName,
        description: editDesc,
        date: dateWithTZ,
      };

      const response = await api.patch(`/api/events/${event.id}`, eventData);

      if (response.status === 200 && response.data && response.data.updated) {
        const updatedEvent = {
          ...event,
          name: editName,
          desc: editDesc,
          date: dateWithTZ,
        };

        if (onUpdate) {
          onUpdate(updatedEvent);
        }

        setOpenDialog(false);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: isEventEnded ? "none" : "translateY(-4px)",
          boxShadow: isEventEnded ? "none" : "0 8px 16px rgba(0,0,0,0.1)",
        },
        opacity: isEventEnded ? 0.75 : 1,
        backgroundColor: isEventEnded ? "rgba(0,0,0,0.03)" : "inherit",
        position: "relative",
        overflow: "hidden",
        "&::after": isEventEnded
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)",
              pointerEvents: "none",
            }
          : {},
      }}
    >
      {isEventEnded && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: -30,
            transform: "rotate(45deg)",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "2px 30px",
            fontSize: "0.7rem",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          ENDED
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography
            variant="h6"
            component="div"
            noWrap
            sx={{
              mb: 1,
              fontWeight: "bold",
              maxWidth: "80%",
            }}
          >
            {event.name}
          </Typography>
          <Chip
            size="small"
            label={isEventEnded ? "Closed" : "Coming Soon"}
            color={isEventEnded ? "default" : "primary"}
            sx={{ ml: 1 }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
            color: "text.secondary",
          }}
        >
          <EventIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">{formattedDate}</Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            minHeight: "4.5em",
          }}
        >
          {event.desc || ""}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton
          size="small"
          onClick={handleEdit}
          disabled={isEventEnded || isEditing}
          sx={{ ml: 1 }}
        >
          {isEditing ? (
            <CircularProgress size={16} />
          ) : (
            <EditIcon fontSize="small" />
          )}
        </IconButton>

        <IconButton
          size="small"
          onClick={handleDelete}
          disabled={isEventEnded || isDeleting}
        >
          {isDeleting ? (
            <CircularProgress size={16} sx={{ color: pink[500] }} />
          ) : (
            <DeleteIcon fontSize="small" sx={{ color: pink[500] }} />
          )}
        </IconButton>
      </CardActions>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                variant="outlined"
                fullWidth
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Date & Time"
                  value={editDate}
                  onChange={(newValue) => setEditDate(newValue)}
                  sx={{ width: "100%" }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={isEditing}
          >
            {isEditing ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState(dayjs());
  const snackbarRef = useRef(null);
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState(dayjs().add(7, "day"));
  const [isLoading, setIsLoading] = useState(false);
  const [eventHistory, setEventHistory] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateEvent = async () => {
    try {
      const localDateString = eventDate.format("YYYY-MM-DDTHH:mm:ss");

      const tzOffset = eventDate.format("Z");
      const dateWithTZ = `${localDateString}${tzOffset}`;

      const eventData = {
        name: eventName,
        description: eventDescription,
        date: dateWithTZ,
      };

      const response = await api.post("/api/events", eventData);

      if (response.status == 201) {
        setEventName("");
        setEventDescription("");
        setEventDate(null);
        snackbarRef.current.showMessage("success", "Event Created!");
      } else {
        snackbarRef.current.showMessage("error", "Event Create Failed!");
      }
    } catch (error) {
      console.error("Error fetching today attendance:", error);
    }
  };

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = startDate.format("YYYY-MM-DD");
      const formattedEndDate = endDate.format("YYYY-MM-DD");

      const response = await api.get(
        `/api/events?start_date=${formattedStartDate}&end_date=${formattedEndDate}`
      );

      setEventHistory(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching event:", error);
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const handleEventDelete = useCallback((deletedEventId) => {
    setEventHistory((prevHistory) => {
      if (!prevHistory || !prevHistory.events) return prevHistory;

      return {
        ...prevHistory,
        events: prevHistory.events.filter(
          (event) => event.id !== deletedEventId
        ),
      };
    });
  }, []);

  const handleEventUpdate = useCallback((updatedEvent) => {
    setEventHistory((prevHistory) => {
      if (!prevHistory || !prevHistory.events) return prevHistory;

      return {
        ...prevHistory,
        events: prevHistory.events.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        ),
      };
    });

    snackbarRef.current.showMessage("success", "Event Updated Successfully!");
  }, []);

  return (
    <>
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Paper sx={{ width: "100%", mb: 4 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab
                  icon={<ListAltIcon />}
                  label="Existing Events"
                  id="admin-tab-1"
                  aria-controls="admin-tabpanel-0"
                />
                <Tab
                  icon={<EventIcon />}
                  label="Create Events"
                  id="admin-tab-0"
                  aria-controls="admin-tabpanel-1"
                />
              </Tabs>
              <TabPanel value={activeTab} index={0}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    width: "100%",
                  }}
                >
                  <Paper elevation={2} sx={{ p: 2, borderRadius: "8px" }}>
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
                          label="Start Date"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          slotProps={{ textField: { size: "small" } }}
                        />
                        <DesktopDatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          slotProps={{ textField: { size: "small" } }}
                          sx={{ marginLeft: "1%", marginRight: "1%" }}
                        />
                      </LocalizationProvider>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={fetchEvent}
                        disabled={isLoading}
                        startIcon={
                          isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <SearchIcon />
                          )
                        }
                      >
                        {isLoading ? "Search..." : "Search"}
                      </Button>
                    </Box>
                  </Paper>

                  {isLoading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : eventHistory &&
                    eventHistory.events &&
                    eventHistory.events.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Event List ({eventHistory.events.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {eventHistory.events.map((event) => (
                          <Grid item xs={12} sm={6} md={4} key={event.id}>
                            <EventCard
                              event={event}
                              onDelete={handleEventDelete}
                              onUpdate={handleEventUpdate}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    <Paper
                      elevation={1}
                      sx={{
                        p: 4,
                        textAlign: "center",
                        borderRadius: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <EventBusyIcon
                          sx={{ fontSize: 60, color: "text.secondary" }}
                        />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        No Event Found
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Create New Event
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          label="Name"
                          variant="outlined"
                          fullWidth
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Description"
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={4}
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DateTimePicker
                            label="Date & Time"
                            value={eventDate}
                            onChange={(newValue) => setEventDate(newValue)}
                            sx={{ width: "100%" }}
                          />
                        </LocalizationProvider>
                      </Grid>

                      <Grid item xs={12}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                          }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateEvent}
                          >
                            Create Event
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <NotificationMsg ref={snackbarRef} />
    </>
  );
};

export default AdminPanel;
