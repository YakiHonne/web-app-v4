import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setToPublish } from "../../Store/Slides/Publishers";
import InterestSuggestions from "../../Content/InterestSuggestions";

export default function InterestSuggestionsCards({
  list = [],
  update = false,
  expand = false,
  addItemToList,
}) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [tempInterestList, setTempInterestList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isChanged = useMemo(() => {
    return JSON.stringify(list) !== JSON.stringify(tempInterestList);
  }, [list, tempInterestList]);
  useEffect(() => {
    setTempInterestList(list);
  }, [list]);

  const handleContent = (item, isAdded) => {
    if (update) {
      handleAddItems(item, isAdded);
    } else addItemToList(item, isAdded);
  };

  const handleAddItems = (item, isAdded) => {
    if (isAdded) {
      let index = tempInterestList.findIndex(
        (_) => _.item === item.toLowerCase()
      );
      let tempArray = structuredClone(tempInterestList);
      tempArray.splice(index, 1);
      setTempInterestList(tempArray);
    } else {
      setTempInterestList((prev) => [...prev, item]);
    }
  };

  const saveInterestList = async () => {
    try {
      if (!(isChanged && !isLoading)) return;
      setIsLoading(true);
      let tags = [...new Set([...userInterestList, ...tempInterestList])].map(
        (_) => ["t", _.toLowerCase()]
      );

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10015,
          content: "",
          tags: tags,
          allRelays: [],
        })
      );
      return true;
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      return false;
    }
  };

  return (
    <div className="fit-container box-pad-h fx-centered fx-col fx-start-v box-pad-v">
      <div className="fx-scattered fit-container box-marg-s">
        <h4>Suggested interets</h4>
        {isChanged && update && (
          <button className="btn btn-normal" onClick={saveInterestList}>
            Update list
          </button>
        )}
      </div>
      <div
        className="fit-container fx-centered fx-col sc-s-18 box-pad-h-m box-pad-v-m"
        style={{ backgroundColor: "transparent" }}
      >
        {!expand &&
          InterestSuggestions.map((item, index) => {
            let isAdded = tempInterestList.includes(
              item.main_tag.toLowerCase()
            );
            return (
              <div
                className="fit-container fx-scattered"
                key={index}
                onClick={() =>
                  handleContent(item.main_tag.toLowerCase(), isAdded)
                }
              >
                <div className="fx-centered">
                  <div
                    style={{
                      minWidth: `38px`,
                      aspectRatio: "1/1",
                      position: "relative",
                    }}
                    className="sc-s-18 fx-centered"
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        zIndex: 2,
                        backgroundImage: `url(${item.icon})`,
                      }}
                      className="bg-img cover-bg  fit-container fit-height"
                    ></div>
                  </div>
                  <p className="p-caps">{item.main_tag}</p>
                </div>
                {!isAdded && (
                  <button className=" btn-normal btn-small-round fx-centered">
                    <div className="plus-sign"></div>
                  </button>
                )}
                {isAdded && (
                  <button
                    className=" btn-normal btn-small-round fx-centered"
                    style={{ backgroundColor: "var(--green-main)" }}
                  >
                    <div
                      className="checkmark"
                      style={{ filter: "brightness(0) invert()" }}
                    ></div>
                  </button>
                )}
              </div>
            );
          })}
        {expand &&
          InterestSuggestions.filter((item) => {
            let isAdded = userInterestList.includes(item.main_tag.toLowerCase());
            if (!isAdded) return item;
          }).splice(0, 10).map((item, index) => {
            let isAdded = tempInterestList.includes(item.main_tag.toLowerCase());
            return (
              <div
                className="fit-container fx-scattered"
                key={index}
                onClick={() =>
                  handleContent(item.main_tag.toLowerCase(), isAdded)
                }
              >
                <div className="fx-centered">
                  <div
                    style={{
                      minWidth: `38px`,
                      aspectRatio: "1/1",
                      position: "relative",
                    }}
                    className="sc-s-18 fx-centered"
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        zIndex: 2,
                        backgroundImage: `url(${item.icon})`,
                      }}
                      className="bg-img cover-bg  fit-container fit-height"
                    ></div>
                  </div>
                  <p className="p-caps">{item.main_tag}</p>
                </div>
                {!isAdded && (
                  <button className=" btn-normal btn-small-round fx-centered">
                    <div className="plus-sign"></div>
                  </button>
                )}
                {isAdded && (
                  <button
                    className=" btn-normal btn-small-round fx-centered"
                    style={{ backgroundColor: "var(--green-main)" }}
                  >
                    <div
                      className="checkmark"
                      style={{ filter: "brightness(0) invert()" }}
                    ></div>
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
