import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);

      const state = params.get("state");
      const redirectPath = state || "/dashboard";

      navigate(redirectPath, { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return <p>Processing authentication, please wait...</p>;
};

export default Callback;
