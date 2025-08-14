import React, { useState } from "react";
import { Page } from "#page";
import { shopSidenavItems } from ".";
import {
  use3dPrinterMaterials,
  use3dPrinterTypes,
  useAuth,
  useShop,
} from "#hooks";
import { useParams } from "react-router-dom";
import { Typography, Util, Alert, DropdownInput, Badge } from "tabler-react-2";
import { Button } from "#button";
import { Loading } from "#loading";
import { Table } from "#table";
import { Modal } from "#modal";
import { Input } from "tabler-react-2";
import { Icon } from "#icon";

const { H1, H2, Text } = Typography;

export const Printing3d = () => {
  const { shopId } = useParams();
  const { shop } = useShop(shopId);
  const { user } = useAuth();
  const {
    loading: typesLoading,
    printerTypes,
    createType,
    opLoading: typesOpLoading,
    deleteType,
    refetch: refetchTypes,
  } = use3dPrinterTypes(shopId);

  const {
    loading: materialsLoading,
    printerMaterials: materials,
    createMaterial,
    opLoading: materialsOpLoading,
    deleteMaterial,
    refetch: refetchMaterials,
  } = use3dPrinterMaterials(shopId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMaterialModalOpen, setCreateMaterialModalOpen] = useState(false);

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "3D Printing",
        shopId,
        user.admin,
        shop.accountType
      )}
    >
      <H1>3D Printing</H1>
      <Text>
        You can configure advanced configuration options for 3d printers here.
      </Text>
      <Alert variant="primary" title="A note on reasoning">
        The content on this page drives the selections available when creating
        and refining resources as well as the options available when sorting
        through job items. These should be <b>very general</b> categories, and
        types should not be machine-specific.
      </Alert>
      <Util.Spacer size={2} />

      <Util.Row style={{ justifyContent: "space-between" }}>
        <H2>Printer Types</H2>
        <Button icon="plus" onClick={() => setCreateModalOpen(true)}>
          Add Printer Type
        </Button>
      </Util.Row>
      <Util.Spacer size={1} />

      {typesLoading ? (
        <Loading />
      ) : printerTypes.length === 0 ? (
        <i>
          No printer types found. Click the "Add Printer Type" button above to
          add a new printer type.
        </i>
      ) : (
        <Table
          columns={[
            { label: "Type", accessor: "type" },
            { label: "Description", accessor: "description" },
            { label: "Materials", accessor: "_count.materials" },
            {
              label: "Delete",
              accessor: "id",
              render: (id) => (
                <Button
                  onClick={async () => {
                    await deleteType(id);
                    refetchMaterials(false);
                  }}
                  size="sm"
                  variant="danger"
                  outline
                  loading={typesOpLoading}
                >
                  <Icon i="trash" /> Delete
                </Button>
              ),
            },
          ]}
          data={printerTypes}
        />
      )}

      <Util.Spacer size={2} />

      <Util.Row style={{ justifyContent: "space-between" }}>
        <H2>Materials</H2>
        <Button icon="plus" onClick={() => setCreateMaterialModalOpen(true)}>
          Add Material
        </Button>
      </Util.Row>
      <Util.Spacer size={1} />

      {materialsLoading ? (
        <Loading />
      ) : materials.length === 0 ? (
        <i>
          No materials found. Click the "Add Material" button above to add a new
          material.
        </i>
      ) : (
        <Table
          columns={[
            { label: "Material", accessor: "type" },
            { label: "Description", accessor: "description" },
            { label: "Manufacturer", accessor: "manufacturer" },
            {
              label: "Printer Type",
              accessor: "printer3dType.type",
              render: (type) => <Badge>{type}</Badge>,
            },
            {
              label: "Delete",
              accessor: "id",
              render: (id) => (
                <Button
                  onClick={async () => {
                    await deleteMaterial(id);
                    refetchTypes(false);
                  }}
                  size="sm"
                  variant="danger"
                  outline
                  loading={materialsOpLoading}
                >
                  <Icon i="trash" /> Delete
                </Button>
              ),
            },
          ]}
          data={materials}
        />
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        modalId="create-printer-type"
        title="Create Printer Type"
      >
        <PrinterTypeForm
          onSave={createType}
          loading={typesOpLoading}
          onClose={() => setCreateModalOpen(false)}
        />
      </Modal>
      <Modal
        open={createMaterialModalOpen}
        onClose={() => setCreateMaterialModalOpen(false)}
        modalId="create-material-type"
        title="Create Material Type"
      >
        <MaterialForm
          onSave={createMaterial}
          loading={materialsOpLoading}
          onClose={() => setCreateMaterialModalOpen(false)}
          printerTypes={printerTypes}
        />
      </Modal>
    </Page>
  );
};

const PrinterTypeForm = ({ onSave, loading, onClose }) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    await onSave(type, description);
    onClose(); // Close modal after saving
    document.location.reload();
  };

  return (
    <>
      <Input
        label="Printer Type"
        placeholder="FDM, SLA, Polyjet"
        value={type}
        onChange={(e) => setType(e)}
      />
      <Input
        label="Description"
        placeholder="A description of the printer type"
        value={description}
        onChange={(e) => setDescription(e)}
      />
      <Button onClick={handleSave} loading={loading}>
        Save
      </Button>
    </>
  );
};

const MaterialForm = ({ onSave, loading, onClose, printerTypes }) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [selectedPrinterType, setSelectedPrinterType] = useState(null);
  const [cost, setCost] = useState("");
  const [costDescriptor, setCostDescriptor] = useState("");

  const handleSave = async () => {
    const r = await onSave(
      type,
      description,
      manufacturer,
      selectedPrinterType
    );
    if (r) {
      onClose(); // Close modal after saving
      document.location.reload();
    }
  };

  if (!printerTypes) {
    return <Loading />;
  }

  return (
    <>
      <Input
        label="Material Type"
        placeholder="PLA, ABS, PETG"
        value={type}
        onChange={(e) => setType(e)}
      />
      <Input
        label="Description"
        placeholder="A description of the material type"
        value={description}
        onChange={(e) => setDescription(e)}
      />
      <Input
        label="Manufacturer"
        placeholder="e.g. Polymaker, Stratasys"
        value={manufacturer}
        onChange={(e) => setManufacturer(e)}
      />
      <Util.Row gap={1}>
        <Input
          label={<>Cost Per Material</>}
          value={cost}
          onChange={setCost}
          placeholder="What is the cost per material of this resource?"
          type="number"
          onWheel={(e) => e.target.blur()}
          style={{ flex: 1 }}
          icon={<Icon i="currency-dollar" />}
          iconPos="leading"
        />
        <Input
          label={<>Material descriptor</>}
          value={costDescriptor}
          onChange={setCostDescriptor}
          placeholder="Singular quantity of this resource? e.g. gram, sheet, roll, etc."
          style={{ width: "70%" }}
        />
      </Util.Row>
      <p>
        Cost per material should be the smallest unit of cost for the material.
        This should be cost per gram, sheet, roll, etc.
      </p>
      <p>
        Material descriptor should be a singular noun that describes the
        quantity, e.g. gram, sheet, roll, etc.
      </p>
      <label className="form-label">Printer Type</label>
      {printerTypes?.length > 0 ? (
        <DropdownInput
          values={printerTypes?.map((t) => ({ id: t.id, label: t.type }))}
          prompt="Select a printer type"
          onChange={(e) => setSelectedPrinterType(e.id)}
          value={selectedPrinterType}
        />
      ) : (
        <i>No printer types found. Please add a printer type first.</i>
      )}

      <Util.Spacer size={1} />
      <Button onClick={handleSave} loading={loading}>
        Save
      </Button>
    </>
  );
};
