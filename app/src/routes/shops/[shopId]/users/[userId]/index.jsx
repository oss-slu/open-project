import React, { useState } from "react";
import { useAuth, useShop, useUserShop } from "../../../../../hooks";
import { Link, useParams } from "react-router-dom";
import { shopSidenavItems } from "../..";
import { Page } from "../../../../../components/page/page";
import { Loading } from "../../../../../components/loading/Loading";
import { Typography, Util, Input, DropdownInput } from "tabler-react-2";
import { Avatar } from "#avatar";
import { Icon } from "../../../../../util/Icon";
import Badge from "tabler-react-2/dist/badge";
import { Table } from "#table";
import moment from "moment";
import { switchStatusToUI } from "../../../../../components/jobitem/JobItem";
import { Price } from "../../../../../components/price/RenderPrice";
import { useLedger } from "../../../../../hooks/useLedger";
import { LedgerTable } from "../../../../../components/ledger/LedgerTable";
import { Button } from "#button";
import { useModal } from "useModal";
const { H1, H2 } = Typography;

const AddBalanceModalContent = ({ postLedgerItem, opLoading }) => {
  const [type, setType] = useState(null);
  const [value, setValue] = useState(0);

  return (
    <Util.Col gap={1}>
      <div>
        <label className="form-label">Add balance type</label>
        <DropdownInput
          label="Type"
          values={[
            { label: "Topup", id: "MANUAL_TOPUP" },
            { label: "Deposit", id: "MANUAL_DEPOSIT" },
            { label: "User Purchased", id: "FUNDS_PURCHASED" },
            { label: "Reduction", id: "MANUAL_REDUCTION" },
          ]}
          value={type}
          onChange={(v) => setType(v.id)}
          prompt="Select type"
        />
      </div>
      <Input
        type="number"
        label="Amount"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Select a topup amount"
        prependedText="$"
      />
      <i>
        A topup will bring the user's balance to the specified amount if it is
        lower than the specified amount. A deposit will add the fixed specified
        amount to the user's balance.
      </i>

      {type && type.startsWith("AUTOMATED") && (
        <div>
          <p><i>Automated top-ups and deposits will be processed on a regular schedule.</i></p>
          <p>
            {type === "AUTOMATED_TOPUP" ? 
              "The automated top-up will be applied to bring the user's balance to the specified amount." : 
              "The automated deposit will add a fixed amount to the user's balance periodically."}
          </p>
        </div>
      )}

      <Button
        loading={opLoading}
        onClick={async () => {
          await postLedgerItem({ type, value });
          document.location.reload();
        }}
      >
        Post Ledger Item
      </Button>
    </Util.Col>
  );
};

export const ShopUserPage = () => {
  const { shopId, userId } = useParams();
  const { loading, userShop } = useUserShop(shopId, userId);
  const { user } = userShop;
  const { loading: shopLoading, userShop: currentUserShop } = useShop(
    shopId,
    userId
  );
  const { user: currentUser } = useAuth();
  const { ledger, ledgerLoading, balance, postLedgerItem, opLoading } =
    useLedger(shopId, userId);

  const { modal: addBalance, ModalElement: AddBalanceModal } = useModal({
    title: "Post ledger item",
    text: (
      <AddBalanceModalContent
        shopId={shopId}
        userId={userId}
        postLedgerItem={postLedgerItem}
        opLoading={opLoading}
      />
    ),
  });

  if (loading || shopLoading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Users",
          shopId,
          currentUser.admin,
          currentUserShop.accountType,
          currentUserShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Users",
        shopId,
        currentUser.admin,
        currentUserShop.accountType,
        currentUserShop.balance < 0
      )}
    >
      {AddBalanceModal}
      <Util.Row gap={2} align="center">
        <Avatar size="xl" dicebear initials={user.id} />
        <Util.Col>
          <H1>
            {userShop.user.firstName} {userShop.user.lastName}
          </H1>
          <span>
            <Link to={`mailto:${user.email}`}>{user.email}</Link>
          </span>
          <Util.Spacer size={1} />
          <Util.Row gap={0.5}>
            {user.isMe && (
              <Badge color="green" soft>
                <Icon i="user" size={12} />
                This is your profile
              </Badge>
            )}
            {user.admin && (
              <Badge color="green" soft>
                <Icon i="lego" size={12} />
                Global Admin
              </Badge>
            )}
            {user.suspended && (
              <Badge color="red" soft>
                <Icon i="ban" size={12} />
                Globally Suspended
              </Badge>
            )}
          </Util.Row>
        </Util.Col>
      </Util.Row>
      <Util.Hr />
      <H2>Jobs</H2>
      <Table
        columns={[
          {
            label: "Title",
            accessor: "title",
            render: (title, context) => (
              <Link to={`/shops/${shopId}/jobs/${context.id}`}>{title}</Link>
            ),
            sortable: true,
          },
          {
            label: "Total Cost",
            accessor: "totalCost",
            render: (cost) => <Price value={cost} icon />,
            sortable: true,
          },
          {
            label: "Status",
            accessor: "status",
            render: (status) => (
              <Badge color={switchStatusToUI(status)[1]} soft>
                {switchStatusToUI(status)[0]}
              </Badge>
            ),
            sortable: true,
          },
          {
            label: "Finalized",
            accessor: "finalized",
            render: (d) =>
              d ? (
                <Badge color="green" soft>
                  Yes
                </Badge>
              ) : (
                <Badge color="red" soft>
                  No
                </Badge>
              ),
            sortable: true,
          },
          {
            label: "Finalized At",
            accessor: "finalizedAt",
            render: (d) => <>{d ? moment(d).format("MM/DD/YY") : "N/A"}</>,
            sortable: true,
          },
          {
            label: "Due Date",
            accessor: "dueDate",
            render: (d, context) => (
              <>
                {moment(d).format("MM/DD/YY")} ({moment(d).fromNow()}){" "}
                {/* Overdue warning */}
                {new Date(d) < new Date() &&
                  !(new Date(d).toDateString() === new Date().toDateString()) &&
                  !context.finalized && <Badge color="red">Overdue</Badge>}
                {/* Today warning */}{" "}
                {new Date(d).toDateString() === new Date().toDateString() && (
                  <Badge color="yellow">Due Today</Badge>
                )}
              </>
            ),
            sortable: true,
          },
          {
            label: "Created At",
            accessor: "createdAt",
            render: (d) => moment(d).format("MM/DD/YY"),
            sortable: true,
          },
        ]}
        data={user.jobs}
      />
      <Util.Spacer size={2} />
      <Util.Row justify="between" align="center">
        <H2>Ledger</H2>
        <Button onClick={addBalance}>Post ledger item</Button>
      </Util.Row>
      <Util.Spacer size={1} />
      <p>
        Current balance:
        <Price value={balance} icon size={24} />
      </p>
      <Util.Spacer size={1} />
      {ledgerLoading ? (
        <Loading />
      ) : (
        <LedgerTable data={ledger} shopId={shopId} />
      )}
    </Page>
  );
};
