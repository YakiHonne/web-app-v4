import NDK from "@nostr-dev-kit/ndk";

const ConnectNDK = async (relays) => {
  try {
    const ndk = new NDK({
      explicitRelayUrls: relays,
    });
    await ndk.connect();
    return ndk;
  } catch (err) {
    console.log(err);
  }
};

const aggregateUsers = (convo, oldAggregated = []) => {
    const arr2 = [];
    const map =
      oldAggregated.length > 0
        ? new Map(oldAggregated.map((item) => [item.pubkey, item]))
        : new Map();
  
    convo.forEach((item) => {
      let pubkey = item.peer || item.pubkey;
      if (map.has(`${pubkey}`)) {
        let checkConvo = map
          .get(`${pubkey}`)
          .convo.find((item_) => item_.id === item.id);
  
        if (!checkConvo) {
          let sortedConvo = [...map.get(`${pubkey}`).convo, item].sort(
            (convo_1, convo_2) => convo_1.created_at - convo_2.created_at
          );
          map.get(`${pubkey}`).convo = sortedConvo;
          map.get(`${pubkey}`).checked =
            (map.get(`${pubkey}`).checked &&
              sortedConvo[sortedConvo.length - 1].created_at ===
                map.get(`${pubkey}`).last_message) ||
            (item.peer ? true : false);
          map.get(`${pubkey}`).last_message =
            sortedConvo[sortedConvo.length - 1].created_at;
        }
      } else {
        map.set(`${pubkey}`, {
          pubkey,
          last_message: item.created_at,
          checked: item.peer ? true : false,
          convo: [item],
          id: pubkey,
        });
      }
    });
  
    arr2.push(...map.values());
    arr2.sort((convo_1, convo_2) => convo_2.last_message - convo_1.last_message);
    return arr2;
  };

  const getConnectedAccounts = () => {
    try {
      let accounts = localStorage.getItem("yaki-accounts") || [];
      accounts = Array.isArray(accounts) ? [] : JSON.parse(accounts);
      return accounts;
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const addConnectedAccounts = (account, nostrKeys) => {
    try {
      let accounts = getConnectedAccounts() || [];
      let isAccount = accounts.findIndex(
        (account_) => account_.pubkey === account.pubkey
      );
      if (isAccount === -1) {
        accounts.push({ ...account, nostrKeys });
        localStorage.setItem("yaki-accounts", JSON.stringify(accounts));
      } else {
        accounts.splice(isAccount, 1, { ...account, nostrKeys });
        localStorage.setItem("yaki-accounts", JSON.stringify(accounts));
      }
    } catch (err) {
      console.log(err);
    }
  };

export { ConnectNDK, aggregateUsers };
