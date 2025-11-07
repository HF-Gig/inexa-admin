/* eslint-disable react/prop-types */
import { MenuItem } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { ToggledContext } from "../../../App";

const Item = ({ title, path, icon }) => {
  const location = useLocation();
  const { setToggled } = useContext(ToggledContext);

  const handleClick = () => {
    setToggled(false);
  };

  return (
    <MenuItem
      component={<Link to={path} />}
      to={path}
      icon={icon}
      onClick={handleClick}
      rootStyles={{
        color: "#fff",
      }}
    >
      {title}
    </MenuItem>
  );
};

export default Item;
