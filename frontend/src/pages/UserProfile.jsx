import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useAuth } from "../components/auth/AuthContext";

const UserProfile = () => {
  const { user, isAuthenticated } = useAuth();

  const getUserInfo = () => {
    if (!user) return null;

    const dbInfo = user.db_info || {};

    return {
      name: dbInfo.username || " ",
      email: dbInfo.email || " ",
      sub: dbInfo.auth0_id,
      position: dbInfo.position || " ",
      department: dbInfo.department || " ",
      isActive: dbInfo.isActive !== undefined ? dbInfo.isActive : true,
    };
  };

  const userInfo = getUserInfo();

  const renderUserDetailInfo = () => {
    if (!userInfo) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Details
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="Username" secondary={userInfo.name} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email" secondary={userInfo.email} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Department"
                secondary={userInfo.department}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Position" secondary={userInfo.position} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Status"
                secondary={
                  <Chip
                    label={userInfo.isActive ? "Active" : "Inactive"}
                    color={userInfo.isActive ? "success" : "error"}
                    size="small"
                  />
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading user profile...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>{renderUserDetailInfo()}</Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
