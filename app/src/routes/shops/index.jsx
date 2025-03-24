import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useShops } from "../../hooks/useShops";
import { Loading } from "../../components/loading/Loading";
import { Typography , Util} from "tabler-react-2";
import { ShopCard } from "../../components/shopcard/ShopCard";
import { Page, sidenavItems } from "../../components/page/page";
import { Button } from "tabler-react-2/dist/button";


const { H1 } = Typography;

export const Shops = () => {
  const { user } = useAuth();
  const { shops, loading } = useShops();

  if (loading) return <Loading />;

  return (
    <Page sidenavItems={sidenavItems("Shops", user.admin)}
    >
      <Util.Row justify="between" align="center">
        <H1>Shops</H1>
        {user.admin &&(
          <Button onClick={() => navigate("/app/shopId")}> {/*Implement UseState and connect to POST request implemented in UseShops*/}
            New Shop
          </Button>
        )}
      </Util.Row>
      <Util.Spacer size={1} />
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </Page>
  );
};
