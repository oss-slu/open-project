import React, { useEffect, useState } from "react";
import { useAuth } from "#useAuth";
import styles from "./Header.module.css";
import logo from "#sluopLogo";
import { Dropdown } from "tabler-react-2";
import { Icon } from "#icon";
import { useShop } from "#index";
const IconLogout = () => <Icon i={"logout"} size={18} />;
const IconLogin2 = () => <Icon i={"login-2"} size={18} />;
import classNames from "classnames";

export const Header = () => {
  const { user, loggedIn, login, logout } = useAuth();
  const [shopId, setShopId] = useState("");

  useEffect(() => {
    setInterval(() => {
      const _shopId = document.location.href.match(/\/shops\/([a-z0-9]+)/)?.[1];
      if (_shopId !== shopId) setShopId(_shopId);
    }, 1000);
  }, []);

  const { shop } = useShop(shopId);

  return (
    <header className={styles.header}>
      <div className={styles.headerGroup}>
        <img src={logo} className={styles.headerLogo} alt="SLUCAM Logo" />
        <h1 className={classNames(styles.headerTitle, "hos-600")}>
          {shop?.logoUrl || shop?.logoFile?.location ? (
            <img
              src={shop?.logoUrl || shop?.logoFile?.location}
              className={styles.headerLogo}
              alt={shop?.name}
            />
          ) : (
            shop?.name
          )}
        </h1>
      </div>
      <div className={styles.headerGroup}>
        <a
          className="btn"
          href="https://docs.google.com/forms/d/e/1FAIpQLSeuVXfyYgGUAIiZWXb9NA7JyG1OdWqdfY7lOGsfmQBboKwwMg/viewform?usp=dialog"
          style={{
            height: 36,
          }}
        >
          Feedback
        </a>
        <Dropdown
          prompt={loggedIn ? user?.firstName + " " + user?.lastName : "Account"}
          items={
            loggedIn
              ? [
                  {
                    text: "Log Out",
                    onclick: logout,
                    type: "item",
                    icon: <IconLogout />,
                  },
                ]
              : [
                  {
                    text: "Log In",
                    onclick: login,
                    type: "item",
                    icon: <IconLogin2 />,
                  },
                ]
          }
        />
      </div>
    </header>
  );
};
