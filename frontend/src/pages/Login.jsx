import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useAuth } from "../components/auth/AuthContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const getNextUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const nextUrlParam = searchParams.get("nextUrl");

    if (nextUrlParam) return nextUrlParam;

    const { from } = location.state || { from: { pathname: "/dashboard" } };
    return from.pathname + (from.search || "");
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const nextUrl = encodeURIComponent(getNextUrl());
      const apiUrl = `${process.env.REACT_APP_BACKEND_ENDPOINT}/api/request-login?nextUrl=${nextUrl}`;

      const response = await axios.get(apiUrl);

      if (response.data.success && response.data.login_url) {
        window.location.href = response.data.login_url;
      }
    } catch (error) {
      console.error("Login request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getNextUrl());
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center" }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please log in to access your account
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
          sx={{
            bgcolor: "black",
            color: "white",
            py: 1.5,
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.8)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Login with Auth0"
          )}
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;
