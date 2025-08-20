import { useRef } from "react";
import NotificationMsg from "../../components/NotificationMsg";
import UserList from "../../components/user/UserList";
import {
  Box,
  Paper,
  Typography,
  Grid,
} from "@mui/material";

const UserGroupControl = () => {
  const snackbarRef = useRef(null);

  return (
    <Box>
      <NotificationMsg ref={snackbarRef} />
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Permission Control
        </Typography>

        <Grid container sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <UserList mode="PermissionList" />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default UserGroupControl;
