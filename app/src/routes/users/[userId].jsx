import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { Loading } from "#loading";
import { Page, sidenavItems } from "#page";
import { useAuth } from "#useAuth";
import { Util, Typography, DropdownInput } from "tabler-react-2";
import { Avatar } from "#avatar";
import { LogTimeline } from "../../components/logs/timeline";
import { Table } from "#table";
import moment from "moment";
import { Button } from "#button";
import { Input, Badge } from "tabler-react-2";
import { Icon } from "#icon";
import { useModal } from "#modal";
import { useShops } from "../../hooks/useShops";
import { Spinner } from "#spinner";
import { Alert } from "#alert";
import { useConfirm } from "#confirm";
import { NotFound } from "#notFound";
import { useUserLogs } from "../../hooks/useUserLogs";
const { H2, H3 } = Typography;

const AddUserToShopForm = ({ user, onFinish }) => {
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const { shops, loading, addUserToShop, opLoading, error } = useShops();
  const [ok, setOk] = useState(null);

  if (loading)
    return (
      <>
        <p>Loading Shops...</p>
        <br />
        <Spinner />
      </>
    );

  if (ok)
    return <Alert variant="success">User added to shop successfully</Alert>;

  return (
    <div>
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}
      <H3>Select a shop to add {user.firstName} to:</H3>
      <Util.Row gap={1} wrap>
        <DropdownInput
          prompt="Select a shop"
          values={shops.map((shop) => ({
            id: shop.id,
            label: shop.name,
          }))}
          value={selectedShop}
          onChange={(value) => setSelectedShop(value)}
        />
        <DropdownInput
          prompt="Select a role"
          values={[
            { id: "CUSTOMER", label: "Customer" },
            { id: "OPERATOR", label: "Operator" },
            { id: "ADMIN", label: "Admin" },
            { id: "GROUP_ADMIN", label: "Group Admin" },
          ]}
          value={selectedRole}
          onChange={setSelectedRole}
        />
      </Util.Row>
      {selectedRole && selectedShop && (
        <>
          <Util.Hr />
          <p>
            You are about to add {user.firstName} to {selectedShop.label} as{" "}
            {selectedRole.label}
          </p>
          <Button
            onClick={async () => {
              const ok = await addUserToShop(
                user.id,
                selectedShop.id,
                selectedRole.id
              );
              if (ok) setOk(true);
              onFinish();
            }}
            variant="primary"
            loading={opLoading}
          >
            Confirm
          </Button>
        </>
      )}
    </div>
  );
};

const AddUserToShop = ({ user, shops, loading, onFinish }) => {
  const { modal, ModalElement } = useModal({
    title: "Add User to Shop",
  });

  return (
    <div>
      {ModalElement}
      <Button
        loading={loading}
        onClick={() =>
          modal({
            text: (
              <AddUserToShopForm
                user={user}
                shops={shops}
                onFinish={onFinish}
              />
            ),
          })
        }
      >
        <Icon i="circle-plus" size={18} /> Add {user.firstName} to a new shop
      </Button>
    </div>
  );
};

export const UserPage = () => {
  const { userId } = useParams();
  const {
    user,
    loading,
    refetch,
    updateUserName,
    SuspendConfirmModal,
    UnSuspendConfirmModal,
    suspendUser,
    unSuspendUser,
    updateSuspensionReason,
    promoteUserToGlobalAdmin,
    demoteUserFromGlobalAdmin,
  } = useUser(userId);
  const { user: activeUser } = useAuth();
  const {
    shops,
    loading: shopsLoading,
    removeUserFromShop,
    opLoading,
    changeUserRole,
  } = useShops();
  const { logs, loading: logsLoading } = useUserLogs(userId);

  const { confirm, ConfirmModal } = useConfirm({
    title: "Are you sure you want to disconnect?",
    text:
      activeUser?.id === user?.id ? (
        "You are about to disconnect yourself from this shop. This will remove your access to this shop. In order to rejoin, you will need to be re-added by an admin."
      ) : (
        <>
          You are about to disconnect {user?.firstName} from this shop. This
          will remove their access to this shop. You will have to re-add them if
          they need access again. They will be able to re-join the shop
          automatically if they follow a billing group link.
        </>
      ),
  });

  const [editableFirstName, setEditableFirstName] = useState("");
  const [editableLastName, setEditableLastName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setEditableFirstName(user.firstName);
      setEditableLastName(user.lastName);
    }
  }, [user]);

  const handleSaveName = async () => {
    if (
      editableFirstName !== user.firstName ||
      editableLastName !== user.lastName
    ) {
      try {
        await updateUserName(editableFirstName, editableLastName);
        await refetch(true);
      } catch (error) {
        console.error("Error Saving Name:", error);
      }
    }
    setIsEditing(false);
  };

  const handleDiscardName = () => {
    setEditableFirstName(user.firstName);
    setEditableLastName(user.lastName);
    setIsEditing(false);
  };

  if (loading) return <Loading />;
  if (!user?.id) return <NotFound />;

  return (
    <Page sidenavItems={sidenavItems("Users", activeUser?.admin)}>
      {SuspendConfirmModal}
      {UnSuspendConfirmModal}
      {ConfirmModal}
      <Util.Row gap={2} align="center">
        <Avatar size="xl" dicebear initials={user.id} />
        <Util.Col>
          <Input
            value={editableFirstName}
            onChange={(e) => {
              setEditableFirstName(e);
              if (!isEditing) setIsEditing(true);
            }}
          ></Input>
          <Input
            value={editableLastName}
            onChange={(e) => {
              setEditableLastName(e);
              if (!isEditing) setIsEditing(true);
            }}
          ></Input>
          {isEditing && (
            <div>
              <Button onClick={handleSaveName}>Save</Button>
              <Button onClick={handleDiscardName}>Discard</Button>
            </div>
          )}
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
                Suspended
              </Badge>
            )}
          </Util.Row>
        </Util.Col>
        <Util.Col
          style={{
            flex: 1,
            alignItems: "flex-end",
          }}
          gap={1}
        >
          {activeUser.admin && (
            <>
              <Button
                onClick={async () => {
                  await refetch(true);
                }}
              >
                <Icon i="reload" size={18} /> Refetch User
              </Button>
              {!user.isMe &&
                (user.admin ? (
                  <Button
                    variant="danger"
                    outline
                    size="sm"
                    onClick={demoteUserFromGlobalAdmin}
                  >
                    <Icon i="user-down" size={12} /> Demote from global admin
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    outline
                    size="sm"
                    onClick={promoteUserToGlobalAdmin}
                  >
                    <Icon i="user-up" size={12} /> Promote to global admin
                  </Button>
                ))}
              {!user.isMe &&
                (user.suspended ? (
                  <Util.Row gap={0.5}>
                    <Button
                      variant="danger"
                      ghost
                      size="sm"
                      onClick={unSuspendUser}
                    >
                      <Icon i="pencil" size={12} /> Modify suspension reason
                    </Button>{" "}
                    <Button
                      variant="danger"
                      outline
                      size="sm"
                      onClick={unSuspendUser}
                    >
                      <Icon i="circle-dashed-check" size={12} /> Unsuspend user
                    </Button>
                  </Util.Row>
                ) : (
                  <Button
                    variant="danger"
                    outline
                    size="sm"
                    onClick={suspendUser}
                  >
                    <Icon i="ban" size={12} /> Suspend user
                  </Button>
                ))}
            </>
          )}
        </Util.Col>
      </Util.Row>
      {user.suspended && (
        <>
          <Util.Hr />
          <Alert
            variant="danger"
            title="This user is suspended"
            icon={<Icon i="ban" size={32} />}
          >
            This user is suspended. Reason: <i>{user.suspensionReason}</i>
            {activeUser.admin && (
              <>
                <Util.Spacer size={1} />
                <Button onClick={updateSuspensionReason}>
                  <Icon i="pencil" size={18} />
                  Update Suspension Reason
                </Button>{" "}
                <Button onClick={unSuspendUser} variant="danger" outline>
                  <Icon i="circle-dashed-check" size={18} />
                  Unsuspend User
                </Button>
              </>
            )}
          </Alert>
        </>
      )}
      <Util.Hr />
      <Util.Row
        gap={2}
        style={{
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: "50%" }}>
          <H2>Shops</H2>
          {activeUser.admin && (
            <AddUserToShop
              user={user}
              shops={shops}
              loading={shopsLoading}
              onFinish={() => refetch(false)}
            />
          )}
          <Util.Spacer size={1} />
          <Table
            columns={[
              {
                label: "Shop",
                accessor: "shop.name",
                render: (name, context) => (
                  <a href={`/shops/${context.shop.id}`}>{name}</a>
                ),
              },
              {
                label: "Role",
                accessor: "accountType",
                render: (accountType, context) =>
                  activeUser.admin ? (
                    opLoading ? (
                      <Spinner />
                    ) : (
                      <DropdownInput
                        value={{
                          id: accountType,
                        }}
                        values={[
                          { id: "CUSTOMER", label: "Customer" },
                          { id: "OPERATOR", label: "Operator" },
                          { id: "ADMIN", label: "Admin" },
                          { id: "GROUP_ADMIN", label: "Group Admin" },
                        ]}
                        onChange={async (value) => {
                          await changeUserRole(
                            user.id,
                            context.shop.id,
                            value.id
                          );
                          refetch(false);
                        }}
                      />
                    )
                  ) : (
                    accountType
                  ),
              },
              {
                label: "Date Joined",
                accessor: "createdAt",
                render: (createdAt) => moment(createdAt).format("MM/DD/YY"),
              },
              {
                label: "Disconnect",
                accessor: "id",
                render: (id, context) => (
                  <Button
                    data-context={JSON.stringify(context)}
                    variant="danger"
                    outline
                    onClick={async () => {
                      if (!(await confirm())) return;
                      await removeUserFromShop(user.id, context.shop.id);
                      refetch(false);
                    }}
                    loading={opLoading}
                  >
                    <Icon i="plug-connected-x" size={18} />
                  </Button>
                ),
              },
            ]}
            data={user.shops}
          />
        </div>
        <div style={{ width: "50%" }}>
          <H2>Logs</H2>
          {logsLoading ? (
            <Util.Col>
              <Loading message={"Compiling and downloading logs..."} />
            </Util.Col>
          ) : (
            <LogTimeline logs={logs} />
          )}
        </div>
      </Util.Row>
    </Page>
  );
};
