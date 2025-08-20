import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import { useState, useRef, useEffect } from "react";
import api from "../../utils/ApiHandler";
import NotificationMsg from "../../components/NotificationMsg";
import {
  Button,
  Collapse,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  IconButton,
  TextField,
  FormLabel,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const StyledGridOverlay = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  "& .no-rows-primary": {
    fill: "#3D4751",
    ...theme.applyStyles("light", {
      fill: "#AEB8C2",
    }),
  },
  "& .no-rows-secondary": {
    fill: "#1D2126",
    ...theme.applyStyles("light", {
      fill: "#E8EAED",
    }),
  },
}));

const ExpandableArea = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

function ExpandablePermission({ row, onPermissionChange, permissionList }) {
  const initializePermissions = () => {
    const permissionsState = {};

    if (permissionList && permissionList.length > 0) {
      permissionList.forEach((role) => {
        const hasRole =
          row.roles &&
          Array.isArray(row.roles) &&
          row.roles.some((userRole) => userRole.id === role.id);
        permissionsState[role.id] = hasRole;
      });
    }

    return permissionsState;
  };

  const [permissions, setPermissions] = useState(initializePermissions());

  useEffect(() => {
    setPermissions(initializePermissions());
  }, [row, permissionList]);

  const handlePermissionChange = (event) => {
    const { name, checked } = event.target;

    const updatedPermissions = {
      ...permissions,
      [name]: checked,
    };

    setPermissions(updatedPermissions);

    const selectedRoleIds = Object.entries(updatedPermissions)
      .filter(([_, isSelected]) => isSelected)
      .map(([roleId, _]) => roleId);

    onPermissionChange(row.id, selectedRoleIds);
  };

  return (
    <ExpandableArea>
      <Typography variant="h6" gutterBottom>
        Permission Settings for {row.name}
      </Typography>
      <FormControl component="fieldset">
        {permissionList && permissionList.length > 0 ? (
          permissionList.map((role) => (
            <FormControlLabel
              key={role.id}
              control={
                <Checkbox
                  checked={permissions[role.id] || false}
                  onChange={handlePermissionChange}
                  name={role.id}
                />
              }
              label={role.name}
            />
          ))
        ) : (
          <></>
        )}
      </FormControl>
    </ExpandableArea>
  );
}

function ExpandableUserControl({ target_user }) {
  const [department, setDepartment] = useState(target_user?.department || "");
  const [position, setPosition] = useState(target_user?.position || "");

  useEffect(() => {
    if (target_user) {
      setDepartment(target_user.department || "");
      setPosition(target_user.position || "");
    }
  }, [target_user]);

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
  };

  const handlePositionChange = (e) => {
    setPosition(e.target.value);
  };

  const handleSubmit = async (e) => {
    try {
      const response = await api.post("/api/user-info", {
        user_id: target_user.db_user_id,
        department: department,
        position: position,
      });

      if (response.status === 200) {
        console.log("success");
        // snackbarRef.current.showMessage("success", "User updated successfully");
      } else {
        console.log(response);
        // snackbarRef.current.showMessage("failure", response.message);
      }
    } catch (error) {
      console.error("Error on update user information:", error);
    }
  };

  return (
    <ExpandableArea>
      <Typography variant="h6" gutterBottom>
        User Settings for {target_user.name}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControl component="fieldset">
          <FormLabel htmlFor="Department">Department:</FormLabel>
          <TextField
            required
            fullWidth
            id="department"
            name="department"
            variant="outlined"
            value={department}
            onChange={handleDepartmentChange}
          />
        </FormControl>
        <FormControl component="fieldset">
          <FormLabel htmlFor="Position">Position:</FormLabel>
          <TextField
            required
            fullWidth
            id="position"
            name="position"
            variant="outlined"
            value={position}
            onChange={handlePositionChange}
          />
        </FormControl>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          gap: 2,
          mt: 2,
        }}
      >
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setDepartment(target_user?.department || "");
            setPosition(target_user?.position || "");
          }}
        >
          Cancel
        </Button>
      </Box>
    </ExpandableArea>
  );
}

const GridOverlayHeight = (props) => {
  const [userslist, setUsersList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [usersListLoaded, setUsersListLoaded] = useState(false);

  const [grouplists, setGroupLists] = useState([]);
  const [groupListsLoaded, setGroupListsLoaded] = useState(false);

  const [permissionList, setPermissionList] = useState([]);
  const [permissionListLoading, setPermissionListLoading] = useState(false);
  const [permissionListLoaded, setPermissionListLoaded] = useState(false);

  const [isGroupDataChanged, setIsGroupDataChanged] = useState(false);
  const snackbarRef = useRef(null);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpand = (rowId) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [rowId]: !prevState[rowId],
    }));
  };

  const handlePermissionChange = async (userId, roleIds) => {
    try {
      const user = userslist.find((u) => u.id === userId);
      if (!user || !user.auth0_id) {
        throw new Error(`User not found or missing auth0_id: ${userId}`);
      }

      await api.post(`/api/auth0-user/${user.auth0_id}/roles`, {
        roles: roleIds,
      });

      const selectedRoles = roleIds
        .map((roleId) => {
          const role = permissionList.find((p) => p.id === roleId);
          return role ? { id: role.id, name: role.name } : null;
        })
        .filter(Boolean);

      setUsersList((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                roles: selectedRoles,
              }
            : user
        )
      );

      snackbarRef.current.showMessage(
        "success",
        "Permissions updated successfully"
      );
    } catch (error) {
      console.error("Failed to update permissions:", error);
      snackbarRef.current.showMessage(
        "error",
        `Failed to update permissions: ${error.message}`
      );
    }
  };

  const fetchUsersWithRoles = async () => {
    if (usersListLoaded && userslist.length > 0) return;

    setUserListLoading(true);
    try {
      const usersResponse = await api.get("/api/auth0-user");

      if (usersResponse.data && Array.isArray(usersResponse.data)) {
        setUsersList(usersResponse.data);
        setUsersListLoaded(true);
      } else {
        snackbarRef.current.showMessage("error", "Error on getting users");
      }
    } catch (error) {
      console.error("Failed to fetch users list:", error);
      snackbarRef.current.showMessage("error", "Failed to fetch users list");
    } finally {
      setUserListLoading(false);
    }
  };

  const fetchPermissionList = async () => {
    if (permissionListLoaded && permissionList.length > 0) return;

    setPermissionListLoading(true);

    try {
      const response = await api.get("/api/auth0-permission");

      if (response.data && Array.isArray(response.data)) {
        setPermissionList(response.data);
        setPermissionListLoaded(true);
      } else {
        snackbarRef.current.showMessage("error", "Error getting permissions");
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      snackbarRef.current.showMessage("error", "Failed to fetch permissions");
    } finally {
      setPermissionListLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissionList();
    fetchUsersWithRoles();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 150,
      }}
    >
      <NotificationMsg ref={snackbarRef} />
      <Box>
        {userslist.map((user) => (
          <Box
            key={user.id}
            style={{
              marginBottom: "8px",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
            }}
          >
            <Box
              style={{ display: "flex", padding: "16px", alignItems: "center" }}
            >
              <Box style={{ flex: 1 }}>{user.name}</Box>
              <Box style={{ flex: 1 }}>{user.nickname}</Box>
              <Box style={{ flex: 1 }}>{user.email}</Box>
              <Box style={{ flex: 1, textAlign: "center" }}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => toggleRowExpand(user.id)}
                  sx={{
                    border: "1px solid rgba(0, 0, 0, 0.23)",
                    borderRadius: "4px",
                    padding: "5px",
                  }}
                >
                  {expandedRows[user.id] ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </IconButton>
              </Box>
            </Box>
            <Collapse in={expandedRows[user.id] || false}>
              {props.mode === "PermissionList" ? (
                <ExpandablePermission
                  row={user}
                  onPermissionChange={handlePermissionChange}
                  permissionList={permissionList}
                />
              ) : (
                <ExpandableUserControl target_user={user} />
              )}
            </Collapse>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default GridOverlayHeight;
