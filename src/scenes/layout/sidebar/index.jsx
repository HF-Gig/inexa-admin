/* eslint-disable react/prop-types */
import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useState } from "react";
import { tokens } from "../../../theme";
import { Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import {
  MenuOutlined,
  PeopleAltOutlined,
  SchoolOutlined,
  BusinessOutlined,
  CardMembershipOutlined,
  StarOutlined,
  ManageAccountsOutlined,
  ContactMailOutlined,
  CorporateFareOutlined,
  PaidOutlined,
} from "@mui/icons-material";
import logo from "../../../assets/images/full-logo.png";
import Item from "./Item";
import { ToggledContext } from "../../../App";
import { useNavigate } from "react-router-dom";

const SideBar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { toggled, setToggled } = useContext(ToggledContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const getCurrentUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userInfo?.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  return (
    <Sidebar
      backgroundColor="#282828"
      rootStyles={{
        border: 0,
        height: "100%",
      }}
      collapsed={collapsed}
      onBackdropClick={() => setToggled(false)}
      toggled={toggled}
      breakPoint="md"
    >
      <Menu
        menuItemStyles={{
          button: { ":hover": { background: "transparent" } },
        }}
      >
        <MenuItem
          rootStyles={{
            margin: "10px 0 20px 0",
            color: colors.gray[100],
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {!collapsed && (
              <Box
                display="flex"
                alignItems="center"
                gap="12px"
                sx={{ transition: ".3s ease" }}
              >
                <img
                  style={{ height: "30px" }}
                  src={logo}
                  alt="Inexa"
                  onClick={() => navigate("/")}
                />
              </Box>
            )}
            <IconButton onClick={() => setCollapsed(!collapsed)}>
              <MenuOutlined />
            </IconButton>
          </Box>
        </MenuItem>
      </Menu>

      <Box mb={5} pl={collapsed ? undefined : "5%"}>
        <Menu
          menuItemStyles={{
            button: {
              ":hover": {
                color: "#868dfb",
                background: "transparent",
                transition: ".4s ease",
              },
            },
          }}
        >
          {getCurrentUserRole() !== "editor" && getCurrentUserRole() !== "moderator" &&
            <Item
              title="Learners"
              path="/users"
              colors={colors}
              icon={<PeopleAltOutlined />}
            />
          }
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Instructors"
              path="/staff"
              colors={colors}
              icon={<PeopleAltOutlined />}
            />
          }
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Universities"
              path="/organization"
              colors={colors}
              icon={<BusinessOutlined />}
            />
          }
          <Item
            title="Courses"
            path="/courses"
            colors={colors}
            icon={<SchoolOutlined />}
          />
          <Item
            title="Programs"
            path="/programs"
            colors={colors}
            icon={<SchoolOutlined />}
          />
          {/* <Item
            title="Certificates"
            path="/certificates"
            colors={colors}
            icon={<CardMembershipOutlined />}
          /> */}
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Featured"
              path="/featured"
              colors={colors}
              icon={<StarOutlined />}
            />
          }
          {getCurrentUserRole() !== "editor" && getCurrentUserRole() !== "moderator" &&
            <Item
              title="Management"
              path="/management"
              colors={colors}
              icon={<ManageAccountsOutlined />}
            />
          }
          <Item
            title="Subscriptions"
            path="/subscriptions"
            colors={colors}
            icon={<CardMembershipOutlined />}
          />
          <Item
            title="Payments"
            path="/payments"
            colors={colors}
            icon={<PaidOutlined />}
          />
          <Item
            title="Costs"
            path="/costs"
            colors={colors}
            icon={<PaidOutlined />}
          />
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Contact Forms"
              path="/contact"
              colors={colors}
              icon={<ContactMailOutlined />}
            />
          }
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Inexa Facilitators"
              path="/inexa-staff"
              colors={colors}
              icon={<PeopleAltOutlined />}
            />
          }
          {getCurrentUserRole() !== "moderator" &&
            <Item
              title="Providers"
              path="/providers"
              colors={colors}
              icon={<CorporateFareOutlined />}
            />
          }
        </Menu>
      </Box>
    </Sidebar>
  );
};

export default SideBar;
