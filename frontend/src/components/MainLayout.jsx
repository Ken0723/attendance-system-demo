import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import ResponsiveMenu from "./ResponsiveMenu";
import { useAuth } from "./auth/AuthContext";

const MainLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <ResponsiveMenu />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 300px)` },
          ml: { md: "300px" },
          mt: "64px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
