import useSWR from "swr";
import React, { useState } from "react";
import { authFetch } from "#url";
import { Input, Button } from "tabler-react-2";
import { useModal } from "#modal";

const CreateResourceModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder="FDM 3d Printer"
      />
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title);
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

const EditResourceModalContent = ({ onSubmit , resourceTypeTitle}) => {
  const [title, setTitle] = useState(resourceTypeTitle || "");

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder={"FDM 3d Printer"}
      />
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title);
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

const EditResourceModalContent = ({ onSubmit , resourceTypeTitle}) => {
  const [title, setTitle] = useState(resourceTypeTitle || "");

  return (
    <div>
      <Input
        label="Resource Type Title"
        value={title}
        onChange={setTitle}
        placeholder={"FDM 3d Printer"}
      />
      {title.length > 1 ? (
        <Button
          variant="primary"
          onClick={() => {
            onSubmit(title);
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

const fetcher = (url) => authFetch(url).then((res) => res.json());

export const useResourceTypes = (shopId) => {
  const { data, error, mutate } = useSWR(
    `/api/shop/${shopId}/resources/type`,
    fetcher,
    { suspense: false }
  );

  const [opLoading, setOpLoading] = useState(false);

  const _createResourceType = async (title) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      const data = await r.json();
      if (data.resourceType) {
        // Optimistically update the data
        mutate();
        setOpLoading(false);
        document.location.hash = "#" + data.resourceType.id;
        document.location.reload();
      } else {
        throw data.error;
      }
    } catch (error) {
      setOpLoading(false);
      throw error;
    }
  };

  const _editResourceType = async (title, resourceTypeId) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/resources/type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, resourceTypeId }),
      });
      const data = await r.json();
      if (data.resourceType) {
        // Optimistically update the data
        mutate();
        setOpLoading(false);
        document.location.hash = "#" + data.resourceType.id;
        document.location.reload();
      } else {
        throw data.error;
      }
    } catch (error) {
      setOpLoading(false);
      throw error;
    }
  };

  const { modal: createModal, ModalElement: createModalElement } = useModal({
    title: "Create a new Resource Type",
    text: (
      <CreateResourceModalContent
        onSubmit={async (title) => {
          await _createResourceType(title);
        }}
      />
    ),
  });

  const useEditResourceTypeModal = (resourceTypeId, resourceTypeTitle) => {
    const { modal: editModal, ModalElement: editModalElement } = useModal({
      title: "Edit Resource Type",
      text: (
        <EditResourceModalContent
          onSubmit={(title) => {_editResourceType(title, resourceTypeId)}}
          resourceTypeTitle={resourceTypeTitle}
        />
      ),
    });

    return { editModal, editModalElement }
  };

  return {
    resourceTypes: data ? data.resourceTypes : [],
    loading: !data && !error,
    error,
    refetch: mutate,
    createResourceType: createModal,
    useEditResourceTypeModal,
    opLoading,
    createModalElement,
  };
};
