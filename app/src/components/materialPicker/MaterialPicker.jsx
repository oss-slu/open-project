import React from "react";
import { useMaterials } from "../../hooks";
import { useParams } from "react-router-dom";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";
import { Util } from "tabler-react-2";

export const MaterialPicker = ({
  value,
  onChange,
  resourceTypeId,
  opLoading,
  includeNone,
  materialType
}) => {
  const { shopId } = useParams();
  const { materials, loading } = useMaterials(shopId, resourceTypeId);

  return (
    <Util.Col>
      <LoadableDropdownInput
        loading={loading || opLoading}
        value={value}
        onChange={(v) => onChange(v.id)}
        values={[
          ...materials.map((m) => ({
            id: m.id,
            label: m.title,
          })),
          includeNone
            ? {
                id: null,
                label: "Select a material",
                dropdownText: "None",
              }
            : null,
        ].filter((v) => v)}
        prompt="Select Material"
        label={`${materialType} Material`}
      />
    </Util.Col>
  );
};
