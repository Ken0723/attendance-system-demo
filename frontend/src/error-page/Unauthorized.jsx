import React from "react";
import { useAuth } from "../components/auth/AuthContext";
import { Button } from "@mui/material";

const Unauthorized = () => {
  const { logout } = useAuth();

  return (
    <>
      {" "}
      <div>
        <h1>Access Denied</h1>
        <p>You don't have enough permission to access this page</p>
      </div>
      <Button variant="outlined" color="error" onClick={logout}>Logout</Button>
    </>
  );
};

export default Unauthorized;
