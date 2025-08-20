import React, { useState, forwardRef, useImperativeHandle } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const NotificationMsg = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("success");
  const [message, setMessage] = useState("");

  useImperativeHandle(ref, () => ({
    showMessage: (severity, message) => {
      setSeverity(severity);
      setMessage(message);
      setOpen(true);
    },
  }));

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
});

export default NotificationMsg;
