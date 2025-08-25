import React, { useEffect, useState } from "react";
import { Page } from "#page";
import { useAuth } from "#useAuth";
import { Loading } from "#loading";
import { Typography, Util, Input } from "tabler-react-2";
import { Icon } from "#icon";
import { useParams } from "react-router-dom";
const { H1, H2 } = Typography;
import { useShop } from "../../../hooks/useShop";
import { Button } from "#button";
import { MarkdownRender } from "#markdownRender";
import { MarkdownEditor } from "#markdownEditor";
import { NotFound } from "#notFound";
import { UploadDropzone } from "../../../components/upload/uploader";

export const shopSidenavItems = (
  activeText,
  shopId,
  isGlobalAdmin,
  accountType,
  isInDebt = true
) => {
  const items = [
    {
      type: "item",
      href: `/shops`,
      text: `Back to shops`,
      icon: <Icon i="arrow-left" size={18} />,
    },
    isInDebt && {
      type: "divider",
    },
    isInDebt && {
      type: "item",
      text: <span className={"text-danger"}>Negative Balance</span>,
      active: activeText === "In Debt",
      href: `/shops/${shopId}/billing`,
      icon: <Icon i="credit-card-off" size={18} color="#d63939" />,
    },
    {
      type: "divider",
    },
    {
      type: "item",
      text: "Shop Home",
      active: activeText === "Home",
      href: `/shops/${shopId}`,
      icon: <Icon i="building-store" size={18} />,
    },
    {
      type: "item",
      text: "Jobs",
      active: activeText === "Jobs",
      href: `/shops/${shopId}/jobs`,
      icon: <Icon i="robot" size={18} />,
    },
    {
      type: "item",
      text: "Billing",
      active: activeText === "Billing",
      href: `/shops/${shopId}/billing`,
      icon: <Icon i="credit-card" size={18} />,
    },
    {
      type: "item",
      text: "Resources",
      active: activeText === "Resources",
      href: `/shops/${shopId}/resources`,
      icon: <Icon i="brand-databricks" size={18} />,
    },
  ].filter(Boolean);

  if (accountType !== "CUSTOMER" || isGlobalAdmin) {
    items.push({
      type: "divider",
    });
  }

  if (
    accountType === "ADMIN" ||
    accountType === "OPERATOR" ||
    accountType === "GROUP_ADMIN" ||
    isGlobalAdmin
  ) {
    items.push({
      type: "item",
      href: `/shops/${shopId}/billing-groups`,
      text: "Billing Groups",
      active: activeText === "Billing Groups",
      icon: <Icon i="school" size={18} />,
    });
  }

  if (accountType === "ADMIN" || isGlobalAdmin) {
    items.push({
      type: "item",
      href: `/shops/${shopId}/users`,
      text: "Users",
      active: activeText === "Users",
      icon: <Icon i="users-group" size={18} />,
    });
  }

  return items;
};

export const ShopPage = () => {
  const { user, loading } = useAuth();
  const { shopId } = useParams();
  const {
    shop,
    userShop,
    updateShop,
    opLoading,
    deleteShop,
    deleteModalElement,
  } = useShop(shopId);
  const [editing, setEditing] = useState(false);
  const [newShop, setNewShop] = useState(shop);
  useEffect(() => {
    setNewShop(shop);
  }, [shop]);

  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Home",
          shopId,
          false,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  if (!shop) return <NotFound />;

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Home",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <Util.Row justify="between" align="center">
        <H1>{shop.name}</H1>
        {user.admin || userShop.accountType === "ADMIN"
          ? !editing && (
              <Util.Row justify="end">
                <Button onClick={() => setEditing(true)}>
                  <Icon i="pencil" /> Edit Shop
                </Button>

                <Button onClick={() => deleteShop()}>
                  <Icon i="trash" /> Delete Shop
                </Button>
              </Util.Row>
            )
          : null}
        {deleteModalElement}
      </Util.Row>
      <Util.Spacer size={1} />
      {editing ? (
        <>
          <Util.Row style={{ justifyContent: "space-between" }}>
            <H2>Editing</H2>
            <Button
              onClick={async () => {
                await updateShop(newShop);
                setEditing(false);
              }}
              loading={opLoading}
            >
              Save
            </Button>
          </Util.Row>
          <Util.Col gap={1}>
            <div>
              <label className="form-label">Logo</label>
              <UploadDropzone
                metadata={{
                  shopId: shopId,
                }}
                onUploadComplete={() => document.location.reload()}
                endpoint={`/api/shop/${shopId}/logo`}
                useNewDropzone={true}
              />
            </div>
            <Input
              value={newShop.name}
              onChange={(e) => setNewShop({ ...newShop, name: e })}
              placeholder="Your Shop's Name"
              label="Shop Name"
            />
            <Input
              value={newShop.startingDeposit}
              prependedText="$"
              onChange={(e) => setNewShop({ ...newShop, startingDeposit: e })}
              placeholder="Starting Deposit"
              label="Starting Deposit"
              noMargin
            />
            <i>
              The starting deposit will be deposited to new shop members when
              they are added to the shop. If a user leaves or is removed from a
              shop then returns, they will not receive the starting deposit
              again.
            </i>
            <div>
              <label className="form-label">Description</label>
              <MarkdownEditor
                value={newShop.description || ""}
                onChange={(description) => {
                  setNewShop({ ...newShop, description });
                }}
              />
            </div>
          </Util.Col>
        </>
      ) : (
        <>
          <MarkdownRender markdown={shop.description || ""} />
        </>
      )}
    </Page>
  );
};
