import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { useModal } from "tabler-react-2/dist/modal";
import { Input, Button, Util } from "tabler-react-2";
import { ResourceTypePicker } from "../components/resourceTypePicker/ResourceTypePicker";
import toast from "react-hot-toast";

const CreateMaterialModalContent = ({ onSubmit, resourceTypeId }) => {
  const [title, setTitle] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [unitDescriptor, setUnitDescriptor] = useState("");
  const [resourceType, setResourceType] = useState(resourceTypeId);

  const isValid = title.length > 1 && manufacturer.length > 1 && resourceType;

  return (
    <div>
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e)}
        placeholder="Acrylic, PLA, Pinewood"
      />
      <Input
        label="Manufacturer"
        value={manufacturer}
        onChange={(e) => setManufacturer(e)}
        placeholder="Stratasys, BASF, Generic"
      />
      <ResourceTypePicker
        value={resourceType}
        onChange={(e) => setResourceType(e)}
      />
      <Util.Spacer size={2} />
      <Util.Row gap={1}>
        <Input
          label="Cost Per Unit in dollars*"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e)}
          placeholder="Cost Per Unit"
          type="number"
          style={{
            flex: 1,
          }}
        />
        <Input
          label="Unit Descriptor*"
          value={unitDescriptor}
          onChange={(e) => setUnitDescriptor(e)}
          placeholder="e.g., gram, page, sheet"
          style={{
            width: "65%",
          }}
        />
      </Util.Row>
      <p>*Cost information is optional.</p>
      <p>
        Cost per unit should be the cost of a single unit of the material, and
        unit descriptor should be this unit. This is the smallest unit of
        material that can be purchased. For 3d printing, this should be gram.
        For laser cutting, this should be sheet. For traditional printing, this
        should be page. For grammatical correctness, this should be singular
        lower-case, but this is not enforced.
      </p>

      {isValid ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit({
              title,
              manufacturer,
              costPerUnit,
              unitDescriptor,
              resourceTypeId: resourceType,
            });
          }}
        >
          Submit
        </Button>
      ) : (
        <Button disabled>Submit</Button>
      )}
    </div>
  );
};

export const useMaterials = (shopId, resourceTypeId) => {
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);

  const _createMaterial = async (data) => {
    try {
      setOpLoading(true);
      const response = await authFetch(
        `/api/shop/${shopId}/resources/type/${data.resourceTypeId}/material`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (result.material) {
        setMaterials([...materials, result.material]);
        setOpLoading(false);
        document.location.href = `/shops/${shopId}/resources/type/${resourceTypeId}/materials/${result.material.id}`;
      } else {
        toast.error(result.error || "An error occurred");
        setError(result.error || "An error occurred");
        setOpLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setOpLoading(false);
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Create a New Material",
    text: (
      <CreateMaterialModalContent
        onSubmit={_createMaterial}
        resourceTypeId={resourceTypeId}
      />
    ),
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await authFetch(
        `/api/shop/${shopId}/resources/type/${resourceTypeId}/material`
      );
      const data = await response.json();
      if (data.materials) {
        setMaterials(data.materials);
        setLoading(false);
      } else {
        toast.error(data.error || "Failed to fetch materials");
        setError(data.error || "Failed to fetch materials");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const createMaterial = () => {
    modal();
  };

  useEffect(() => {
    fetchMaterials();
  }, [resourceTypeId, shopId]);

  return {
    materials,
    loading,
    error,
    opLoading,
    fetchMaterials,
    createMaterial,
    ModalElement,
  };
};
