import axios from "axios";
import React, { useState } from "react";
import { setToast } from "../../Store/Slides/Publishers";
import { useDispatch, useSelector } from "react-redux";
import { getWallets, updateWallets } from "../../Helpers/Helpers";
import LoadingDots from "../LoadingDots";

export default function AddYakiWallet({ refresh }) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async (e) => {
    try {
      e.stopPropagation();
      if (isLoading) return;
      setIsLoading(true);
      let url = await axios.post("https://wallet.yakihonne.com/api/wallets");

      setIsLoading(false);
      let wallet = {
        secret: url.data.connectionSecret,
        addr: url.data.lightningAddress,
      };
      let nwcNode = {
        id: Date.now(),
        kind: 3,
        entitle: wallet.addr,
        active: true,
        data: wallet.secret,
      };
      let oldVersion = getWallets();
      if (oldVersion) {
        try {
          oldVersion = oldVersion.map((item) => {
            let updated_item = { ...item };
            updated_item.active = false;
            return updated_item;
          });
          oldVersion.push(nwcNode);
          updateWallets(oldVersion);
          refresh();
          return;
        } catch (err) {
          updateWallets([nwcNode]);
          refresh();
          return;
        }
      }
      updateWallets([nwcNode]);
      refresh();
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      dispatch(
        setToast({
          type: 3,
          desc: "Could not create your wallet, retry later in settings",
        })
      );
    }
  };
  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-s box-pad-v-s option pointer"
      style={{ backgroundColor: "transparent" }}
      onClick={handleCreateWallet}
    >
      <div className="fx-centered">
        <div
          className="yaki-logomark"
          style={{ width: "48px", height: "48px" }}
        ></div>
        {!isLoading && (
          <div>
            <p>Yakihonne's NWC</p>
            <p className="gray-c p-medium">
              Create a wallet using Yakihonne's channel
            </p>
          </div>
        )}
        {isLoading && <LoadingDots />}
      </div>
      <div className="box-pad-h-s">
        <div className="plus-sign"></div>
      </div>
    </div>
  );
}
