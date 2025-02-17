import React, { useEffect, useState } from "react";
import { Page } from "../../../../../components/page/page";
import { Icon } from "../../../../../util/Icon";
import { Link, useParams } from "react-router-dom";
import { Typography, Util, Input, Card } from "tabler-react-2";
import { useJob } from "../../../../../hooks/useJob";
import { Loading } from "../../../../../components/loading/Loading";
import { UploadDropzone } from "../../../../../components/upload/uploader";
import {
  JobItem,
  switchStatusToUI,
} from "../../../../../components/jobitem/JobItem";
import { Button } from "tabler-react-2/dist/button";
const { H1, H2, H3 } = Typography;
import moment from "moment";
import Badge from "tabler-react-2/dist/badge";
import { NotFound } from "../../../../../components/404/404";
import { LoadableDropdownInput } from "../../../../../components/loadableDropdown/LoadableDropdown";
import { useAuth, useShop } from "../../../../../hooks";
import { ResourceTypePicker } from "../../../../../components/resourceTypePicker/ResourceTypePicker";
import { MaterialPicker } from "../../../../../components/materialPicker/MaterialPicker";
import { ResourcePicker } from "../../../../../components/resourcePicker/ResourcePicker";
import { Comments } from "../../../../../components/comments/Comments";
import { Alert } from "tabler-react-2/dist/alert";

export const sidenavItems = (activePage, shopId, jobId) => [
  {
    type: "item",
    href: `/shops/${shopId}/jobs`,
    text: `Back to jobs`,
    active: false,
    icon: <Icon i={"arrow-left"} size={18} />,
  },
  {
    type: "item",
    href: `/shops/${shopId}/jobs/${jobId}`,
    text: `Home`,
    active: activePage === "jobs",
    icon: <Icon i={"robot"} size={18} />,
  },
  {
    type: "item",
    href: `/shops/${shopId}/jobs/${jobId}/costing`,
    text: `Costing`,
    active: activePage === "costing",
    icon: <Icon i={"currency-dollar"} size={18} />,
  },
];

export const JobPage = () => {
  const { shopId, jobId } = useParams();
  const {
    job: uncontrolledJob,
    loading,
    refetch: refetchJobs,
    opLoading,
    updateJob,
    ConfirmModal,
  } = useJob(shopId, jobId);
  const { user, loading: userLoading } = useAuth();
  const { userShop, loading: shopLoading } = useShop(shopId);

  const [editing, setEditing] = useState(false);
  const [job, setJob] = useState(uncontrolledJob);

  useEffect(() => {
    setJob(uncontrolledJob);
  }, [uncontrolledJob]);

  const userIsPrivileged =
    user.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR";

  if (loading || userLoading || shopLoading) return <Loading />;

  if (!job)
    return (
      <Page sidenavItems={sidenavItems("jobs", shopId, jobId)}>
        <NotFound />
      </Page>
    );

  return (
    <Page sidenavItems={sidenavItems("jobs", shopId, jobId)}>
      {ConfirmModal}
      {job.finalized && (
        <Alert
          variant="danger"
          title="Job finalized"
          icon={<Icon i="alert-triangle" />}
        >
          This job has already been finalized. You can still update it, but you
          cannot re-charge the customer.
        </Alert>
      )}
      <Util.Responsive gap={1} align="start" threshold={800}>
        <div style={{ flex: 1, width: "100%" }}>
          <Util.Row justify="between" align="center" gap={1} wrap>
            {editing ? (
              <Input
                value={job.title}
                label="Title"
                onChange={(e) => setJob({ ...job, title: e })}
              />
            ) : (
              <H1>{job.title}</H1>
            )}
            {editing ? (
              <Button
                loading={opLoading}
                onClick={async () => {
                  await updateJob(job);
                  setEditing(false);
                }}
                variant="primary"
              >
                Save
              </Button>
            ) : (
              <Button loading={opLoading} onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </Util.Row>
          {editing ? (
            <>
              <Input
                value={job.description}
                label="Description"
                onChange={(e) => setJob({ ...job, description: e })}
              />
              <Input
                type="date"
                value={job.dueDate.split("T")[0]}
                label="Due Date"
                onChange={(e) =>
                  setJob({
                    ...job,
                    dueDate: new Date(e + "T00:00:00").toISOString(),
                  })
                }
              />
            </>
          ) : (
            <>
              <p>{job.description}</p>
              <Util.Row gap={2} align="start">
                <div>
                  <H3>Status</H3>
                  {userIsPrivileged ? (
                    <LoadableDropdownInput
                      loading={opLoading}
                      prompt={"Select a status"}
                      values={[
                        { id: "IN_PROGRESS", label: "In Progress" },
                        { id: "COMPLETED", label: "Completed" },
                        { id: "NOT_STARTED", label: "Not Started" },
                        { id: "CANCELLED", label: "Cancelled" },
                        { id: "WONT_DO", label: "Won't Do" },
                        { id: "WAITING", label: "Waiting" },
                        {
                          id: "WAITING_FOR_PICKUP",
                          label: "Waiting for Pickup",
                        },
                        {
                          id: "WAITING_FOR_PAYMENT",
                          label: "Waiting for Payment",
                        },
                      ]}
                      value={job.status}
                      onChange={(value) => {
                        updateJob({ status: value.id });
                      }}
                      doTheColorThing={true}
                    />
                  ) : (
                    <Badge color={switchStatusToUI(job.status)[1]} soft>
                      {switchStatusToUI(job.status)[0]}
                    </Badge>
                  )}
                </div>
                <div>
                  <H3>Upcoming Deadline</H3>
                  <p>
                    {moment(job.dueDate).format("MM/DD/YY")} (
                    {moment(job.dueDate).fromNow()}) {/* Overdue warning */}
                    {new Date(job.dueDate) < new Date() &&
                      !(
                        new Date(job.dueDate).toDateString() ===
                        new Date().toDateString()
                      ) && <Badge color="red">Overdue</Badge>}
                    {/* Today warning */}{" "}
                    {new Date(job.dueDate).toDateString() ===
                      new Date().toDateString() && (
                      <Badge color="yellow">Due Today</Badge>
                    )}
                  </p>
                </div>
              </Util.Row>
              <Util.Spacer size={2} />
              <H3>Project Defaults</H3>
              <Util.Row gap={1} wrap>
                <ResourceTypePicker
                  loading={opLoading}
                  value={job.resourceTypeId}
                  onChange={(value) => {
                    updateJob({ resourceTypeId: value });
                  }}
                  shopId={shopId}
                  opLoading={opLoading}
                  includeNone={true}
                />
                {job.resourceTypeId ? (
                  <>
                    <MaterialPicker
                      value={job.materialId}
                      onChange={(value) => {
                        updateJob({ materialId: value });
                      }}
                      resourceTypeId={job.resourceTypeId}
                      opLoading={opLoading}
                      includeNone={true}
                      materialType={"Primary"}
                    />
                    <MaterialPicker
                      value={job.secondaryMaterialId}
                      onChange={(value) => {
                        updateJob({ secondaryMaterialId: value });
                      }}
                      resourceTypeId={job.resourceTypeId}
                      opLoading={opLoading}
                      includeNone={true}
                      materialType={"Secondary"}
                    />
                    {userIsPrivileged ? (
                      <ResourcePicker
                        value={job.resourceId}
                        onChange={(value) => {
                          updateJob({ resourceId: value });
                        }}
                        resourceTypeId={job.resourceTypeId}
                        opLoading={opLoading}
                        includeNone={true}
                      />
                    ) : (
                      <Util.Col>
                        <label className="form-label">Resource</label>
                        <Badge color="blue" soft>
                          {job.resource?.title || "Not set"}
                        </Badge>
                      </Util.Col>
                    )}
                  </>
                ) : (
                  <i
                    style={{
                      alignSelf: "center",
                    }}
                  >
                    Select a resource type to see more options
                  </i>
                )}
              </Util.Row>
              {job.group && (
                <>
                  <Util.Spacer size={2} />
                  <H3>Group</H3>
                  <p>
                    <b>Group Title</b>{" "}
                    <Link
                      to={`/shops/${shopId}/billing-groups/${job.group.id}`}
                    >
                      {job.group.title}
                    </Link>
                    <br />
                    <b>Group Admin</b> {job.group.users[0].user.firstName}{" "}
                    {job.group.users[0].user.lastName}
                  </p>
                </>
              )}
            </>
          )}
        </div>
        <div style={{ flex: 1, width: "100%" }}>
          <Card
            tabs={[
              {
                title: "Upload items",
                content: (
                  <UploadDropzone
                    scope={"job.fileupload"}
                    metadata={{
                      jobId,
                      shopId,
                    }}
                    onUploadComplete={() => {
                      refetchJobs(false);
                    }}
                  />
                ),
              },
              {
                title: "Comments",
                content: <Comments jobId={jobId} shopId={shopId} />,
              },
            ]}
          />
        </div>
      </Util.Responsive>
      <Util.Spacer size={1} />
      <H2>Items</H2>
      {job.items?.length === 0 ? (
        <i>This job has no items. You can attach files in the dropzone above</i>
      ) : (
        <Util.Col gap={0.5}>
          {job.items?.map((item) => (
            <JobItem
              key={item.id}
              item={item}
              refetchJobs={refetchJobs}
              userIsPrivileged={userIsPrivileged}
              group={job.group}
            />
          ))}
        </Util.Col>
      )}
    </Page>
  );
};
