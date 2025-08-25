import React, { useState } from "react";
import {
  useAuth,
  useBillingGroup,
  useBillingGroupInvitations,
  useShop,
} from "#hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { shopSidenavItems } from "../..";
import { Page } from "#page";
import { Loading } from "#loading";
import { Button } from "#button";
import { Util, Alert, DropdownInput, Badge } from "tabler-react-2";
import { useModal } from "#modal";
import { CreateBillingGroupInvitation } from "../../../../../components/billingGroup/CreateBillingGroupInvitation";
import { Table } from "#table";
import moment from "moment";
import { MOMENT_FORMAT } from "#constants";
import { EditBillingGroup } from "../../../../../components/billingGroup/EditBillingGroup";
import { switchStatusForBadge } from "../../jobs";
import { EditBillingGroupInvitation } from "../../../../../components/editBillingGroupInvitation/EditBillingGroupInvitation";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Icon } from "#icon";
import { MarkdownRender } from "#markdownRender";
import { ShopUserPicker } from "#shopUserPicker";

const AddUserToBillingGroupModal = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("member");
  const { shopId, groupId } = useParams();
  const { opLoading, addUserToGroup } = useBillingGroup(shopId, groupId);

  return (
    <div>
      <label className="form-label">
        Choose a user to add to the billing group
      </label>
      <ShopUserPicker value={user} onChange={setUser} />
      <label className="form-label mt-2">Role</label>
      <DropdownInput
        value={role}
        onChange={setRole}
        prompt="Pick a role"
        values={[
          {
            id: "ADMIN",
            label: "Admin",
          },
          {
            id: "MEMBER",
            label: "Member",
          },
        ]}
      />
      <Button
        className="mt-2"
        variant="primary"
        onClick={async () => {
          await addUserToGroup(user, role.id);
          navigate(0);
        }}
        disabled={!user || !role}
        loading={opLoading}
      >
        Add User
      </Button>
    </div>
  );
};

export const BillingGroupPage = () => {
  const { shopId, groupId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);

  const {
    billingGroup,
    loading,
    opLoading,
    updateBillingGroup,
    refetch: refetchBillingGroup,
    removeUserFromGroup,
  } = useBillingGroup(shopId, groupId);

  const {
    billingGroupInvitations,
    loading: loadingInvitations,
    createBillingGroupInvitation,
    opLoading: opLoadingInvitations,
  } = useBillingGroupInvitations(shopId, groupId);

  const { modal, ModalElement } = useModal({
    title: "Create a new invitation link",
    text: (
      <CreateBillingGroupInvitation
        createBillingGroupInvitation={createBillingGroupInvitation}
        opLoading={opLoadingInvitations}
      />
    ),
  });

  const { modal: selectUserModal, ModalElement: SelectUserModalElement } =
    useModal({
      title: "Add a user to the billing group",
      text: (
        <AddUserToBillingGroupModal
          billingGroup={billingGroup}
          shopId={shopId}
          refetch={refetchBillingGroup}
        />
      ),
    });

  const [editing, setEditing] = useState(false);

  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const userIsPrivileged =
    user.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR" ||
    billingGroup?.userRole === "ADMIN";

  if (loading || loadingInvitations)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Billing Groups",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Billing Groups",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      {ModalElement}
      {SelectUserModalElement}
      <Util.Row justify="between" align="center">
        <h1>{billingGroup.title}</h1>
        <Util.Row gap={1}>
          <Button
            variant="primary"
            href={`/shops/${shopId}/billing-groups/${groupId}/portal`}
          >
            Portal
          </Button>
          {userIsPrivileged && (
            <>
              {!editing && (
                <Button onClick={() => setEditing(true)}>Edit</Button>
              )}
            </>
          )}
        </Util.Row>
      </Util.Row>
      {billingGroup.adminUsers?.length == 0 &&
      billingGroup.users?.length == 0 ? (
        <Alert variant="danger" title="No Members">
          This group does not have any members
        </Alert>
      ) : (
        <></>
      )}
      {editing ? (
        <>
          <EditBillingGroup
            billingGroup={billingGroup}
            opLoading={opLoading}
            updateBillingGroup={updateBillingGroup}
            onFinish={async () => {
              await refetchBillingGroup(false);
              setEditing(false);
            }}
            // updateBillingGroup={console.log}
          />
        </>
      ) : (
        <p>
          <b>Admin</b>: {billingGroup.adminUsers?.[0]?.name || "Unset"}
          <br />
          {billingGroup.userCount} user{billingGroup.userCount != 1 ? "s" : ""}
        </p>
      )}
      <Util.Spacer size={1} />
      {userIsPrivileged && !editing && (
        <>
          <Util.Row justify="between" align="center">
            <h2>Invitations</h2>
            <Util.Row gap={1}>
              <Button onClick={selectUserModal}>Add a user</Button>
              <Button onClick={modal}>Create a new invitation link</Button>
            </Util.Row>
          </Util.Row>
          <Util.Spacer size={1} />
          {billingGroupInvitations.length === 0 ? (
            <i>
              You do not have any invitation links.{" "}
              <Link onClick={modal}>You can create one here.</Link>
            </i>
          ) : (
            <Table
              columns={[
                {
                  label: "Link",
                  accessor: "id",
                  render: (id) => (
                    <Util.Row align="center" gap={1}>
                      <Link
                        to={`/shops/${shopId}/billing-groups/${groupId}/invitations/${id}`}
                      >
                        Link
                      </Link>
                      <Button
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `${document.location.origin}/shops/${shopId}/billing-groups/${groupId}/invitations/${id}`
                          )
                        }
                      >
                        {copiedText ===
                        `${document.location.origin}/shops/${shopId}/billing-groups/${groupId}/invitations/${id}` ? (
                          <Icon i="check" />
                        ) : (
                          <Icon i="copy" />
                        )}
                      </Button>
                    </Util.Row>
                  ),
                },
                {
                  label: "Expires",
                  accessor: "expires",
                  sortable: true,
                  render: (e) => (
                    <span>
                      {moment(e).format(MOMENT_FORMAT) || "Never"}{" "}
                      {e && moment(e).isBefore(moment()) && (
                        <Badge color="red" soft>
                          Expired
                        </Badge>
                      )}
                    </span>
                  ),
                },
                {
                  label: "Active",
                  accessor: "active",
                  render: (a) =>
                    a ? (
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
                  label: "Edit",
                  accessor: "id",
                  render: (id) => (
                    <EditBillingGroupInvitation
                      invitationId={id}
                      refetch={() => document.location.reload()}
                    />
                  ),
                },
              ]}
              data={billingGroupInvitations}
            />
          )}
          <Util.Spacer size={2} />
          <h2>Users</h2>
          <p>
            {billingGroup.userCount} user{billingGroup.userCount > 1 ? "s" : ""}
          </p>
          <Table
            columns={[
              {
                label: "Name",
                accessor: "user",
                render: (u) => (
                  <span>
                    {u.firstName + " " + u.lastName}{" "}
                    {u.id === user.id && (
                      <Badge color="green" soft>
                        You{" "}
                      </Badge>
                    )}
                  </span>
                ),
              },
              {
                label: "Email",
                accessor: "user.email",
                render: (email) => <Link to={`mailto:${email}`}>{email}</Link>,
              },
              {
                label: "Joined at",
                accessor: "createdAt",
                render: (c) => moment(c).format(MOMENT_FORMAT),
              },
              {
                label: "Role",
                accessor: "role",
                render: (role) => (
                  <Badge color="blue" soft>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </Badge>
                ),
              },
              {
                label: "Remove",
                accessor: "user.id",
                render: (id) =>
                  id === user.id ? (
                    <></>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      outline
                      onClick={() => removeUserFromGroup(id)}
                      loading={opLoading}
                    >
                      <Icon i="plug-connected-x" /> Remove
                    </Button>
                  ),
              },
            ]}
            data={billingGroup.users}
          />
          <Util.Spacer size={2} />
          <h2>Jobs</h2>
          {billingGroup.jobs?.length === 0 ? (
            <i>
              There are no jobs in this billing group. You can add jobs by
              clicking the "Edit" button above and turning on job connections.
            </i>
          ) : (
            <Table
              columns={[
                {
                  label: "Title",
                  accessor: "title",
                  render: (title, context) => (
                    <Link to={`/shops/${shopId}/jobs/${context.id}`}>
                      {title}
                    </Link>
                  ),
                },
                {
                  label: "Items",
                  accessor: "id",
                  render: (id, context) => (
                    <span>
                      <span className="text-red">
                        {context.unapprovedItems} Needs Approval
                      </span>
                      <br />
                      <span className="text-green">
                        {context.approvedItems} Approved
                      </span>
                      <br />
                      <span className="text-orange">
                        {context.rejectedItems} Rejected
                      </span>
                    </span>
                  ),
                },

                {
                  label: "Status",
                  accessor: "status",
                  render: (status) => switchStatusForBadge(status),
                },
                {
                  label: "Created At",
                  accessor: "createdAt",
                  render: (createdAt) =>
                    moment(createdAt).format(MOMENT_FORMAT),
                },
                {
                  label: "Due Date",
                  accessor: "dueDate",
                  render: (dueDate) => (
                    <>
                      {moment(dueDate).format("MM/DD/YY")} (
                      {moment(dueDate).fromNow()})
                    </>
                  ),
                },
              ]}
              data={billingGroup.jobs}
            />
          )}
          <Util.Spacer size={2} />
          <h2>Description</h2>
          <MarkdownRender markdown={billingGroup.description} />
        </>
      )}
    </Page>
  );
};
