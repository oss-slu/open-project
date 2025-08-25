import React from "react";
import { Page, sidenavItems } from "#page";
import { useAuth } from "#useAuth";
import { Typography, Util, Badge } from "tabler-react-2";
import { useModal } from "#modal";
import { Table } from "#table";
import { useUsers } from "../../hooks/useUsers";
import { Spinner } from "#spinner";
import { Avatar } from "#avatar";
import { Icon } from "#icon";
import { Link } from "react-router-dom";
const { H1 } = Typography;
import moment from "moment";

export const UsersPage = () => {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();

  const { modal, ModalElement } = useModal({
    title: "Admin Only page",
    text: "This page is only accessible by global admins. This means that typical users, professors, or even shop managers are not able to see this page.",
  });

  return (
    <Page sidenavItems={sidenavItems("Users", user.admin)}>
      <H1>Users</H1>
      <Badge color="red" onClick={modal}>
        Admin Only
      </Badge>

      <Util.Spacer size={2} />

      {usersLoading ? (
        <Spinner />
      ) : (
        <Table
          columns={[
            {
              label: "",
              accessor: "id",
              render: (id) => <Avatar size="xs" dicebear initials={id} />,
            },
            {
              label: "Name",
              accessor: "name",
              render: (name, context) => (
                <>
                  <Link to={`/users/${context.id}`}>{name}</Link>{" "}
                  {context.isMe && (
                    <Badge color="green" soft>
                      (Your account)
                    </Badge>
                  )}
                  {context.suspended && (
                    <Badge color="red" soft>
                      Suspended
                    </Badge>
                  )}
                </>
              ),
              sortable: true,
            },
            { label: "Email", accessor: "email", sortable: true },
            {
              label: "Last login",
              accessor: "lastLogin",
              sortable: true,
              render: (v) => (v ? moment(v).format("MM/DD/YY, h:mm a") : "-"),
            },
            { label: "Shops", accessor: "shopCount" },
            { label: "Jobs", accessor: "jobCount" },
            {
              label: "Flags",
              accessor: "admin",
              render: (v, context) =>
                v ? (
                  <Util.Row gap={0.5} wrap>
                    {context.admin && (
                      <Badge color="green" soft>
                        Admin
                      </Badge>
                    )}
                    {context.suspended && (
                      <Badge color="red" soft>
                        Suspended
                      </Badge>
                    )}
                  </Util.Row>
                ) : (
                  "No"
                ),
            },
            {
              label: "Created at",
              accessor: "createdAt",
              render: (v) => moment(v).format("MM/DD/YY, h:mm a"),
              sortable: true,
            },
            {
              label: "Actions",
              accessor: "id",
              render: (id) => (
                <Link to={`/users/${id}`}>
                  <Icon i="edit" /> Edit user
                </Link>
              ),
            },
          ]}
          data={users}
        />
      )}

      {ModalElement}
    </Page>
  );
};
