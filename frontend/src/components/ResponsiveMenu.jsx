import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Stack,
  Divider,
  Avatar,
  MenuItem,
  ListItemIcon,
  Menu,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LogoutIcon from "@mui/icons-material/Logout";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CelebrationIcon from "@mui/icons-material/Celebration";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import GroupIcon from "@mui/icons-material/Group";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import BadgeIcon from "@mui/icons-material/Badge";

const NAVIGATION = [
  {
    kind: "header",
    title: "Main",
    requiredPermission: null,
  },
  {
    segment: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    requiredPermission: "get:dashboard",
  },
  {
    segment: "attendance",
    title: "Attendance",
    path: "/attendance",
    icon: <ScheduleIcon />,
    requiredPermission: "get:attendance",
  },
  {
    segment: "calendar",
    title: "Calendar",
    path: "/calendar",
    icon: <CalendarMonthIcon />,
    requiredPermission: "get:calendar",
  },
  {
    kind: "header",
    title: "Admin",
    requiredPermission: "get:admin-panel",
  },
  {
    segment: "event-control",
    title: "Event Control",
    path: "/event-control",
    icon: <CelebrationIcon />,
    requiredPermission: "post:events",
  },
  {
    segment: "attendance-control",
    title: "Attendance Control",
    path: "/attendance-control",
    icon: <AccessAlarmIcon />,
    requiredPermission: "post:attendance",
  },
  {
    segment: "permission-control",
    title: "Permission Control",
    path: "/permission-control",
    icon: <BadgeIcon />,
    requiredPermission: "assign:permission",
  },
  {
    segment: "user-control",
    title: "User Control",
    path: "/user-control",
    icon: <GroupIcon />,
    requiredPermission: "post:user-info",
  },
];

function AccountSidebarPreview(props) {
  const { handleClick, open, mini } = props;
  const { user } = useAuth();

  return (
    <Stack direction="column" p={0} overflow="hidden">
      <Divider />
      <Box
        onClick={handleClick}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Avatar sx={{ width: 32, height: 32, mr: 2 }} src={user?.image}>
          {user?.username?.[0]}
        </Avatar>
        {!mini && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">{user?.username}</Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
}

function UserProfile({ mini }) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Divider />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Avatar
            sx={{ width: 32, height: 32, mr: 2, cursor: "pointer" }}
            onClick={() => navigate("/user-profile")}
          >
            {user?.db_info.username?.[0]}
          </Avatar>
          {!mini && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{user?.db_info.username}</Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.db_info.email}
              </Typography>
            </Box>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={handleMenuClick}
          aria-controls={menuOpen ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            logout();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

const ResponsiveAppBar = () => {
  const drawerWidth = 300;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [mini, setMini] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuth();

  if (location.pathname === "/login") {
    return null;
  }

  const filteredNavigation = NAVIGATION.filter((item) => {
    if (item.requiredPermission === null) return true;
    return permissions.includes(item.requiredPermission);
  });

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        width: "99.9%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          System
        </Typography>
      </Box>

      <List sx={{ flex: 1 }}>
        {filteredNavigation.map((item) =>
          item.kind === "header" ? (
            <Typography
              key={item.title}
              variant="overline"
              sx={{ px: 2, py: 1, display: "block" }}
            >
              {item.title}
            </Typography>
          ) : (
            <ListItem key={item.segment} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>

      <UserProfile mini={mini} />
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2, display: { md: "none" }, color: "black" }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

AccountSidebarPreview.propTypes = {
  handleClick: PropTypes.func,
  mini: PropTypes.bool.isRequired,
  open: PropTypes.bool,
};

ResponsiveAppBar.propTypes = {
  window: PropTypes.func,
};

UserProfile.propTypes = {
  mini: PropTypes.bool,
};

export default ResponsiveAppBar;
