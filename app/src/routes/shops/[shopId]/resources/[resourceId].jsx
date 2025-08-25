import React, { useEffect, useState } from "react";
import { Page } from "#page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useAuth, useResource, useShop } from "#hooks";
import { Loading } from "#loading";
import {
  Typography,
  Util,
  Button,
  Input,
  Switch,
  DropdownInput,
  Badge,
} from "tabler-react-2";
import { Gallery } from "../../../../components/gallery/gallery";
import { UploadDropzone } from "../../../../components/upload/uploader";
import { Icon } from "#icon";
const { H1, H2, H3, Text, B } = Typography;
import "@mdxeditor/editor/style.css";
import { MarkdownEditor } from "#markdownEditor";
import { MarkdownRender } from "#markdownRender";
import { Alert } from "#alert";
import { Table } from "#table";
import { useModal } from "#modal";
import { NotFound } from "#notFound";
import { ResourceTypePicker } from "../../../../components/resourceTypePicker/ResourceTypePicker";

export const ResourcePage = () => {
  const { shopId, resourceId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const {
    resource,
    loading,
    refetch,
    opLoading,
    updateResource,
    deleteResourceImage,
    deleteResource,
  } = useResource(shopId, resourceId);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);

  if (loading) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Resources",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );
  }

  const HereUploadDropzone = ({ height = "100%", onComplete = refetch }) => (
    <UploadDropzone
      metadata={{
        shopId,
        resourceId,
      }}
      dropzoneAppearance={{
        container: {
          height,
          padding: 10,
        },
        uploadIcon: {
          display: "none",
        },
      }}
      onUploadComplete={onComplete}
      endpoint={`/api/shop/${shopId}/resources/resource/${resourceId}/images/upload`}
      useNewDropzone={true}
    />
  );

  if (!resource) {
    return <NotFound />;
  }

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Resources",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <Util.Responsive threshold={800} justify="between">
        <H1>{resource.title}</H1>
        {user.admin || userShop.accountType === "ADMIN" ? (
          <Util.Row gap={1} justify="start">
            {!isEditingImages && !isEditing && (
              <Button outline onClick={() => setIsEditingImages(true)}>
                <Icon i="photo" /> Edit Gallery
              </Button>
            )}
            {!isEditing && !isEditingImages && (
              <Button outline onClick={() => setIsEditing(true)}>
                <Icon i="pencil" /> Edit
              </Button>
            )}
            <Button variant="danger" outline onClick={deleteResource}>
              <Icon i="trash" /> Delete
            </Button>
          </Util.Row>
        ) : null}
      </Util.Responsive>
      <Util.Hr />
      {/* <Util.Row gap={1} style={{ alignItems: "flex-start" }}> */}
      <Util.Responsive threshold={800} gap={2}>
        <div style={{ flex: 1 }}>
          <H2>Resource Information</H2>
          <B>Primary Category</B>{" "}
          {resource.primaryCategory && resource.primaryCategory !== "" ? (
            <Badge color="teal">{resource.primaryCategory}</Badge>
          ) : (
            <i>No primary category</i>
          )}
          <Util.Spacer size={1} />
          <B>Secondary Category</B>{" "}
          {resource.secondaryCategory && resource.secondaryCategory !== "" ? (
            <Badge color="teal">{resource.secondaryCategory}</Badge>
          ) : (
            <i>No secondary category</i>
          )}
          {resource.quantityPublic && (
            <>
              <Util.Spacer size={1} />
              <B>Quantity</B>{" "}
              {resource.quantity ? (
                <Badge color="teal">{resource.quantity}</Badge>
              ) : (
                <i>No quantity</i>
              )}
            </>
          )}
        </div>
        <div
          // style={{ width: "50%" }}
          // className="hos-900"
          style={{ flex: 1 }}
        >
          <H3>Gallery</H3>
          <div
            style={{
              width: "100%",
              height: 200,
            }}
          >
            {resource.images.length > 0 ? (
              <div
                style={{
                  border: "1px solid #e5e5e5",
                }}
              >
                <Gallery images={resource.images} height={200} />
              </div>
            ) : user.admin || userShop.accountType === "ADMIN" ? (
              <HereUploadDropzone onComplete={refetch} />
            ) : (
              <i>No images found</i>
            )}
          </div>
        </div>
      </Util.Responsive>
      {/* </Util.Row> */}
      <Util.Hr />
      {(user.admin || userShop.accountType === "ADMIN") && isEditing ? (
        <Edit
          resource={resource}
          opLoading={opLoading}
          updateResource={updateResource}
          setIsEditing={setIsEditing}
          refetch={refetch}
        />
      ) : isEditingImages ? (
        <EditGallery
          resource={resource}
          stopEditing={() => setIsEditingImages(false)}
          HereUploadDropzone={HereUploadDropzone}
          deleteResourceImage={deleteResourceImage}
          opLoading={opLoading}
          refetch={refetch}
        />
      ) : (
        <>
          <MarkdownRender markdown={resource.description} />
        </>
      )}
    </Page>
  );
};

const objectsAreEqual = (o1, o2) => {
  return JSON.stringify(o1) === JSON.stringify(o2);
};

const Edit = ({ resource, opLoading, updateResource, setIsEditing }) => {
  const [cr, setCr] = useState(resource);

  useEffect(() => {
    setCr(resource);
  }, [resource]);

  const [changed, setChanged] = useState(false);
  useEffect(() => {
    setChanged(!objectsAreEqual(cr, resource));
  }, [cr, resource]);

  const { modal, ModalElement } = useModal({
    title: "Help",
    text: "",
  });

  const Help = ({ text }) => (
    <a
      onClick={() =>
        modal({
          text,
        })
      }
      style={{ cursor: "pointer" }}
    >
      <Icon i="help-circle" color="blue" />
    </a>
  );

  return (
    <div>
      {ModalElement}
      <Util.Row gap={2} style={{ justifyContent: "space-between" }}>
        <H2>Edit</H2>
        {changed && <i className="text-red">You have unsaved changes.</i>}
        <Button
          loading={opLoading}
          disabled={opLoading}
          variant={"primary"}
          onClick={async () => {
            await updateResource(cr);
            setIsEditing(false);
          }}
        >
          Save & Close edit mode
        </Button>
      </Util.Row>
      <H3>Visibility configuration</H3>
      <p>
        {resource.published
          ? "This resource is currently published and visible to all users that have access to this shop."
          : "This resource is currently not published and is only visible to admins and operators of this shop."}{" "}
        {cr.published !== resource.published &&
          (cr.published
            ? "This resource will be published and become visible to all users with access to this shop once you save your changes."
            : "This resource will be unpublished once you save your changes.")}
      </p>
      <Switch
        label="Published"
        value={cr.public}
        onChange={(e) => setCr({ ...cr, public: e })}
      />
      <H3>Basic Information</H3>
      <Input
        label="Title"
        value={cr.title}
        onChange={(e) => setCr({ ...cr, title: e })}
        placeholder="The name of the resource. Typically a machine name"
      />
      <Util.Row gap={1}>
        <div>
          <ResourceTypePicker
            value={cr.resourceTypeId}
            onChange={(value) => setCr({ ...cr, resourceTypeId: value })}
            loading={opLoading}
          />
        </div>
      </Util.Row>
      <Util.Spacer size={1} />
      <Input
        label="Category"
        value={cr.primaryCategory}
        onChange={(e) => setCr({ ...cr, primaryCategory: e })}
        placeholder="Enter a category for the resource"
      />
      <Input
        label="Secondary Category"
        value={cr.secondaryCategory}
        onChange={(e) => setCr({ ...cr, secondaryCategory: e })}
        placeholder="Enter a secondary category for the resource"
      />
      <H3>Resource Stock</H3>
      <Input
        label="Resource Quantity"
        value={cr.quantity}
        onChange={(e) => setCr({ ...cr, quantity: e })}
        placeholder="What is the quantity of this resource?"
        type="number"
        onWheel={(e) => e.target.blur()}
      />
      <Switch
        label="Should the quantity be displayed to customers?"
        value={cr.quantityPublic}
        onChange={(e) => setCr({ ...cr, quantityPublic: e })}
      />
      <H3>Resource Costing</H3>
      <Text>All costing information should be in dollars.</Text>
      <Input
        label={
          <>
            Cost Per Unit <Help text={COSTING.costPerUnit} />
          </>
        }
        value={cr.costPerUnit}
        onChange={(e) => setCr({ ...cr, costPerUnit: e })}
        placeholder="What is the cost per unit of this resource?"
        type="number"
        onWheel={(e) => e.target.blur()}
        icon={<Icon i="currency-dollar" />}
        iconPos="leading"
      />
      <Input
        label={
          <>
            Cost Per Time <Help text={COSTING.costPerTime} />
          </>
        }
        value={cr.costPerTime}
        onChange={(e) => setCr({ ...cr, costPerTime: e })}
        placeholder="What is the cost per time of this resource?"
        type="number"
        onWheel={(e) => e.target.blur()}
        icon={<Icon i="currency-dollar" />}
        iconPos="leading"
      />
      <label className="form-label">
        Can customers provide their own materials?
      </label>
      <DropdownInput
        values={[
          { id: "ALWAYS", label: "Always" },
          { id: "NEVER", label: "Never" },
          { id: "SOMETIMES", label: "Sometimes" },
          { id: "SPECIAL", label: "Only for special cases" },
        ]}
        value={cr.userSuppliedMaterial}
        onChange={(e) => setCr({ ...cr, userSuppliedMaterial: e.id })}
        prompt="Select an option"
      />
      <Util.Spacer size={1} />

      <Input
        label={
          <>
            Cost Per Processing Time{" "}
            <Help text={COSTING.costPerProcessingTime} />
          </>
        }
        value={cr.costPerProcessingTime}
        onChange={(e) => setCr({ ...cr, costPerProcessingTime: e })}
        placeholder="What is the cost per processing time of this resource?"
        type="number"
        onWheel={(e) => e.target.blur()}
        icon={<Icon i="currency-dollar" />}
        iconPos="leading"
      />

      <Switch
        label="Should costing information be displayed to customers?"
        value={cr.costingPublic}
        onChange={(e) => setCr({ ...cr, costingPublic: e })}
      />

      <H3>Resource Description</H3>
      <label className="form-label">Description</label>
      <MarkdownEditor
        value={cr.description}
        onChange={(value) => setCr({ ...cr, description: value })}
        placeholder={"Enter the page content for the resource"}
      />
    </div>
  );
};

const EditGallery = ({
  resource,
  stopEditing,
  HereUploadDropzone,
  deleteResourceImage,
  opLoading,
  refetch,
}) => {
  return (
    <>
      <Util.Row gap={2} style={{ justifyContent: "space-between" }}>
        <H3>Resource Images</H3>
        <Button outline onClick={stopEditing}>
          <Icon i="arrow-left" /> Back
        </Button>
      </Util.Row>
      <Util.Spacer size={1} />
      <Alert variant="warning" title="Notice">
        Editing the image gallery is <i>instant</i>. Changes are saved as soon
        as you press a button.
      </Alert>
      <Table
        columns={[
          {
            label: "Image",
            accessor: "fileUrl",
            render: (fileUrl, context) => (
              <img
                src={fileUrl || context.file?.location}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 5,
                }}
              />
            ),
          },
          {
            label: "File Name",
            accessor: "fileName",
            render: (fileName, context) => (
              <Link to={context.fileUrl}>{fileName}</Link>
            ),
          },
          {
            label: "Uploaded At",
            accessor: "createdAt",
            render: (createdAt) => new Date(createdAt).toLocaleString(),
          },
          {
            label: "Delete",
            accessor: "id",
            render: (id) => (
              <Button
                variant="danger"
                size="sm"
                outline
                onClick={() => deleteResourceImage(id)}
                loading={opLoading}
              >
                <Icon i="trash" /> Delete this image
              </Button>
            ),
          },
        ]}
        data={resource.images}
      />
      <Util.Spacer size={1} />
      <H3>Upload a new image</H3>
      <HereUploadDropzone height={200} onComplete={refetch} />
    </>
  );
};

const COSTING = {
  costPerUnit: (
    <div>
      <p>
        The cost per unit is the cost of a single unit of this resource. This
        may be a cost associated with running a machine one time. This is a way
        to charge for the setup of a machine for a single iteration of a job.
      </p>
      <p>
        For <b>3d printers</b>, this value gets multiplied by the number of
        build trays used.
      </p>
      <p>
        For <b>laser cutters</b>, this value gets multiplied by the number of
        separate cuts are run.
      </p>
    </div>
  ),
  fixedCost: (
    <div>
      <p>
        The fixed cost is a cost that is applied one time for the entire job. It
        is a way to charge for the support, review, and acquisition efforts for
        the entire job
      </p>
    </div>
  ),
  costPerTime: (
    <div>
      <p>
        The cost per time is the cost of running this resource for a single unit
        of time, typically hours. This is a way to charge for the machine time
      </p>
    </div>
  ),

  costPerProcessingTime: (
    <div>
      <p>
        The cost per processing time is the cost of the processing time used in
        the job. This is a way to charge for the processing, design, or
        engineering time used in the job. This is typically per hour.
      </p>
    </div>
  ),
};
