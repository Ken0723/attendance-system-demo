import React from "react";
import { Box, styled } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { useLocation } from "react-router-dom";

const FloatingButton = () => {
  const [hidden, setHidden] = React.useState(false);
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (location.pathname === "/login") {
    return null;
  }

  const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: "absolute",
    "&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft": {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    "&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight": {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  }));

  const handleHiddenChange = (event) => {
    setHidden(event.target.checked);
  };

  const actions = [
    { icon: <ArrowUpwardIcon />, name: "Back To Top", actionFunc: scrollToTop },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        mt: 3,
        bottom: "20px",
        right: "10px",
        display: "block",
        opacity: 0.4,
        transition: "opacity 0.3s ease",
        "&:hover": {
          opacity: 1,
        },
      }}
    >
      <StyledSpeedDial
        ariaLabel="Quick Actions"
        hidden={hidden}
        icon={<SpeedDialIcon />}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.actionFunc}
            sx={{ backgroundColor: "white", color: "black" }}
          />
        ))}
      </StyledSpeedDial>
    </Box>
  );
};

export default FloatingButton;
