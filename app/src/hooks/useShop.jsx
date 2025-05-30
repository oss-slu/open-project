import { useState, useEffect } from "react";
import { authFetch } from "#url";
import toast from "react-hot-toast";
import { useConfirm } from "tabler-react-2";

export const useShop = (shopId, options) => {
  const includeUsers = options?.includeUsers || false;
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState({});
  const [userShop, setUserShop] = useState({});
  const [users, setUsers] = useState([]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const r = await authFetch(
        `/api/shop/${shopId}${includeUsers ? "?includeUsers=true" : ""}`
      );
      const data = await r.json();
      if (data.shop) {
        setShop(data.shop);
        setUserShop(data.userShop);
        if (data.users) {
          setUsers(data.users);
        }
        setLoading(false);
      } else {
        setError(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const updateShop = async (data) => {
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const updatedShop = await r.json();
      if (updatedShop.shop) {
        setShop(updatedShop.shop);
        setOpLoading(false);
      } else {
        toast.error(updatedShop);
        setError(updatedShop);
        setOpLoading(false);
      }
    } catch (error) {
      setError(error);
      setOpLoading(false);
    }
  };

  const deleteShop = async () => {
    setOpLoading(true);
    try {
      if (await deleteModal()) {
        await authFetch(`/api/shop/${shopId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        document.location.href = `/shops`;
      }
    } catch (error) {
      setError(error);
    }
    setOpLoading(false);
  };

  const { confirm: deleteModal, ConfirmModal: deleteModalElement } = useConfirm({
      title: "Confirm Delete",
      text: "This will set Shop status to Inactive",
      commitText: "Confirm",
      cancelText: "Cancel",
    });

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  return {
    shop,
    users,
    userShop,
    loading,
    error,
    refetch: fetchShop,
    updateShop,
    deleteShop,
    deleteModalElement,
    opLoading,
  };
};
