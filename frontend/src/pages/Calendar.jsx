import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import Badge from "@mui/material/Badge";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
  Paper,
} from "@mui/material";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import api from "../utils/ApiHandler";

dayjs.extend(utc);
dayjs.extend(timezone);

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isSelected =
    !props.outsideCurrentMonth &&
    highlightedDays.indexOf(props.day.date()) >= 0;

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={
        isSelected ? (
          <CircleRoundedIcon sx={{ fontSize: "10.5px" }} />
        ) : undefined
      }
      sx={{
        "& .MuiBadge-badge": {
          right: 6,
          top: 6,
          color: "red",
          padding: "0px",
          minWidth: "auto",
          height: "auto",
        },
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

function EventItem({ event }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <ListItem
        alignItems="flex-start"
        dense
        secondaryAction={
          <IconButton
            edge="end"
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        }
      >
        <ListItemText
          primary={event.name}
          primaryTypographyProps={{ variant: "body2" }}
          secondary={
            <Box
              component="span"
              sx={{ display: "flex", alignItems: "center", mt: 0.25 }}
            >
              <AccessTimeIcon sx={{ fontSize: "0.79rem", mr: 0.5 }} />
              <Typography variant="caption" component="span">
                {event.formattedTime || dayjs(event.date).format("HH:mm")}
              </Typography>
            </Box>
          }
        />
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
          <Typography variant="caption">{event.desc}</Typography>
        </Box>
      </Collapse>
      <Divider component="li" />
    </>
  );
}

export default function Calendar() {
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDays, setHighlightedDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEvents, setShowEvents] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [allMonthEvents, setAllMonthEvents] = useState({});

  const fetchEvents = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const formattedMonth = date.format("YYYY-MM");

      const response = await api.get(
        `/api/events?year_month=${formattedMonth}`
      );

      const eventsData = response.data.events || [];

      const eventsByDate = {};
      const daysWithEvents = [];

      eventsData.forEach((event) => {
        const jsDate = new Date(event.date);
        const localTimeStr = jsDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const localDateStr = jsDate.toLocaleDateString();
        const dateKey = localDateStr.split(",")[0];

        const dayOfMonth = jsDate.getDate();

        const enhancedEvent = {
          ...event,
          formattedDate: dateKey,
          formattedTime: localTimeStr,
          jsDate: jsDate,
        };

        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];

          if (!daysWithEvents.includes(dayOfMonth)) {
            daysWithEvents.push(dayOfMonth);
          }
        }

        eventsByDate[dateKey].push(enhancedEvent);
      });

      Object.keys(eventsByDate).forEach((date) => {
        eventsByDate[date].sort((a, b) => {
          return dayjs(a.date).valueOf() - dayjs(b.date).valueOf();
        });
      });

      setAllMonthEvents(eventsByDate);
      setHighlightedDays(daysWithEvents);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentMonth);
  }, [currentMonth, fetchEvents]);

  const handleMonthChange = (date) => {
    setShowEvents(false);
    setCurrentMonth(date);
  };

  const handleDateClick = (date) => {
    const jsDate = date.toDate();
    const localDateStr = jsDate.toLocaleDateString();
    const dateKey = localDateStr.split(",")[0];

    const dayEvents = allMonthEvents[dateKey] || [];

    setSelectedDate(date);
    setEvents(dayEvents);
    setShowEvents(dayEvents.length > 0);
  };

  return (
    <Box
      sx={{
        p: 2.1,
        overflow: "hidden",
        height: "auto",
        "& > *": {
          overflow: "hidden !important",
        },
      }}
    >
      <Grid container spacing={1}>
        <Grid item xs={12} sx={{ overflow: "hidden" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              defaultValue={currentMonth}
              loading={isLoading}
              onMonthChange={handleMonthChange}
              renderLoading={() => <DayCalendarSkeleton />}
              slots={{
                day: ServerDay,
              }}
              slotProps={{
                day: {
                  highlightedDays,
                },
              }}
              onChange={(newDate) => handleDateClick(newDate)}
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                overflow: "hidden !important",
                margin: "0 auto",
                padding: 0,
                "& .MuiDayCalendar-root": {
                  overflow: "hidden !important",
                },

                "& .MuiPickersDay-root": {
                  width: "35.7px",
                  height: "35.7px",
                  fontSize: "0.945rem",
                  margin: "1px",
                },

                "& .MuiDayCalendar-weekDayLabel": {
                  width: "35.7px",
                  height: "23.1px",
                  fontSize: "0.89rem",
                  fontWeight: "bold",
                  margin: "1px",
                },

                "& .MuiPickersCalendarHeader-root": {
                  height: "36.75px",
                  paddingLeft: "12.6px",
                  paddingRight: "12.6px",
                  marginTop: "2.1px",
                  marginBottom: "6.3px",
                  minHeight: "unset",
                  overflow: "hidden",
                },

                "& .MuiPickersCalendarHeader-label": {
                  fontSize: "1.26rem",
                  fontWeight: "bold",
                },

                "& .MuiPickersCalendarHeader-switchViewButton, & .MuiPickersArrowSwitcher-button":
                  {
                    width: "29.4px",
                    height: "29.4px",
                    minWidth: "unset",
                    padding: 0,
                    "& svg": {
                      fontSize: "1.26rem",
                    },
                  },

                "& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer": {
                  width: "100%",
                  maxWidth: "100%",
                  justifyContent: "space-around",
                  padding: 0,
                  margin: 0,
                  overflow: "hidden",
                },

                "& .MuiDayCalendar-weekContainer:last-child": {
                  marginBottom: "2.1px",
                },

                "& .PrivatePickersSlideTransition-root": {
                  overflow: "hidden !important",
                  minHeight: "unset",
                },

                "& .MuiDayCalendarSkeleton-root": {
                  overflow: "hidden !important",
                },

                "& .MuiPickersCalendarHeader-labelContainer": {
                  overflow: "hidden",
                },

                "& *": {
                  overflow: "hidden !important",
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {showEvents && (
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                mt: 0.525,
                mb: 1.05,
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              <Box sx={{ p: 1.05, bgcolor: "#f5f5f5" }}>
                <Typography variant="subtitle2" sx={{ fontSize: "0.945rem" }}>
                  {" "}
                  Events for {selectedDate?.format("MMMM D, YYYY")}
                </Typography>
              </Box>

              <List
                sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}
                dense
              >
                {events.length > 0 ? (
                  events.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))
                ) : (
                  <ListItem dense>
                    <ListItemText
                      primary="No events for this day"
                      primaryTypographyProps={{
                        variant: "caption",
                        style: { fontSize: "calc(0.75rem * 1.05)" },
                      }}
                      sx={{ textAlign: "center", color: "text.secondary" }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
