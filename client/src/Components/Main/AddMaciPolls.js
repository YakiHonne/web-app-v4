import React from "react";
import { MaciClient, MaciCircuitType } from "@dorafactory/maci-sdk";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { Buffer } from "buffer";

const getKeplrKey = async () => {
  if (!window.keplr) {
    console.log("Please install keplr extension");
    return false;
  } else {
    const chainId = "vota-ash";

    // Enabling before using the Keplr is recommended.
    // This method will ask the user whether to allow access if they haven't visited this website.
    // Also, it will request that the user unlock the wallet if the wallet is locked.
    await window.keplr.enable(chainId);

    const offlineSigner = window.keplr.getOfflineSigner(chainId);

    // You can get the address/public keys by `getAccounts` method.
    // It can return the array of address/public key.
    // But, currently, Keplr extension manages only one address/public key pair.
    // XXX: This line is needed to set the sender address for SigningCosmosClient.
    const accounts = await offlineSigner.getAccounts();

    return accounts[0];
  }
};

export default function AddMaciPolls() {
  const addMaciPoll = async () => {
    try {
      const client = new MaciClient({
        network: "testnet",
      });

      let key = await getKeplrKey();
      let hex = Array.from(key.pubkey)
      .map((byte) => byte.toString(16).padStart(2, "0")) // Convert each byte to a 2-character hex string.
      .join("");
      
      const wallet = await DirectSecp256k1Wallet.fromKey(
        Buffer.from("033faef3e995957b51ed91c8109149bc6d9a182a5d16efbc141d0b71f931d7b970", "hex"),
        "dora"
      );
      console.log(wallet);
client.createOracleMaciRound()
      //   const rounds = await client.getRounds("first", 10);
      //   console.log(rounds);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="btn btn-normal" onClick={addMaciPoll}>
      AddMaciPolls
    </div>
  );
}
