import React, { useEffect, useState } from "react";
import { Util, Typography, Switch, Card, Badge } from "tabler-react-2";
import { QuantityInput, TimeInput } from "./EditCosting";
import { Button } from "#button";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";
import { ResourcePicker } from "../resourcePicker/ResourcePicker";
import { MaterialPicker } from "../materialPicker/MaterialPicker";
import {
  useAdditionalLineItem,
  useAdditionalLineItems,
  useAuth,
  useMaterial,
  useResource,
  useShop,
} from "#hooks";
import { useParams } from "react-router-dom";
import { Spinner } from "#spinner";
import { Icon } from "#icon";
import { Price } from "#renderPrice";
const { H2, H3 } = Typography;
import styles from "./jobItem.module.css";

export const ProjectWideEditCosting = ({
  job: initialJob,
  loading,
  updateJob,
  refetchJob,
}) => {
  const [job, setJob] = useState(initialJob);
  const {
    createLineItem,
    lineItems,
    refetch: fetchLineItems,
    opLoading: createOpLoading,
  } = useAdditionalLineItems(initialJob.shopId, initialJob.id);
  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);
  const { user } = useAuth();
  const { userShop } = useShop(initialJob.shopId);

  const userIsPrivileged =
    user?.admin ||
    userShop?.accountType === "ADMIN" ||
    userShop?.accountType === "OPERATOR";

  return (
    <>
      <Util.Col gap={0.5}>
        <Util.Row align="center" justify="between">
          <H2>Project-wide costing</H2>
        </Util.Row>

        {userIsPrivileged && (
          <Switch
            label="Override or add to project-wide cost"
            value={job.additionalCostOverride}
            onChange={(value) => {
              // setJob({ ...job, additionalCostOverride: value });
              updateJob({
                additionalCostOverride: value,
              });
            }}
            loading={loading}
          />
        )}
        {userIsPrivileged ? (
          <p>
            {job.additionalCostOverride
              ? "You are overriding the item-based cost"
              : "You are adding to the item-based cost"}
          </p>
        ) : (
          <p>
            {job.additionalCostOverride
              ? "Additional costs override the item-based cost"
              : "Additional costs are in addition to the item-based cost"}
          </p>
        )}
        {lineItems?.length > 0 ? (
          <div>
            {lineItems.map((additionalCost) => (
              <>
                <CostCard
                  refetchJob={refetchJob}
                  lineItemId={additionalCost.id}
                  key={additionalCost.id}
                  refetchLineItems={fetchLineItems}
                  jobFinalized={job.finalized}
                  userIsPrivileged={userIsPrivileged}
                />
                <Util.Spacer size={1} />
              </>
            ))}
            {userIsPrivileged && (
              <Button onClick={createLineItem} loading={createOpLoading}>
                Add another additional cost
              </Button>
            )}
          </div>
        ) : (
          <Card>
            <p>There are no additional costs for this job.</p>
            {userIsPrivileged && (
              <Button onClick={createLineItem} loading={createOpLoading}>
                Add additional cost
              </Button>
            )}
          </Card>
        )}
      </Util.Col>
    </>
  );
};

const CostCard = ({
  lineItemId,
  refetchLineItems,
  jobFinalized,
  userIsPrivileged,
  refetchJob,
}) => {
  const { shopId, jobId } = useParams();
  const { lineItem, updateLineItem, deleteLineItem, opLoading, ConfirmModal } =
    useAdditionalLineItem(shopId, jobId, lineItemId, jobFinalized);
  const [localLineItem, setLocalLineItem] = useState(lineItem);

  const { loading: materialLoading, material } = useMaterial(
    shopId,
    localLineItem?.resourceTypeId,
    localLineItem?.materialId
  );

  const { loading: secondaryMaterialLoading, material: secondaryMaterial } =
    useMaterial(
      shopId,
      localLineItem?.resourceTypeId,
      localLineItem?.secondaryMaterialId
    );

  const { loading: resourceLoading, resource } = useResource(
    shopId,
    localLineItem?.resourceId
  );

  const changed = JSON.stringify(localLineItem) !== JSON.stringify(lineItem);

  useEffect(() => {
    setLocalLineItem(lineItem);
  }, [lineItem]);

  if (!localLineItem) return null;

  const calculateTotalCost = () => {
    const {
      timeQty,
      processingTimeQty,
      unitQty,
      materialQty,
      secondaryMaterialQty,
    } = localLineItem;
    return (
      (timeQty * resource?.costPerTime || 0) +
      (processingTimeQty * resource?.costPerProcessingTime || 0) +
      (unitQty * resource?.costPerUnit || 0) +
      (materialQty * material?.costPerUnit || 0) +
      (secondaryMaterialQty * secondaryMaterial?.costPerUnit || 0)
    );
  };

  const handleSave = async () => {
    await updateLineItem(localLineItem);
    refetchJob(false);
  };

  return (
    <Card key={localLineItem.id}>
      {ConfirmModal}
      <Util.Col gap={1}>
        <Util.Row gap={1} align="start">
          <Util.Col gap={1}>
            {userIsPrivileged ? (
              <ResourceTypePicker
                value={localLineItem.resourceTypeId}
                onChange={(value) =>
                  setLocalLineItem({
                    ...localLineItem,
                    resourceTypeId: value,
                    resourceId: null,
                    materialId: null,
                    secondaryMaterialId: null,
                  })
                }
                loading={opLoading}
              />
            ) : (
              <>
                <span className="form-label mb-0">Resource Type</span>
                <span>
                  <Badge soft>{localLineItem.resourceType?.title}</Badge>
                </span>
              </>
            )}
            {localLineItem.resourceTypeId ? (
              <Util.Row gap={1}>
                {userIsPrivileged ? (
                  <ResourcePicker
                    value={localLineItem.resourceId}
                    resourceTypeId={localLineItem.resourceTypeId}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, resourceId: value })
                    }
                    loading={opLoading}
                  />
                ) : (
                  <Util.Col gap={1}>
                    <span className="form-label mb-0">Resource</span>
                    <span>
                      <Badge soft>{localLineItem.resource?.title}</Badge>
                    </span>
                  </Util.Col>
                )}
                {userIsPrivileged ? (
                  <MaterialPicker
                    value={localLineItem.materialId}
                    resourceTypeId={localLineItem.resourceTypeId}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, materialId: value })
                    }
                    loading={opLoading}
                    materialType={"Primary"}
                  />
                ) : (
                  <Util.Col gap={1}>
                    <span className="form-label mb-0">Material</span>
                    <span>
                      <Badge soft>{localLineItem.material?.title}</Badge>
                    </span>
                  </Util.Col>
                )}
                {userIsPrivileged ? (
                  <MaterialPicker
                    value={localLineItem.secondaryMaterialId}
                    resourceTypeId={localLineItem.resourceTypeId}
                    onChange={(value) =>
                      setLocalLineItem({
                        ...localLineItem,
                        secondaryMaterialId: value,
                      })
                    }
                    loading={opLoading}
                    materialType={"Secondary"}
                  />
                ) : (
                  <Util.Col gap={1}>
                    <span className="form-label mb-0">secondaryMaterial</span>
                    <span>
                      <Badge soft>
                        {localLineItem.secondaryMaterial?.title}
                      </Badge>
                    </span>
                  </Util.Col>
                )}
              </Util.Row>
            ) : (
              <i style={{ alignSelf: "center" }}>
                Select a resource type to continue
              </i>
            )}
          </Util.Col>
          <div style={{ flex: 1 }} />
          {userIsPrivileged && (
            <Button
              color="danger"
              outline
              size="sm"
              onClick={() => deleteLineItem(refetchLineItems)}
              loading={opLoading}
            >
              <Icon i="trash" />
              Delete line item
            </Button>
          )}
        </Util.Row>
        <Util.Col gap={1}>
          <H3>Line Item Quantities</H3>
          {localLineItem.resourceTypeId &&
          localLineItem.resourceId &&
          localLineItem.materialId &&
          localLineItem.secondaryMaterialId ? (
            <>
              {materialLoading ||
              secondaryMaterialLoading ||
              resourceLoading ? (
                <Spinner />
              ) : !resource || !material || !secondaryMaterial ? (
                <span>
                  <Badge color="danger" soft>
                    <Icon i="coin-off" />
                    Costing unavailable1 without material, secondaryMaterial and
                    resource
                  </Badge>
                </span>
              ) : (
                <Util.Col gap={0}>
                  <TimeInput
                    label="Resource Time (hr:mm)"
                    timeQty={localLineItem.timeQty || 0}
                    costPerTime={resource.costPerTime || 0}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, timeQty: value })
                    }
                    showInput={userIsPrivileged}
                  />
                  <TimeInput
                    label="Processing Time (hr:mm)"
                    timeQty={localLineItem.processingTimeQty || 0}
                    costPerTime={resource.costPerProcessingTime || 0}
                    onChange={(value) =>
                      setLocalLineItem({
                        ...localLineItem,
                        processingTimeQty: value,
                      })
                    }
                    showInput={userIsPrivileged}
                  />
                  <QuantityInput
                    label="Unit runs"
                    quantity={localLineItem.unitQty || 0}
                    costPerUnit={resource.costPerUnit || 0}
                    icon={<Icon i="refresh" />}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, unitQty: value })
                    }
                    showInput={userIsPrivileged}
                  />
                  <QuantityInput
                    label={`Material quantity in ${material.unitDescriptor}s`}
                    quantity={localLineItem.materialQty || 0}
                    costPerUnit={material.costPerUnit || 0}
                    icon={<Icon i="weight" />}
                    onChange={(value) =>
                      setLocalLineItem({ ...localLineItem, materialQty: value })
                    }
                    showInput={userIsPrivileged}
                  />
                  <QuantityInput
                    label={`Secondary material quantity in ${secondaryMaterial.unitDescriptor}s`}
                    quantity={localLineItem.secondaryMaterialQty || 0}
                    costPerUnit={secondaryMaterial.costPerUnit || 0}
                    icon={<Icon i="weight" />}
                    onChange={(value) =>
                      setLocalLineItem({
                        ...localLineItem,
                        secondaryMaterialQty: value,
                      })
                    }
                    showInput={userIsPrivileged}
                  />
                  <Util.Row gap={1} align="center" justify="end">
                    <span className={styles.bottomLine}>
                      <Util.Row gap={1}>
                        Total:
                        <Price value={calculateTotalCost()} icon />
                      </Util.Row>
                    </span>
                  </Util.Row>
                </Util.Col>
              )}
            </>
          ) : (
            <span>
              <Badge color="danger" soft>
                <Icon i="coin-off" />
                Costing unavailable2 without material, secondaryMaterial and
                resource
              </Badge>
            </span>
          )}
          {changed ? (
            <Util.Row gap={1} align="center">
              <Button onClick={handleSave} loading={opLoading}>
                Save
              </Button>
              <Button onClick={() => setLocalLineItem(lineItem)}>
                Discard
              </Button>
              <Badge color="red" soft>
                You have unsaved changes!
              </Badge>
            </Util.Row>
          ) : (
            <div></div>
          )}
        </Util.Col>
      </Util.Col>
    </Card>
  );
};
