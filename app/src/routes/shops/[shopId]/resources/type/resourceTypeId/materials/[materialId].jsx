import React, { useEffect, useState } from "react";
import { Page } from "#page";
import { shopSidenavItems } from "../../../..";
import { Link, useParams } from "react-router-dom";
import { useAuth, useMaterial, useShop } from "#hooks";
import { Typography, Util, Input, Card, Switch, Badge } from "tabler-react-2";
import { Loading } from "#loading";
import { Button } from "#button";
import { Icon } from "#icon";
import { ResourceTypePicker } from "../../../../../../../components/resourceTypePicker/ResourceTypePicker";
import { UploadDropzone } from "../../../../../../../components/upload/uploader";
import { MarkdownEditor } from "#markdownEditor";
import { MarkdownRender } from "#markdownRender";
import { Gallery } from "../../../../../../../components/gallery/gallery";
import { Table } from "#table";
const { H1, H2, H3, B } = Typography;

const objectsAreEqual = (o1, o2) => {
  return JSON.stringify(o1) === JSON.stringify(o2);
};

export const MaterialPage = () => {
  const { shopId, resourceTypeId, materialId } = useParams();
  const { user } = useAuth();
  const { userShop } = useShop(shopId);
  const {
    material,
    loading,
    updateMaterial,
    opLoading,
    deleteMaterialImage,
    deleteMaterial,
    refetch,
  } = useMaterial(shopId, resourceTypeId, materialId);

  const [nm, setNm] = useState(material);

  useEffect(() => {
    setNm(material);
  }, [material]);

  const [editing, setEditing] = useState(false);
  const [editingGallery, setEditingGallery] = useState(false);

  const [changed, setChanged] = useState(false);
  useEffect(() => {
    setChanged(!objectsAreEqual(nm, material));
  }, [nm, material]);

  if (loading)
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
      <Util.Row justify="between" align="center">
        <H1>{material.title}</H1>
        {(user.admin || userShop.accountType === "ADMIN") &&
          !editing &&
          !editingGallery && (
            <Util.Row gap={1}>
              <Button onClick={() => setEditingGallery(true)}>
                <Icon i="photo" />
                Edit Gallery
              </Button>
              <Button onClick={() => setEditing(true)}>
                <Icon i="edit" />
                Edit
              </Button>
              <Button
                onClick={deleteMaterial}
                variant="danger"
                outline
                loading={opLoading}
              >
                <Icon i="trash" />
                Delete
              </Button>
            </Util.Row>
          )}
      </Util.Row>
      <Util.Hr />
      <Util.Responsive threshold={800} gap={2}>
        <div style={{ flex: 1 }}>
          <H2>Material Information</H2>
          <B>Manufacturer</B>{" "}
          <Badge color="teal">{material.manufacturer}</Badge>
          {material.costPublic && (
            <>
              <Util.Spacer size={2} />
              <H3>Costing Information</H3>
              <B>Cost per unit</B>{" "}
              <Badge color="teal">${material.costPerUnit}</Badge> per{" "}
              <Badge color="teal">{material.unitDescriptor}</Badge>
            </>
          )}
          <Util.Spacer size={2} />
          <H3>Documentation</H3>
          <Util.Col gap={1} align="start">
            <Button
              ghost
              href={material.msdsFileUrl ? material.msdsFileUrl : null}
              target="_blank"
              disabled
              variant="primary"
            >
              <Icon i="download" />
              Material Safety Data Sheet
              {material.msdsFileUrl ? "" : " (Not Available)"}
            </Button>
            <Button
              ghost
              href={material.tdsFileUrl ? material.tdsFileUrl : null}
              target="_blank"
              disabled
              variant="primary"
            >
              <Icon i="download" />
              Technical Data Sheet
            </Button>
          </Util.Col>
        </div>
        <div style={{ flex: 1 }}>
          <H3>Gallery</H3>
          <div
            style={{
              width: "100%",
              height: 200,
            }}
          >
            {material.images.length > 0 ? (
              <div
                style={{
                  border: "1px solid #e5e5e5",
                }}
              >
                <Gallery images={material.images} height={200} />
              </div>
            ) : user.admin || userShop.accountType === "ADMIN" ? (
              <UploadDropzone
                scope="material.image"
                metadata={{ shopId, materialId }}
                onUploadComplete={refetch}
                dropzoneAppearance={{
                  container: {
                    height: 200,
                    padding: 10,
                  },
                  uploadIcon: {
                    display: "none",
                  },
                }}
              />
            ) : (
              <i>No images found</i>
            )}
          </div>
        </div>
      </Util.Responsive>
      <Util.Hr />
      {editing ? (
        <div>
          <Util.Row justify="between" align="center">
            <H2>Editing Material</H2>
            {changed && <i className="text-red">You have unsaved changes.</i>}
            <Button
              loading={opLoading}
              onClick={async () => {
                await updateMaterial(nm);
                setEditing(false);
              }}
              variant="primary"
            >
              Save & Close edit mode
            </Button>
          </Util.Row>
          <Input
            label="Title"
            value={material.title}
            onChange={(e) => setNm({ ...nm, title: e })}
          />
          <Input
            label="Manufacturer"
            value={material.manufacturer}
            onChange={(e) => setNm({ ...nm, manufacturer: e })}
          />
          <ResourceTypePicker
            value={material.resourceTypeId}
            onChange={(v) => setNm({ ...nm, resourceTypeId: v })}
          />
          <Util.Spacer size={1} />
          <Util.Row gap={1}>
            <Input
              label="Cost Per Unit in dollars*"
              value={material.costPerUnit}
              onChange={(e) => setNm({ ...nm, costPerUnit: e })}
              placeholder="Cost Per Unit"
              type="number"
              style={{
                flex: 1,
              }}
            />
            <Input
              label="Unit Descriptor*"
              value={material.unitDescriptor}
              onChange={(e) => setNm({ ...nm, unitDescriptor: e })}
              placeholder="e.g., gram, page, sheet"
              style={{
                width: "65%",
              }}
            />
          </Util.Row>
          <Switch
            label="Show cost information to all shop users"
            value={material.costPublic}
            onChange={(e) => setNm({ ...nm, costPublic: e })}
          />
          <p>
            Cost per unit should be the cost of a single unit of the material,
            and unit descriptor should be this unit. This is the smallest unit
            of material that can be purchased. For 3d printing, this should be
            gram. For laser cutting, this should be sheet. For traditional
            printing, this should be page. For grammatical correctness, this
            should be singular lower-case, but this is not enforced.
          </p>

          <H2>Documentation</H2>
          <H3>MSDS (Material Safety Data Sheet)</H3>
          <Util.Row gap={1}>
            {material.msdsFileUrl && (
              <Card
                style={{
                  flex: 1,
                  marginTop: 8,
                }}
                title={
                  <Util.Row gap={0.5} align="center">
                    Current MSDS
                    <Button
                      href={material.msdsFileUrl}
                      target="_blank"
                      size="sm"
                    >
                      <Icon i="download" />
                      Download
                    </Button>
                  </Util.Row>
                }
              >
                <iframe src={material.msdsFileUrl} style={{ width: "100%" }} />
              </Card>
            )}
            <UploadDropzone
              scope="material.msds"
              metadata={{ shopId, materialId }}
              onUploadComplete={() => {
                setTimeout(() => {
                  refetch();
                }, 750);
              }}
              dropzoneAppearance={{
                container: {
                  height: !material.msdsFileUrl ? 200 : null,
                  padding: 10,
                  flex: 1,
                  borderRadius: 4,
                },
                uploadIcon: {
                  display: "none",
                },
                button: {
                  backgroundColor: "var(--tblr-primary)",
                },
              }}
            />
          </Util.Row>
          <Util.Spacer size={2} />
          <H3>TDS (Technical Data Sheet)</H3>
          <Util.Row gap={1}>
            {material.tdsFileUrl && (
              <Card
                style={{
                  flex: 1,
                  marginTop: 8,
                }}
                title={
                  <Util.Row gap={0.5} align="center">
                    Current TDS
                    <Button
                      href={material.tdsFileUrl}
                      target="_blank"
                      size="sm"
                    >
                      <Icon i="download" />
                      Download
                    </Button>
                  </Util.Row>
                }
              >
                <iframe src={material.tdsFileUrl} style={{ width: "100%" }} />
              </Card>
            )}
            <UploadDropzone
              scope="material.tds"
              metadata={{ shopId, materialId }}
              onUploadComplete={refetch}
              dropzoneAppearance={{
                container: {
                  height: !material.tdsFileUrl ? 200 : null,
                  padding: 10,
                  flex: 1,
                  borderRadius: 4,
                },
                uploadIcon: {
                  display: "none",
                },
                button: {
                  backgroundColor: "var(--tblr-primary)",
                },
              }}
            />
          </Util.Row>
          <Util.Spacer size={2} />
          <H2>Description</H2>
          <MarkdownEditor
            value={material.description}
            onChange={(e) => setNm({ ...nm, description: e })}
          />
          <Util.Hr />
        </div>
      ) : editingGallery ? (
        <div>
          <Util.Row justify="between" align="center">
            <H3>Material Gallery</H3>
            <Button
              loading={opLoading}
              onClick={async () => {
                setEditingGallery(false);
              }}
              variant="primary"
            >
              <Icon i="arrow-left" />
              Back
            </Button>
          </Util.Row>
          <Util.Spacer size={1} />
          <Table
            columns={[
              {
                label: "Image",
                accessor: "fileUrl",
                render: (url) => (
                  <img
                    src={url}
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
                render: (fileName, _) => (
                  <Link to={_.fileUrl} target="_blank">
                    {fileName}
                  </Link>
                ),
              },
              {
                label: "Uploaded At",
                accessor: "createdAt",
                render: (date) => new Date(date).toLocaleString(),
              },
              {
                label: "Delete",
                accessor: "id",
                render: (id) => (
                  <Button
                    onClick={() => {
                      deleteMaterialImage(id);
                    }}
                    variant="danger"
                    size="sm"
                    loading={opLoading}
                    outline
                  >
                    <Icon i="trash" />
                    Delete this image
                  </Button>
                ),
              },
            ]}
            data={material.images}
          />
          <Util.Spacer size={1} />
          <H3>Upload a new image</H3>
          <UploadDropzone
            scope="material.image"
            metadata={{ shopId, materialId }}
            dropzoneAppearance={{
              container: {
                height: 200,
                padding: 10,
              },
              uploadIcon: {
                display: "none",
              },
              button: {
                backgroundColor: "var(--tblr-primary)",
              },
            }}
            onUploadComplete={refetch}
          />
        </div>
      ) : (
        <div>
          <MarkdownRender markdown={material.description} />
        </div>
      )}
    </Page>
  );
};
