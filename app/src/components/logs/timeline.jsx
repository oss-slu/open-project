import React, { useEffect, useState } from "react";
import { Timeline, Badge } from "tabler-react-2";
import { Icon } from "#icon";
import moment from "moment";
import { Util } from "tabler-react-2";
import { Link } from "react-router-dom";
import { ObjectDiffViewer } from "../objectDiffViewer/ObjectDiffViewer";

const IconUserCreated = ({ size = 18 }) => <Icon i={"user-plus"} size={size} />;
const IconUserLogin = ({ size = 18 }) => <Icon i={"login-2"} size={size} />;
const IconUnhandled = ({ size = 18 }) => (
  <Icon i={"alert-triangle"} size={size} />
);
const IconShopCreated = ({ size = 18 }) => (
  <Icon i={"building-store"} size={size} />
);
const IconUserConnectedToShop = ({ size = 18 }) => (
  <Icon i={"plug-connected"} size={size} />
);
const IconUserDisconnectedFromShop = ({ size = 18 }) => (
  <Icon i={"plug-connected-x"} size={size} />
);
const IconUserShopRoleChanged = ({ size = 18 }) => (
  <Icon i={"mobiledata"} size={size} />
);
const IconUserPromotedToAdmin = ({ size = 18 }) => (
  <Icon i={"user-up"} size={size} />
);
const IconUserDemotedFromAdmin = ({ size = 18 }) => (
  <Icon i={"user-down"} size={size} />
);
const IconUserSuspensionApplied = ({ size = 18 }) => (
  <Icon i={"ban"} size={size} />
);
const IconUserSuspensionRemoved = ({ size = 18 }) => (
  <Icon i={"circle-dashed-check"} size={size} />
);
const IconUserSuspensionChanged = ({ size = 18 }) => (
  <Icon i={"pencil"} size={size} />
);
const IconResourceCreated = ({ size = 18 }) => (
  <Icon i={"brand-databricks"} size={size} secondaryIcon={"plus"} />
);
const IconResourceModified = ({ size = 18 }) => (
  <Icon i={"brand-databricks"} size={size} secondaryIcon={"pencil"} />
);
const IconResourceDeleted = ({ size = 18 }) => (
  <Icon i={"brand-databricks"} size={size} secondaryIcon={"x"} />
);
const IconJobCreated = ({ size = 18 }) => (
  <Icon i={"list-details"} size={size} secondaryIcon={"plus"} />
);
const IconJobModified = ({ size = 18 }) => (
  <Icon i={"list-details"} size={size} secondaryIcon={"pencil"} />
);
const IconJobItemCreated = ({ size = 18 }) => (
  <Icon i={"copy"} size={size} secondaryIcon={"plus"} />
);
const IconJobItemModified = ({ size = 18 }) => (
  <Icon i={"copy"} size={size} secondaryIcon={"pencil"} />
);
const IconJobItemDeleted = ({ size = 18 }) => (
  <Icon i={"copy"} size={size} secondaryIcon={"x"} />
);
const IconMaterialCreated = ({ size = 18 }) => (
  <Icon i={"sandbox"} size={size} secondaryIcon={"plus"} />
);
const IconMaterialModified = ({ size = 18 }) => (
  <Icon i={"sandbox"} size={size} secondaryIcon={"pencil"} />
);
const IconMaterialDeleted = ({ size = 18 }) => (
  <Icon i={"sandbox"} size={size} secondaryIcon={"x"} />
);
const IconMaterialMSDSUploaded = ({ size = 18 }) => (
  <Icon i={"clipboard-heart"} size={size} />
);
const IconMaterialTDSUploaded = ({ size = 18 }) => (
  <Icon i={"clipboard-data"} size={size} />
);
const IconMaterialImageCreated = ({ size = 18 }) => (
  <Icon i={"photo"} size={size} secondaryIcon={"plus"} />
);
const IconMaterialImageDeleted = ({ size = 18 }) => (
  <Icon i={"photo"} size={size} secondaryIcon={"x"} />
);
const IconResourceTypeCreated = ({ size = 18 }) => (
  <Icon i={"bucket"} size={size} secondaryIcon={"plus"} />
);
const IconResourceTypeModified = ({ size = 18 }) => (
  <Icon i={"bucket"} size={size} secondaryIcon={"pencil"} />
);
const IconResourceImageCreated = ({ size = 18 }) => (
  <Icon i={"photo"} size={size} secondaryIcon={"plus"} />
);
const IconResourceImageDeleted = ({ size = 18 }) => (
  <Icon i={"photo"} size={size} secondaryIcon={"x"} />
);

const switchLogForContent = (log) => {
  switch (log.type) {
    case "USER_CREATED":
      return {
        icon: IconUserCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "User Created",
        description: `User ${log.user.firstName} ${log.user.lastName} was created.`,
      };
    case "USER_LOGIN":
      return {
        icon: IconUserLogin,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "User Login",
        description: `User ${log.user.firstName} ${log.user.lastName} logged in.`,
      };
    case "SHOP_CREATED":
      return {
        icon: IconShopCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: "Shop Created",
        description: `Shop ${log.shop?.name || ""} was created.`,
      };
    case "USER_CONNECTED_TO_SHOP":
      return {
        icon: IconUserConnectedToShop,
        iconBgColor: "teal",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Connected to Shop`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } was connected to shop ${log.shop?.name} as a ${
          log.to ? JSON.parse(log.to)?.accountType?.toLowerCase() : "..."
        }.`,
      };
    case "USER_DISCONNECTED_FROM_SHOP":
      return {
        icon: IconUserDisconnectedFromShop,
        iconBgColor: "pink",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Disconnected from Shop`,
        description: `User ${log.user.firstName} ${log.user.lastName} was disconnected from shop ${log.shop?.name}.`,
      };
    case "USER_SHOP_ROLE_CHANGED":
      return {
        icon: IconUserShopRoleChanged,
        iconBgColor: "purple",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Shop Role Changed`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } role was changed to ${
          log.to ? JSON.parse(log.to).accountType : "..."
        }.`,
      };
    case "USER_PROMOTED_TO_ADMIN":
      return {
        icon: IconUserPromotedToAdmin,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Promoted to Admin`,
        description: `User ${log.user.firstName} ${log.user.lastName} was promoted to admin.`,
      };
    case "USER_DEMOTED_FROM_ADMIN":
      return {
        icon: IconUserDemotedFromAdmin,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Demoted from Admin`,
        description: `User ${log.user.firstName} ${log.user.lastName} was demoted from admin.`,
      };
    case "USER_SUSPENSION_APPLIED":
      return {
        icon: IconUserSuspensionApplied,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Applied`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        } was suspended with reason "${JSON.parse(log.to || "{}")?.reason}".`,
      };
    case "USER_SUSPENSION_REMOVED":
      return {
        icon: IconUserSuspensionRemoved,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Removed`,
        description: `User ${log.user.firstName} ${log.user.lastName} was unsuspended.`,
      };
    case "USER_SUSPENSION_CHANGED":
      return {
        icon: IconUserSuspensionChanged,
        iconBgColor: "yellow",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `User Suspension Changed`,
        description: `User ${log.user.firstName} ${
          log.user.lastName
        }'s suspension was changed from "${
          JSON.parse(log.to || "{}")?.reason
        }" to "${JSON.parse(log.to || "{}")?.reason}".`,
      };
    case "RESOURCE_CREATED":
      return {
        icon: IconResourceCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Created`,
        description: (
          <>
            <span>
              {log.resource?.active ? (
                <Link to={`/shops/${log.shopId}/resources/${log.resourceId}`}>
                  {log.resource?.title}
                </Link>
              ) : (
                log.resource?.title
              )}{" "}
              was created.
            </span>
          </>
        ),
      };
    case "RESOURCE_MODIFIED":
      return {
        icon: IconResourceModified,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Modified`,
        // description: JSON.stringify(log),
        description: (
          <>
            <span>
              Resource{" "}
              {log.resource?.active ? (
                <Link to={`/shops/${log.shopId}/resources/${log.resourceId}`}>
                  {log.resource?.title}
                </Link>
              ) : (
                log.resource?.title
              )}{" "}
              was modified.
            </span>

            <ObjectDiffViewer from={log.from} to={log.to} />
          </>
        ),
      };
    case "RESOURCE_DELETED":
      return {
        icon: IconResourceDeleted,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Deleted`,
        description: (
          <>
            <span>
              Resource <u>{log.resource?.title}</u> was deleted.
            </span>
          </>
        ),
      };
    case "RESOURCE_IMAGE_CREATED":
      return {
        icon: IconResourceImageCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Image Created`,
        description: (
          <Util.Row gap={1} justify="between" align="start">
            <span>
              {log.resourceImage?.active ? (
                <Link to={log.resourceImage?.fileUrl} target="_BLANK">
                  Image
                </Link>
              ) : (
                "Image"
              )}{" "}
              for Resource{" "}
              {log.resource?.active ? (
                <Link to={`/shops/${log.shopId}/resources/${log.resourceId}`}>
                  {log.resource?.title}
                </Link>
              ) : (
                log.resource?.title
              )}{" "}
              was created.
              {!log.resourceImage?.active && " It has since been deleted."}
            </span>
            {log.resourceImage?.active && (
              <img
                src={log.resourceImage?.fileUrl}
                alt={log.resource?.title}
                style={{ maxHeight: 75, maxWidth: 75 }}
              />
            )}
          </Util.Row>
        ),
      };
    case "RESOURCE_IMAGE_DELETED":
      return {
        icon: IconResourceImageDeleted,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Image Deleted`,
        description: (
          <>
            <span>
              Image for Resource <u>{log.resource?.title}</u> was deleted.
            </span>
          </>
        ),
      };
    case "JOB_CREATED":
      return {
        icon: IconJobCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Job Created`,
        description: (
          <>
            <span>
              Job{" "}
              <Link to={`/shops/${log.shopId}/jobs/${log.jobId}`}>
                {log.job?.title}
              </Link>{" "}
              was created.
            </span>
          </>
        ),
      };
    case "JOB_MODIFIED":
      return {
        icon: IconJobModified,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Job Modified`,
        description: (
          <>
            <span>
              Job{" "}
              <Link to={`/shops/${log.shopId}/jobs/${log.jobId}`}>
                {log.job?.title}
              </Link>{" "}
              was modified.
            </span>
            <ObjectDiffViewer from={log.from} to={log.to} />
          </>
        ),
      };
    case "JOB_ITEM_CREATED":
      return {
        icon: IconJobItemCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Job Item Created`,
        description: (
          <>
            <span>
              Job{" "}
              <Link to={`/shops/${log.shopId}/jobs/${log.jobId}`}>
                {log.job?.title}
              </Link>{" "}
              Item{" "}
              {log.jobItem?.active ? (
                <Link
                  to={`/shops/${log.shopId}/jobs/${log.jobId}#${log.jobItemId}`}
                >
                  {log.jobItem?.title}
                </Link>
              ) : (
                log.jobItem?.title
              )}{" "}
              was created.
            </span>
          </>
        ),
      };
    case "JOB_ITEM_MODIFIED":
      return {
        icon: IconJobItemModified,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Job Item Modified`,
        description: (
          <>
            <span>
              Job{" "}
              <Link to={`/shops/${log.shopId}/jobs/${log.jobId}`}>
                {log.job?.title}
              </Link>{" "}
              Item{" "}
              {log.jobItem?.active ? (
                <Link
                  to={`/shops/${log.shopId}/jobs/${log.jobId}#${log.jobItemId}`}
                >
                  {log.jobItem?.title}
                </Link>
              ) : (
                log.jobItem?.title
              )}{" "}
              was modified.
            </span>
            <ObjectDiffViewer from={log.from} to={log.to} />
          </>
        ),
      };
    case "JOB_ITEM_DELETED":
      return {
        icon: IconJobItemDeleted,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Job Item Deleted`,
        description: (
          <>
            <span>
              Job{" "}
              <Link to={`/shops/${log.shopId}/jobs/${log.jobId}`}>
                {log.job?.title}
              </Link>{" "}
              Item <u>{log.jobItem?.title}</u> was deleted.
            </span>
          </>
        ),
      };
    case "MATERIAL_CREATED":
      return {
        icon: IconMaterialCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material Created`,
        description: (
          <>
            <span>
              Material{" "}
              {log.material?.active ? (
                <Link
                  to={`/shops/${log.shopId}/resources/type/${log.material.resourceType.id}/materials/${log.materialId}`}
                >
                  {log.material?.title}
                </Link>
              ) : (
                log.material?.title
              )}{" "}
              was created.
            </span>
          </>
        ),
      };
    case "MATERIAL_MODIFIED":
      return {
        icon: IconMaterialModified,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material Modified`,
        description: (
          <>
            <span>
              Material{" "}
              {log.material?.active ? (
                <Link
                  to={`/shops/${log.shopId}/resources/type/${log.material.resourceType.id}/materials/${log.materialId}`}
                >
                  {log.material?.title}
                </Link>
              ) : (
                log.material?.title
              )}{" "}
              was modified.
            </span>
            <ObjectDiffViewer from={log.from} to={log.to} />
          </>
        ),
      };
    case "MATERIAL_MSDS_UPLOADED":
      return {
        icon: IconMaterialMSDSUploaded,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material MSDS Uploaded`,
        description: (
          <>
            <span>
              Material{" "}
              {log.material?.active ? (
                <Link
                  to={`/shops/${log.shopId}/resources/type/${log.material.resourceType.id}/materials/${log.materialId}`}
                >
                  {log.material?.title}
                </Link>
              ) : (
                log.material?.title
              )}{" "}
              MSDS was uploaded.
            </span>
          </>
        ),
      };
    case "MATERIAL_TDS_UPLOADED":
      return {
        icon: IconMaterialTDSUploaded,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material TDS Uploaded`,
        description: (
          <>
            <span>
              Material{" "}
              {log.material?.active ? (
                <Link
                  to={`/shops/${log.shopId}/resources/type/${log.material.resourceType.id}/materials/${log.materialId}`}
                >
                  {log.material?.title}
                </Link>
              ) : (
                log.material?.title
              )}{" "}
              TDS was uploaded.
            </span>
          </>
        ),
      };
    case "MATERIAL_DELETED":
      return {
        icon: IconMaterialDeleted,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material Deleted`,
        description: (
          <>
            <span>
              Material <u>{log.material?.title}</u> was deleted.
            </span>
          </>
        ),
      };
    case "MATERIAL_IMAGE_CREATED":
      return {
        icon: IconMaterialImageCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material Image Created`,
        description: (
          <Util.Row gap={1} justify="between" align="start">
            <span>
              {log.materialImage?.active ? (
                <Link to={log.materialImage?.fileUrl} target="_BLANK">
                  Image
                </Link>
              ) : (
                "Image"
              )}{" "}
              for Material{" "}
              {log.material?.active ? (
                <Link
                  to={`/shops/${log.shopId}/resources/type/${log.material.resourceType.id}/materials/${log.materialId}`}
                >
                  {log.material?.title}
                </Link>
              ) : (
                log.material?.title
              )}{" "}
              was created.
              {!log.materialImage?.active && " It has since been deleted."}
            </span>
            {log.materialImage?.active && (
              <img
                src={log.materialImage?.fileUrl}
                alt={log.material?.title}
                style={{ maxHeight: 75, maxWidth: 75 }}
              />
            )}
          </Util.Row>
        ),
      };
    case "MATERIAL_IMAGE_DELETED":
      return {
        icon: IconMaterialImageDeleted,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Material Image Deleted`,
        description: (
          <>
            <span>
              Image for Material <u>{log.material?.title}</u> was deleted.
            </span>
          </>
        ),
      };
    case "RESOURCE_TYPE_CREATED":
      return {
        icon: IconResourceTypeCreated,
        iconBgColor: "green",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Type Created`,
        description: `Resource Type ${log.resourceType?.title} was created.`,
      };
    case "RESOURCE_TYPE_MODIFIED":
      return {
        icon: IconResourceTypeModified,
        iconBgColor: "blue",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Resource Type Modified`,
        description: (
          <>
            <span>Resource Type {log.resourceType?.title} was modified.</span>
            <ObjectDiffViewer from={log.from} to={log.to} />
          </>
        ),
      };

    default: {
      return {
        icon: IconUnhandled,
        iconBgColor: "red",
        time: moment(log.createdAt).format("MM/DD/YY h:mm:ss a"),
        title: `Unhandled ${log.type}`,
        description: JSON.stringify(log),
      };
    }
  }
};

const extractLogTypes = (logs) => {
  const types = new Set();
  logs.forEach((log) => types.add(log.type));
  return Array.from(types);
};

export const LogTimeline = ({ logs }) => {
  const [logTypes, setLogTypes] = useState(extractLogTypes(logs));

  useEffect(() => {
    setLogTypes(extractLogTypes(logs));
  }, [logs]);

  const [activeLogTypes, setActiveLogTypes] = useState(new Set([]));

  const toggleLogType = (type) => {
    setActiveLogTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter((log) => activeLogTypes.has(log.type));

  return (
    <div>
      <label className={"text-secondary"}>Filter by log types</label>
      <Util.Row gap={1} wrap>
        {logTypes.map((type) => {
          const logContent = switchLogForContent({
            type,
            createdAt: new Date(),
            user: { firstName: "None", lastName: "None" },
          });

          return (
            <Badge
              key={type}
              color={logContent.iconBgColor}
              soft
              outline={activeLogTypes.has(type)}
              onClick={() => toggleLogType(type)}
              style={{ cursor: "pointer" }}
            >
              {logContent.icon({ size: 12 })} {logContent.title}
            </Badge>
          );
        })}
      </Util.Row>
      <Util.Spacer size={2} />
      {filteredLogs.length === 0 && (
        <i>No logs to display. Try modifying the filters above.</i>
      )}
      <Timeline
        events={filteredLogs.map((log) => ({
          ...switchLogForContent(log),
        }))}
      />
    </div>
  );
};
