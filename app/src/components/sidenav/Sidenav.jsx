import React, { useState } from "react";
import styles from "./sidenav.module.css";
import { Button } from "#button";
import { Util } from "tabler-react-2";
import { Icon } from "#icon";

export const Sidenav = ({ items }) => {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("collapsed") === "true"
  );

  const collapse = () => {
    const newCollapsed = !collapsed;
    localStorage.setItem("collapsed", newCollapsed);
    setCollapsed(newCollapsed);
  };

  return (
    <nav
      className={styles.sidenav}
      style={{
        width: collapsed ? 50 : 200,
        transition: "width 0.2s",
      }}
    >
      {items.map((item, index) =>
        item.type === "divider" ? (
          <Util.Hr key={index} />
        ) : (
          <Button
            href={item.href}
            variant={item.active && "primary"}
            outline={item.active}
            key={index}
          >
            <Util.Row gap={1}>
              {item.icon && item.icon}
              {!collapsed && item.text}
            </Util.Row>
          </Button>
        )
      )}
      <div style={{ flex: 1 }} />
      <Button onClick={collapse}>
        <Icon i={collapsed ? "chevron-right" : "chevron-left"} size={18} />
        {collapsed ? "" : "Collapse"}
      </Button>
      <div style={{ height: 20 }} />
    </nav>
  );
};
