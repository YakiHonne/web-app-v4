import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../../Context/Context";
import PagePlaceholder from "../../Components/PagePlaceholder";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { nanoid } from "nanoid";
import { getVideoFromURL } from "../../Helpers/Helpers";
import UploadFile from "../../Components/UploadFile";
import { Link } from "react-router-dom";
import ZapPollsPreview from "../../Components/NOSTR/ZapPollsPreview";
import AddPoll from "../../Components/NOSTR/AddPoll";
import relaysOnPlatform from "../../Content/Relays";
import { finalizeEvent, nip19, SimplePool } from "nostr-tools";
import { filterRelays } from "../../Helpers/Encryptions";
const pool = new SimplePool();

const getTypeMetada = (type) => {
  if (type === "video")
    return {
      url: "",
    };
  if (type === "image")
    return {
      url: "",
      aspect_ratio: "16:9",
    };
  if (type === "text")
    return {
      content: "Lorem ipsum",
      text_color: "",
      weight: "",
      size: "regular",
    };
  if (type === "button")
    return {
      content: "Button",
      text_color: "",
      url: "",
      background_color: "",
      type: "regular",
    };
  if (type === "zap-poll")
    return {
      nevent: "",
      content: "",
      content_text_color: "",
      options_text_color: "",
      options_background_color: "",
      options_foreground_color: "",
    };
};

const getNostrKeys = () => {
  let nostrKeys = localStorage.getItem("_nostruserkeys");
  try {
    nostrKeys = nostrKeys ? JSON.parse(nostrKeys) : false;
    return nostrKeys;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default function NostrSmartWidget() {
  let nostrKeys = getNostrKeys();

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Smart widget builder</title>
        <meta
          name="description"
          content={"Your portal for building your smart widget"}
        />
        <meta
          property="og:description"
          content={"Your portal for building your smart widget"}
        />

        <meta
          property="og:url"
          content={`https://yakihonne.com/smart-widget`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Smart widget builder" />
        <meta
          property="twitter:title"
          content="Yakihonne | Smart widget builder"
        />
        <meta
          property="twitter:description"
          content={"Your portal for building your smart widget"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <SidebarNOSTR />
          <main
            className="main-page-nostr-container"
            // style={{ overflow: "visible" }}
          >
            <div className="fx-centered fit-container fx-start-h fx-start-v">
              <div
                style={{ width: "min(100%,1000px)" }}
                className="box-pad-h-m fit-container"
              >
                {nostrKeys && (
                  <>
                    {(nostrKeys.sec || nostrKeys.ext) && (
                      <>
                        <SmartWidgetBuilder />
                      </>
                    )}
                    {!nostrKeys.sec && !nostrKeys.ext && (
                      <PagePlaceholder page={"nostr-unauthorized"} />
                    )}
                  </>
                )}
                {!nostrKeys && <PagePlaceholder page={"nostr-not-connected"} />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const SmartWidgetBuilder = () => {
  const { nostrKeys, nostrUser, setToast, setToPublish } = useContext(Context);
  const [showComponents, setShowComponents] = useState(false);
  const [componentsTree, setComponentsTree] = useState([
    {
      id: nanoid(),
      layout: 1,
      division: "1:1",
      left_side: [],
      right_side: [],
    },
  ]);
  const [selectedLayer, setSelectedLayer] = useState(false);
  const [mainContainerBorderColor, setMainContainerBorderColor] = useState("");
  const [mainContainerBackgroundColor, setMainContainerBackgroundColor] =
    useState("");
  const [selectedContainer, setSelectedContainer] = useState(componentsTree[0]);
  const [preview, setPreview] = useState(false);

  const handleAddComponent = (type) => {
    let tempArray = Array.from(componentsTree);
    let index = tempArray.findIndex((comp) => comp.id === selectedContainer.id);
    if (index !== -1) {
      let tempId = nanoid();
      let tempComp = {
        id: tempId,
        type,
        metadata: getTypeMetada(type),
      };
      if (selectedContainer.side === "left")
        tempArray[index].left_side.push(tempComp);
      if (selectedContainer.side === "right")
        tempArray[index].right_side.push(tempComp);
      setSelectedLayer(tempComp);
      setComponentsTree(tempArray);
    }
  };
  const handleAddContainer = (containerId) => {
    let tempArray = Array.from(componentsTree);
    let index = tempArray.findIndex((comp) => comp.id === containerId);
    if (index !== -1) {
      let newContainer = {
        id: nanoid(),
        layout: 1,
        division: "1:1",
        left_side: [],
        right_side: [],
      };
      if (index + 1 !== tempArray.length) {
        if (
          tempArray[index + 1].left_side.length === 0 &&
          tempArray[index + 1].right_side.length === 0
        )
          return;
      }
      tempArray.splice(index + 1, 0, newContainer);
      setComponentsTree(tempArray);
      setSelectedContainer(newContainer);
      setSelectedLayer(false);
    }
  };
  const handleSelectedLayerMetadata = (metadata) => {
    let tempArray = Array.from(componentsTree);
    let index = tempArray.findIndex((comp) => comp.id === selectedContainer.id);
    if (index !== -1) {
      let index_left = tempArray[index].left_side.findIndex(
        (comp_) => comp_.id === metadata.id
      );
      let index_right = tempArray[index].right_side.findIndex(
        (comp_) => comp_.id === metadata.id
      );
      if (index_left !== -1) tempArray[index].left_side[index_left] = metadata;
      if (index_right !== -1)
        tempArray[index].right_side[index_right] = metadata;
      setSelectedLayer(metadata);
      setComponentsTree(tempArray);
    }
  };
  const handleDeleteContainer = (index) => {
    let tempArray = Array.from(componentsTree);
    if (tempArray[index].id === selectedContainer.id) {
      setSelectedContainer(false);
      setSelectedLayer(false);
    }
    tempArray.splice(index, 1);
    setComponentsTree(tempArray);
  };
  const handleDeleteComponent = (containerIndex, componentIndex, side) => {
    let tempArray = Array.from(componentsTree);

    if (side === "left") {
      if (
        tempArray[containerIndex].left_side[componentIndex].id === selectedLayer
      )
        setSelectedLayer(false);
      tempArray[containerIndex].left_side.splice(componentIndex, 1);
    }
    if (side === "right") {
      if (
        tempArray[containerIndex].right_side[componentIndex].id ===
        selectedLayer
      )
        setSelectedLayer(false);
      tempArray[containerIndex].right_side.splice(componentIndex, 1);
    }
    setComponentsTree(tempArray);
  };
  const handleContainerOps = (opsKind, metadata) => {
    let changeSection = () => {
      let tempArray = Array.from(componentsTree);
      let index = tempArray.findIndex((comp) => comp.id === metadata.id);
      let layout = metadata.layout || 1;
      let division = metadata.division || "1:1";

      if (index !== -1) {
        tempArray[index].layout = layout;
        tempArray[index].division = division;
        setComponentsTree(tempArray);
      }
    };
    let moveUp = () => {
      let tempArray = Array.from(componentsTree);
      let tempPrevEl = tempArray[metadata.index - 1];
      let tempCurrentEl = tempArray[metadata.index];

      tempArray[metadata.index] = tempPrevEl;
      tempArray[metadata.index - 1] = tempCurrentEl;
      setComponentsTree(tempArray);
    };
    let moveDown = () => {
      let tempArray = Array.from(componentsTree);
      let tempNextEl = tempArray[metadata.index + 1];
      let tempCurrentEl = tempArray[metadata.index];

      tempArray[metadata.index] = tempNextEl;
      tempArray[metadata.index + 1] = tempCurrentEl;
      setComponentsTree(tempArray);
    };
    let switchSections = () => {
      let tempArray = Array.from(componentsTree);
      let right_side = tempArray[metadata.index].right_side;
      let left_side = tempArray[metadata.index].left_side;

      tempArray[metadata.index].right_side = left_side;
      tempArray[metadata.index].left_side = right_side;

      setComponentsTree(tempArray);
    };

    if (opsKind === "change section") {
      changeSection();
      return;
    }
    if (opsKind === "move up") {
      moveUp();
      return;
    }
    if (opsKind === "move down") {
      moveDown();
      return;
    }
    if (opsKind === "switch sections") {
      switchSections();
      return;
    }
    if (opsKind === "delete") {
      handleDeleteContainer(metadata.index);
      return;
    }
  };
  const checkMonoLayer = () => {
    let tempArray = Array.from(componentsTree);
    let index = tempArray.findIndex((comp) => comp.id === selectedContainer.id);
    if (index !== -1) {
      if (tempArray[index].layout === 1) return true;
      return false;
    }
    return true;
  };

  const postWidget = async () => {
    let created_at = Math.floor(Date.now() / 1000);
    let relaysToPublish = nostrUser
      ? filterRelays(relaysOnPlatform, nostrUser?.relays || [])
      : relaysOnPlatform;

    let tags = [
      ["d", nanoid()],
      [
        "client",
        "Yakihonne",
        "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
      ],
      ["published_at", `${created_at}`],
      // ["title", title],
      // ["summary", summary],
    ];

    let content = componentsTree.filter(
      (component) =>
        component.left_side.length > 0 || component.right_side.length > 0
    );

    if (content.length === 0) {
      setToast({
        type: 3,
        desc: "The smart widget should have at least one component",
      });
      return;
    } 
    content = JSON.stringify({
      border_color: mainContainerBorderColor,
      background_color: mainContainerBackgroundColor,
      components: componentsTree,
    });
    console.log(content);
    setToast({
      type: 1,
      desc: "Good",
    });
    return;
    let tempEvent = {
      created_at,
      kind: 6969,
      content: content,
      tags,
    };
    if (nostrKeys.ext) {
      try {
        tempEvent = await window.nostr.signEvent(tempEvent);
      } catch (err) {
        console.log(err);
        return false;
      }
    } else {
      tempEvent = finalizeEvent(tempEvent, nostrKeys.sec);
    }
    setToPublish({
      eventInitEx: tempEvent,
      allRelays: relaysToPublish,
    });
    let nEvent = nip19.neventEncode({
      id: tempEvent.id,
      pubkey: nostrKeys.pub,
    });
    let pool = new SimplePool();
    let sub = pool.subscribeMany(
      relaysToPublish,
      [{ kinds: [6969], ids: [tempEvent.id] }],
      {
        onevent() {
          setToast({
            type: 1,
            desc: "Poll was posted successfully",
          });

          sub.close();
        },
      }
    );
  };

  return (
    <>
      {showComponents && (
        <Components
          exit={() => setShowComponents(false)}
          addComp={(data) => {
            handleAddComponent(data);
            setShowComponents(false);
          }}
          isMonoLayout={checkMonoLayer()}
        />
      )}
      <div className="fit-container fx-centered fx-start-h fx-start-v">
        <div
          style={{ width: "min(100%,700px)" }}
          className="box-pad-h-m box-pad-v"
        >
          <div className="fit-container fx-scattered box-marg-s sticky">
            <h3>Smart widget</h3>
            <div className="fx-centered">
              {preview && (
                <div
                  className="round-icon-small round-icon-tooltip"
                  data-tooltip="Edit widget"
                  onClick={() => setPreview(false)}
                >
                  <div className="edit"></div>
                </div>
              )}
              {!preview && (
                <div
                  className="round-icon-small round-icon-tooltip"
                  data-tooltip="Preview widget"
                  onClick={() => setPreview(true)}
                >
                  <div className="eye-opened"></div>
                </div>
              )}
              <button className="btn btn-normal btn-small" onClick={postWidget}>
                Post my widget
              </button>
            </div>
          </div>
          <div
            className="box-pad-h-m box-pad-v-m sc-s-18 fx-centered fx-col"
            style={{
              backgroundColor: mainContainerBackgroundColor,
              borderColor: mainContainerBorderColor,
              overflow: "visible",
            }}
          >
            {componentsTree.map((com, index) => {
              if (!preview)
                return (
                  <EditContainer
                    key={com.id}
                    metadata={com}
                    showComponents={(data) => {
                      setSelectedContainer(data);
                      setShowComponents(true);
                    }}
                    addContainer={(containerId) =>
                      handleAddContainer(containerId)
                    }
                    selectedContainer={selectedContainer}
                    handleContainerOps={handleContainerOps}
                    selectedLayer={selectedLayer}
                    setSelectedLayer={(contData, layerData) => {
                      setSelectedContainer(contData);
                      setSelectedLayer(layerData);
                    }}
                    totalContainers={componentsTree.length}
                    index={index}
                  />
                );
              if (preview)
                return <PreviewContainer key={com.id} metadata={com} />;
            })}
          </div>
        </div>
        <div
          style={{
            width: "min(100%,400px)",
            height: "100vh",
            overflow: "scroll",
            padding: "1rem",
            borderLeft: "1px solid var(--pale-gray)",
          }}
          className="box-pad-h-m box-pad-v sticky"
        >
          <div className="fit-container fx-scattered">
            <h4 className="orange-c box-marg-s fit-container">Customize</h4>
            {/* <div className="arrow"></div> */}
          </div>
          {/* <hr style={{margin: "1rem auto"}}/> */}
          <div className="fit-container fx-centered fx-col fx-start-v box-pad-v-s">
            <p className="gray-c p-medium">Main widget container</p>
            <div className="fx-scattered fit-container">
              <p>Background color</p>
              <div className="fx-centered">
                <label
                  htmlFor="bg-color"
                  className="pointer"
                  style={{ position: "relative" }}
                >
                  <input
                    type="color"
                    name="bg-color"
                    id="bg-color"
                    style={{
                      opacity: 0,
                      position: "absolute",
                      right: 0,
                      top: 0,
                      zIndex: -1,
                    }}
                    onChange={(e) =>
                      setMainContainerBackgroundColor(e.target.value)
                    }
                  />
                  <div
                    className="round-icon-small"
                    style={{
                      // maxWidth: "24px",
                      // maxHeight: "24px",
                      backgroundColor: mainContainerBackgroundColor,
                      position: "relative",
                      zIndex: 2,
                    }}
                  ></div>
                </label>
                {mainContainerBackgroundColor && (
                  <div
                    className="round-icon-small"
                    onClick={() => setMainContainerBackgroundColor("")}
                  >
                    <div className="trash"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="fx-scattered fit-container">
              <p>Border color</p>
              <div className="fx-centered">
                <label
                  htmlFor="b-color"
                  className="pointer"
                  style={{ position: "relative" }}
                >
                  <input
                    type="color"
                    name="b-color"
                    id="b-color"
                    style={{
                      opacity: 0,
                      position: "absolute",
                      right: 0,
                      top: 0,
                      zIndex: -1,
                    }}
                    onChange={(e) =>
                      setMainContainerBorderColor(e.target.value)
                    }
                  />
                  <div
                    className="round-icon-small"
                    style={{
                      // maxWidth: "24px",
                      // maxHeight: "24px",
                      backgroundColor: mainContainerBorderColor,
                      position: "relative",
                      zIndex: 2,
                    }}
                  ></div>
                </label>
                {mainContainerBorderColor && (
                  <div
                    className="round-icon-small"
                    onClick={() => setMainContainerBorderColor("")}
                  >
                    <div className="trash"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {selectedLayer && (
            <div className="fit-container fx-centered fx-col fx-start-v box-pad-v-s">
              <p className="gray-c p-medium">
                Customize this {selectedLayer.type.replace("-", " ")}
              </p>
              <CustomizeComponent
                metadata={selectedLayer}
                handleComponentMetadata={handleSelectedLayerMetadata}
              />
            </div>
          )}
          <div className="box-pad-v-m"></div>
          <div className="fit-container fx-scattered">
            <h4 className="orange-c">Layers</h4>
          </div>
          <div className="fit-container fx-centered fx-col fx-start-v box-pad-v-m">
            {componentsTree.map((comp, index) => {
              return (
                <div className="fit-container fx-centered fx-col" key={comp.id}>
                  <div
                    className="fit-container fx-scattered sc-s"
                    style={{
                      borderColor:
                        selectedContainer?.id === comp.id ? "var(--black)" : "",
                      padding: ".5rem",
                      borderRadius: "var(--border-r-6)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <div className="fx-centered fx-start-h">
                      <div className="container-one-24"></div>
                      <p>Container</p>
                    </div>
                    {componentsTree.length > 1 && (
                      <div
                        className="trash"
                        onClick={() => handleDeleteContainer(index)}
                      ></div>
                    )}
                  </div>
                  <div className="fit-container fx-scattered">
                    <div style={{ minWidth: "16px" }}></div>
                    <div className="fit-container fx-centered fx-col">
                      {comp.left_side.map((innerComp, compIndex) => {
                        return (
                          <div
                            className="fit-container fx-scattered sc-s pointer"
                            style={{
                              borderColor:
                                selectedLayer?.id === innerComp.id
                                  ? "var(--orange-main)"
                                  : "",
                              padding: ".5rem",
                              borderRadius: "var(--border-r-6)",
                              backgroundColor: "transparent",
                            }}
                            key={innerComp.id}
                            onClick={() => {
                              setSelectedContainer(comp);
                              setSelectedLayer(innerComp);
                            }}
                          >
                            <div className="fx-centered fx-start-h">
                              <div className={`${innerComp.type}-24`}></div>
                              <p>{innerComp.type}</p>
                            </div>
                            <div
                              className="trash"
                              onClick={() =>
                                handleDeleteComponent(index, compIndex, "left")
                              }
                            ></div>
                          </div>
                        );
                      })}
                      {comp.right_side &&
                        comp.right_side.map((innerComp, compIndex) => {
                          return (
                            <div
                              className="fit-container fx-scattered sc-s pointer"
                              style={{
                                borderColor:
                                  selectedLayer?.id === innerComp.id
                                    ? "var(--orange-main)"
                                    : "",
                                padding: ".5rem",
                                borderRadius: "var(--border-r-6)",
                                backgroundColor: "transparent",
                              }}
                              key={innerComp.id}
                              onClick={() => {
                                setSelectedContainer(comp);
                                setSelectedLayer(innerComp);
                              }}
                            >
                              <div className="fx-centered fx-start-h">
                                <div className={`${innerComp.type}-24`}></div>
                                <p>{innerComp.type}</p>
                              </div>
                              <div
                                className="trash"
                                onClick={() =>
                                  handleDeleteComponent(
                                    index,
                                    compIndex,
                                    "right"
                                  )
                                }
                              ></div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const EditContainer = ({
  metadata,
  showComponents,
  addContainer,
  selectedContainer,
  handleContainerOps,
  selectedLayer,
  setSelectedLayer,
  totalContainers,
  index,
}) => {
  const optionsRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const isMonoLayoutRequired = ["video", "zap-poll"].includes(
    metadata.left_side[0]?.type
  );

  useEffect(() => {
    let handleOffClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  return (
    <div className="fx-centered fx-col fit-container">
      <div className="fx-scattered fx-stretch fit-container sw-container">
        <div
          className="fx-centered fit-container fx-start-h fx-start-v fx-stretch sc-s-d box-pad-h-s box-pad-v-s"
          style={{
            borderRadius: "10px",
            borderRadius: "var(--border-r-18)",
            position: "relative",
            borderColor:
              selectedContainer?.id === metadata.id ? "var(--black)" : "",
          }}
        >
          {metadata.left_side.length === 0 && (
            <div
              className="box-pad-h-m box-pad-v-m fx-centered  pointer option"
              onClick={() => showComponents({ id: metadata.id, side: "left" })}
              style={{
                borderRadius: "10px",
                flex: metadata.division?.split(":")[0],
              }}
            >
              <div className="plus-sign" style={{ minWidth: "10px" }}></div>{" "}
              <p className="p-medium">Add component</p>
            </div>
          )}
          {metadata.left_side.length > 0 && (
            <div
              style={{ flex: metadata.division?.split(":")[0] }}
              className="fx-centered fx-col"
            >
              {metadata.left_side?.map((comp) => {
                if (comp.type === "video")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <VideoComp url={comp.metadata.url} />
                    </div>
                  );
                if (comp.type === "zap-poll")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <div
                        className="fit-container"
                        style={{ pointerEvents: "none" }}
                      >
                        <ZapPollsPreview
                          nevent={comp.metadata.nevent}
                          event={
                            comp.metadata.content
                              ? JSON.parse(comp.metadata.content)
                              : null
                          }
                          content_text_color={comp.metadata.content_text_color}
                          options_text_color={comp.metadata.options_text_color}
                          options_background_color={
                            comp.metadata.options_background_color
                          }
                          options_foreground_color={
                            comp.metadata.options_foreground_color
                          }
                        />
                      </div>
                    </div>
                  );
                if (comp.type === "image")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <ImgComp
                        url={comp.metadata.url}
                        aspectRatio={comp.metadata.aspect_ratio}
                      />
                    </div>
                  );
                if (comp.type === "text")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <TextComp
                        content={comp.metadata.content}
                        size={comp.metadata.size}
                        weight={comp.metadata.weight}
                        textColor={comp.metadata.text_color}
                      />
                    </div>
                  );
                if (comp.type === "button")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <div
                        className="fit-container"
                        style={{ pointerEvents: "none" }}
                      >
                        <ButtonComp
                          content={comp.metadata.content}
                          textColor={comp.metadata.text_color}
                          url={comp.metadata.url}
                          backgroundColor={comp.metadata.background_color}
                          type={comp.metadata.type}
                        />
                      </div>
                    </div>
                  );
              })}
              {metadata.layout === 2 && (
                <div
                  style={{
                    height: "32px",
                    borderRadius: "var(--border-r-6)",
                    backgroundColor: "var(--pale-gray)",
                  }}
                  className={`fx-centered fit-container option pointer`}
                  onClick={() =>
                    showComponents({ id: metadata.id, side: "left" })
                  }
                >
                  <div className="plus-sign"></div>
                </div>
              )}
            </div>
          )}
          {metadata.layout === 2 && metadata.right_side.length > 0 && (
            <div
              style={{
                flex: metadata.division?.split(":")[1],
                position: "relative",
              }}
              className="fx-centered fx-col"
            >
              {/* <div
                className="round-icon-small round-icon-tooltip"
                data-tooltip="Switch sections"
                onClick={() =>
                  handleContainerOps("switch sections", {
                    ...metadata,
                    index,
                  })
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "0",
                  transform: "translateY(-50%)",
                }}
              >
                <div className="switch-arrows"></div>
              </div> */}

              {metadata.right_side?.map((comp) => {
                if (comp.type === "video")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      onClick={() => setSelectedLayer(metadata, comp)}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                    >
                      <VideoComp url={comp.metadata.url} />
                    </div>
                  );
                if (comp.type === "image")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      onClick={() => setSelectedLayer(metadata, comp)}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                    >
                      <ImgComp
                        url={comp.metadata.url}
                        aspectRatio={comp.metadata.aspect_ratio}
                      />
                    </div>
                  );
                if (comp.type === "text")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      onClick={() => setSelectedLayer(metadata, comp)}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                    >
                      <TextComp
                        content={comp.metadata.content}
                        size={comp.metadata.size}
                        weight={comp.metadata.weight}
                        textColor={comp.metadata.text_color}
                      />
                    </div>
                  );
                if (comp.type === "button")
                  return (
                    <div
                      className="sc-s-d pointer fit-container box-pad-h-s box-pad-v-s"
                      key={comp.id}
                      style={{
                        borderRadius: "14px",
                        borderColor:
                          selectedLayer && selectedLayer.id === comp.id
                            ? "var(--orange-main)"
                            : "",
                      }}
                      onClick={() => setSelectedLayer(metadata, comp)}
                    >
                      <div
                        className="fit-container"
                        style={{ pointerEvents: "none" }}
                      >
                        <ButtonComp
                          content={comp.metadata.content}
                          textColor={comp.metadata.text_color}
                          url={comp.metadata.url}
                          backgroundColor={comp.metadata.background_color}
                          type={comp.metadata.type}
                        />
                      </div>
                    </div>
                  );
              })}
              <div
                style={{
                  height: "32px",
                  borderRadius: "var(--border-r-6)",
                  backgroundColor: "var(--pale-gray)",
                }}
                className={`fx-centered fit-container option pointer`}
                onClick={() =>
                  showComponents({ id: metadata.id, side: "right" })
                }
              >
                <div className="plus-sign"></div>
              </div>
            </div>
          )}
          {metadata.layout === 2 && metadata.right_side.length === 0 && (
            <div
              className=" fx-centered  pointer option"
              onClick={() => showComponents({ id: metadata.id, side: "right" })}
              style={{
                borderRadius: "10px",
                flex: metadata.division?.split(":")[1],
              }}
            >
              <div className="plus-sign" style={{ minWidth: "10px" }}></div>{" "}
              <p className="p-medium">Add component</p>
            </div>
          )}
          {metadata.layout === 2 && (
            <div
              className="round-icon-small round-icon-tooltip"
              data-tooltip="Switch sections"
              onClick={() =>
                handleContainerOps("switch sections", {
                  ...metadata,
                  index,
                })
              }
              style={{
                position: "absolute",
                top: "50%",
                left:
                  metadata.division === "1:1"
                    ? "50%"
                    : `${parseInt(metadata.division?.split(":")[0]) * 33}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="switch-arrows"></div>
            </div>
          )}
        </div>
        <div className="fx-scattered fx-col">
          {totalContainers > 1 && (
            <div
              className={`round-icon-small round-icon-tooltip ${
                index === 0 ? "if-disabled" : ""
              }`}
              data-tooltip="Move up"
              style={{ zIndex: 5 }}
              onClick={() =>
                index === 0
                  ? null
                  : handleContainerOps("move up", {
                      ...metadata,
                      index,
                    })
              }
            >
              <div
                className="arrow"
                style={{ rotate: "180deg", cursor: "unset" }}
              ></div>
            </div>
          )}
          <div
            className="fit-height"
            style={{ position: "relative" }}
            ref={optionsRef}
          >
            <div
              style={{
                width: "32px",
                minHeight: "32px",
                borderRadius: "var(--border-r-6)",
                backgroundColor: "var(--pale-gray)",
                cursor: isMonoLayoutRequired ? "not-allowed" : "pointer",
                zIndex: 4,
              }}
              className="fx-centered option pointer fit-height round-icon-tooltip"
              data-tooltip={isMonoLayoutRequired ? "Only Mono layout" : ""}
              onClick={() =>
                !isMonoLayoutRequired
                  ? metadata.layout === 1
                    ? handleContainerOps("change section", {
                        ...metadata,
                        layout: 2,
                      })
                    : setShowOptions(!showOptions)
                  : null
              }
            >
              {metadata.layout === 1 && (
                <div
                  className="plus-sign"
                  style={{ opacity: isMonoLayoutRequired ? 0.5 : 1 }}
                ></div>
              )}
              {metadata.layout === 2 && (
                <div
                  className="write"
                  style={{ minWidth: "14px", minWidth: "14px" }}
                ></div>
              )}
            </div>
            {showOptions && (
              <div
                className="fx-centered fx-col sc-s-18  box-pad-v-s fx-start-v"
                style={{
                  width: "180px",
                  backgroundColor: "var(--c1-side)",
                  position: "absolute",
                  right: "0",
                  top: "calc(100% + 5px)",
                  rowGap: 0,
                  overflow: "visible",
                  zIndex: 100,
                }}
              >
                <p className="p-medium gray-c box-pad-h-m box-pad-v-s">
                  Choose a layout
                </p>
                <div
                  className="option-no-scale fit-container fx-scattered fx-start-h sc-s-18 pointer box-pad-h-m box-pad-v-s"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    handleContainerOps("change section", {
                      ...metadata,
                      layout: 1,
                      division: "1:1",
                    });
                  }}
                  style={{
                    border: "none",
                    overflow: "visible",
                  }}
                >
                  <div className="container-one-24"></div>
                  <p className="p-medium">Mono layout</p>
                </div>

                <div
                  className="option-no-scale fit-container fx-scattered fx-start-h sc-s-18 pointer box-pad-h-m box-pad-v-s"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    handleContainerOps("change section", {
                      ...metadata,
                      layout: 2,
                      division: "1:1",
                    });
                  }}
                  style={{
                    border: "none",
                    overflow: "visible",
                    backgroundColor:
                      metadata.division === "1:1" ? "var(--pale-gray)" : "",
                  }}
                >
                  <div className="container-one-one-24"></div>
                  <p className="p-medium">1:1</p>
                </div>
                <div
                  className="option-no-scale fit-container fx-scattered fx-start-h sc-s-18 pointer box-pad-h-m box-pad-v-s"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    handleContainerOps("change section", {
                      ...metadata,
                      layout: 2,
                      division: "1:2",
                    });
                  }}
                  style={{
                    border: "none",
                    overflow: "visible",
                    backgroundColor:
                      metadata.division === "1:2" ? "var(--pale-gray)" : "",
                  }}
                >
                  <div className="container-one-two-24"></div>
                  <p className="p-medium">1:2</p>
                </div>
                <div
                  className="option-no-scale fit-container fx-scattered fx-start-h sc-s-18 pointer box-pad-h-m box-pad-v-s"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    handleContainerOps("change section", {
                      ...metadata,
                      layout: 2,
                      division: "2:1",
                    });
                  }}
                  style={{
                    border: "none",
                    overflow: "visible",
                    backgroundColor:
                      metadata.division === "2:1" ? "var(--pale-gray)" : "",
                  }}
                >
                  <div className="container-two-one-24"></div>
                  <p className="p-medium">2:1</p>
                </div>
              </div>
            )}
          </div>
          {totalContainers > 1 && (
            <>
              <div
                className="round-icon-small round-icon-tooltip"
                data-tooltip="Delete section"
                style={{ zIndex: 3 }}
                onClick={() =>
                  handleContainerOps("delete", {
                    ...metadata,
                    index,
                  })
                }
              >
                <div className="trash"></div>
              </div>
              <div
                className={`round-icon-small round-icon-tooltip ${
                  index + 1 === totalContainers ? "if-disabled" : ""
                }`}
                data-tooltip="Move down"
                style={{ zIndex: 2 }}
                onClick={() =>
                  index + 1 === totalContainers
                    ? null
                    : handleContainerOps("move down", {
                        ...metadata,
                        index,
                      })
                }
              >
                <div className="arrow" style={{ cursor: "unset" }}></div>
              </div>
            </>
          )}
        </div>
      </div>
      <div
        style={{
          height: "32px",
          borderRadius: "var(--border-r-6)",
          backgroundColor: "var(--pale-gray)",
        }}
        className={`fx-centered fit-container option pointer ${
          metadata.left_side?.length > 0 || metadata.right_side?.length > 0
            ? ""
            : "if-disabled"
        }`}
        onClick={() =>
          metadata.left_side?.length > 0 || metadata.right_side?.length > 0
            ? addContainer(metadata.id)
            : null
        }
      >
        <div className="plus-sign"></div>
      </div>
    </div>
  );
};

const PreviewContainer = ({ metadata }) => {
  return (
    <div className="fx-centered fx-col fit-container">
      <div
        className="fx-centered fit-container fx-start-h fx-start-v fx-stretch"
        style={{ gap: "16px" }}
      >
        {metadata.left_side.length === 0 && (
          <div
            style={{ flex: metadata.division?.split(":")[0] }}
            className="fx-centered fx-col"
          ></div>
        )}
        {metadata.left_side.length > 0 && (
          <div
            style={{ flex: metadata.division?.split(":")[0] }}
            className="fx-centered fx-col"
          >
            {metadata.left_side?.map((comp) => {
              if (comp.type === "video")
                return <VideoComp url={comp.metadata.url} key={comp.id} />;

              if (comp.type === "zap-poll")
                return (
                  <ZapPollsPreview
                    nevent={comp.metadata.nevent}
                    event={
                      comp.metadata.content
                        ? JSON.parse(comp.metadata.content)
                        : null
                    }
                    content_text_color={comp.metadata.content_text_color}
                    options_text_color={comp.metadata.options_text_color}
                    options_background_color={
                      comp.metadata.options_background_color
                    }
                    options_foreground_color={
                      comp.metadata.options_foreground_color
                    }
                  />
                );
              if (comp.type === "image")
                return (
                  <ImgComp
                    url={comp.metadata.url}
                    aspectRatio={comp.metadata.aspect_ratio}
                    key={comp.id}
                  />
                );
              if (comp.type === "text")
                return (
                  <TextComp
                    content={comp.metadata.content}
                    size={comp.metadata.size}
                    weight={comp.metadata.weight}
                    textColor={comp.metadata.text_color}
                    key={comp.id}
                  />
                );
              if (comp.type === "button")
                return (
                  <ButtonComp
                    content={comp.metadata.content}
                    textColor={comp.metadata.text_color}
                    url={comp.metadata.url}
                    backgroundColor={comp.metadata.background_color}
                    type={comp.metadata.type}
                    key={comp.id}
                  />
                );
            })}
          </div>
        )}
        {metadata.layout === 2 && metadata.right_side.length > 0 && (
          <div
            style={{ flex: metadata.division?.split(":")[1] }}
            className="fx-centered fx-col"
          >
            {metadata.right_side?.map((comp) => {
              if (comp.type === "video")
                return <VideoComp url={comp.metadata.url} key={comp.id} />;
              if (comp.type === "image")
                return (
                  <ImgComp
                    url={comp.metadata.url}
                    aspectRatio={comp.metadata.aspect_ratio}
                    key={comp.id}
                  />
                );
              if (comp.type === "text")
                return (
                  <TextComp
                    content={comp.metadata.content}
                    size={comp.metadata.size}
                    weight={comp.metadata.weight}
                    textColor={comp.metadata.text_color}
                    key={comp.id}
                  />
                );
              if (comp.type === "button")
                return (
                  <ButtonComp
                    content={comp.metadata.content}
                    textColor={comp.metadata.text_color}
                    url={comp.metadata.url}
                    backgroundColor={comp.metadata.background_color}
                    type={comp.metadata.type}
                    key={comp.id}
                  />
                );
            })}
          </div>
        )}
        {metadata.layout === 2 && metadata.right_side.length === 0 && (
          <div
            style={{ flex: metadata.division?.split(":")[1] }}
            className="fx-centered fx-col"
          ></div>
        )}
      </div>
    </div>
  );
};

const Components = ({ exit, addComp, isMonoLayout }) => {
  return (
    <div className="fixed-container box-pad-h fx-centered" onClick={exit}>
      <div
        className="sc-s-18 box-pad-h box-pad-v"
        style={{
          width: "min(100%, 400px)",
          position: "relative",
          overflow: "visible",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="box-marg-s">Components</h4>
        <div className="fx-centered fx-start-h fx-wrap">
          <div
            className="fx-centered fx-col sc-s-18 box-pad-h-m box-pad-v-m option pointer"
            style={{ width: "48%" }}
            onClick={() => addComp("image")}
          >
            <div
              style={{ width: "32px", height: "32px" }}
              className="image-24"
            ></div>
            <p className="gray-c p-medium">Image</p>
          </div>
          <div
            className="fx-centered fx-col sc-s-18 box-pad-h-m box-pad-v-m option pointer"
            style={{ width: "48%" }}
            onClick={() => addComp("button")}
          >
            <div
              style={{ width: "32px", height: "32px" }}
              className="button-24"
            ></div>
            <p className="gray-c p-medium">Button</p>
          </div>
          <div
            className={`fx-centered fx-col round-icon-tooltip sc-s-18 box-pad-h-m box-pad-v-m option pointer ${
              !isMonoLayout ? "if-disabled" : ""
            }`}
            style={{ width: "48%", overflow: "visible" }}
            data-tooltip={isMonoLayout ? "" : "Mono layout is required"}
            onClick={() => (isMonoLayout ? addComp("video") : null)}
          >
            <div
              style={{ width: "32px", height: "32px" }}
              className="play-24"
            ></div>
            <p className="gray-c p-medium">Video</p>
          </div>
          <div
            className="fx-centered fx-col sc-s-18 box-pad-h-m box-pad-v-m option pointer"
            style={{ width: "48%" }}
            onClick={() => addComp("text")}
          >
            <div
              style={{ width: "32px", height: "32px" }}
              className="text-24"
            ></div>
            <p className="gray-c p-medium">Text</p>
          </div>
          <div
            className={`fx-centered fx-col round-icon-tooltip sc-s-18 box-pad-h-m box-pad-v-m option pointer ${
              !isMonoLayout ? "if-disabled" : ""
            }`}
            style={{ width: "48%", overflow: "visible" }}
            data-tooltip={isMonoLayout ? "" : "Mono layout is required"}
            onClick={() => (isMonoLayout ? addComp("zap-poll") : null)}
          >
            <div
              style={{ width: "32px", height: "32px" }}
              className="polls-24"
            ></div>
            <p className="gray-c p-medium">Zap poll</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoComp = ({ url = "" }) => {
  return <div className="fit-container">{getVideoFromURL(url)}</div>;
};

const ImgComp = ({ url = "", aspectRatio }) => {
  return (
    <div className="fit-container">
      <div
        className="sc-s-18 fit-container bg-img cover-bg fx-centered"
        style={{
          aspectRatio: aspectRatio.startsWith("16") ? "16/9" : "1/1",
          backgroundImage: `url(${url})`,

          border: "none",
        }}
      >
        {!url && <div className="image-24"></div>}
      </div>
    </div>
  );
};

const TextComp = ({ content = "", size, weight, textColor }) => {
  const getTextSize = () => {
    if (!size) return "";
    if (size === "h1") return "h2-txt p-bold";
    if (size === "h2") return "h3-txt p-bold";
    if (size === "regular") return "";
    if (size === "small") return "p-medium";
  };
  const getTextWeight = () => {
    if (!weight) return "";
    if (weight === "regular") return "";
    if (weight === "bold") return "p-bold";
  };

  const textSize = getTextSize();
  const textWeight = getTextWeight();

  return (
    <div className="fit-container">
      <div className="fit-container fx-start-h fx-centered">
        <p className={`${textSize} ${textWeight}`} style={{ color: textColor }}>
          {content}
        </p>
      </div>
    </div>
  );
};

const ButtonComp = ({ content, textColor, url, backgroundColor, type }) => {
  const getUrl = () => {
    if (!type) return "/";
    if (["regular", "youtube", "discord", "x", "telegram"].includes(type))
      return url;
    if (type === "zap") return false;
  };
  const getButtonColor = () => {
    if (!type || type === "regular" || type === "zap")
      return { color: textColor, backgroundColor };
    if (type === "youtube")
      return { color: "white", backgroundColor: "#FF0000" };
    if (type === "discord")
      return { color: "white", backgroundColor: "#7785cc" };
    if (type === "x") return { color: "white", backgroundColor: "#000000" };
    if (type === "telegram")
      return { color: "white", backgroundColor: "#24A1DE" };
  };

  const buttonUrl = getUrl();
  const buttonColor = getButtonColor();

  if (buttonUrl !== false)
    return (
      <a className="fit-container" href={buttonUrl} target="_blank">
        <button
          className="btn btn-normal btn-full fx-centered"
          style={buttonColor}
          to={buttonUrl}
        >
          {type === "youtube" && <div className="youtube-logo"></div>}
          {type === "discord" && <div className="discord-logo"></div>}
          {type === "x" && <div className="twitter-w-logo"></div>}
          {type === "telegram" && <div className="telegram-b-logo"></div>}
          {content}
        </button>
      </a>
    );
  return (
    <button
      className="btn btn-normal btn-full"
      style={{ color: textColor, backgroundColor }}
      to={buttonUrl}
    >
      {content}
    </button>
  );
};

const CustomizeComponent = ({ metadata, handleComponentMetadata }) => {
  const { nostrUser } = useContext(Context);
  const [showAddPoll, setShowAddPoll] = useState(false);

  const handleMetadata = (key, value) => {
    let tempMetadata = {
      ...metadata,
      metadata: { ...metadata.metadata, [key]: value },
    };
    handleComponentMetadata(tempMetadata);
  };

  useEffect(() => {
    if (metadata.type === "zap-poll") {
      let relaysToUse = filterRelays(nostrUser?.relays || [], relaysOnPlatform);
      let id;
      try {
        id = nip19.decode(metadata.metadata.nevent).data.id;
      } catch (err) {
        console.log(err);
      }
      if (!id) return;
      const sub = pool.subscribeMany(
        relaysToUse,
        [{ kinds: [6969], ids: [id] }],
        {
          async onevent(event) {
            try {
              console.log(event);
              handleMetadata("content", JSON.stringify(event));
            } catch (err) {
              console.log(err);
            }
          },
          oneose() {
            sub.close();
            pool.close(relaysToUse);
          },
        }
      );
    }
  }, [metadata]);

  if (metadata.type === "image")
    return (
      <div className="fit-container fx-centered fx-col fx-start-v">
        <div className="fit-container fx-scattered">
          <input
            type="text"
            placeholder="URL"
            className="if ifs-full"
            value={metadata.metadata.url}
            onChange={(e) => handleMetadata("url", e.target.value)}
          />
          <UploadFile
            round={true}
            setImageURL={(url) => handleMetadata("url", url)}
            setFileMetadata={() => null}
            setIsUploadsLoading={() => null}
          />
        </div>
        <div className="fit-container fx-scattered">
          <p>Aspect ratio</p>
          <select
            className="if"
            onChange={(e) => handleMetadata("aspect_ratio", e.target.value)}
            value={metadata.metadata.aspect_ratio}
          >
            <option value="16:9">16:9</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
      </div>
    );

  if (metadata.type === "video")
    return (
      <div className="fit-container fx-centered fx-col fx-start-v">
        <div className="fit-container fx-scattered">
          <input
            type="text"
            placeholder="URL"
            className="if ifs-full"
            value={metadata.metadata.url}
            onChange={(e) => handleMetadata("url", e.target.value)}
          />
          <UploadFile
            round={true}
            setImageURL={(url) => handleMetadata("url", url)}
            setFileMetadata={() => null}
            setIsUploadsLoading={() => null}
          />
        </div>
      </div>
    );

  if (metadata.type === "text")
    return (
      <div className="fit-container fx-centered fx-col fx-start-v">
        <div className="fit-container fx-scattered">
          <input
            type="text"
            placeholder="Content"
            className="if ifs-full"
            value={metadata.metadata.content}
            onChange={(e) => handleMetadata("content", e.target.value)}
          />
        </div>
        <div className="fit-container fx-scattered">
          <p>Size</p>
          <select
            className="if"
            onChange={(e) => handleMetadata("size", e.target.value)}
            value={metadata.metadata.size}
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="regular">Regular body</option>
            <option value="small">Small body</option>
          </select>
        </div>
        <div className="fit-container fx-scattered">
          <p>Weight</p>
          <select
            className="if"
            onChange={(e) => handleMetadata("weight", e.target.value)}
            value={metadata.metadata.weight}
          >
            <option value="regular">Regular</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div className="fx-scattered fit-container">
          <p>Text color</p>
          <div className="fx-centered">
            <label
              htmlFor="text-color"
              className="pointer"
              style={{ position: "relative" }}
            >
              <input
                type="color"
                name="text-color"
                id="text-color"
                style={{
                  opacity: 0,
                  position: "absolute",
                  right: 0,
                  top: 0,
                  zIndex: -1,
                }}
                value={metadata.metadata.text_color}
                onChange={(e) => handleMetadata("text_color", e.target.value)}
              />
              <div
                className="round-icon-small"
                style={{
                  backgroundColor: metadata.metadata.text_color,
                  position: "relative",
                  zIndex: 2,
                }}
              ></div>
            </label>
            {metadata.metadata.text_color && (
              <div
                className="round-icon-small"
                onClick={() => handleMetadata("text_color", "")}
              >
                <div className="trash"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  if (metadata.type === "button")
    return (
      <div className="fit-container fx-centered fx-col fx-start-v">
        <div className="fit-container fx-scattered">
          <input
            type="text"
            placeholder="Content"
            className="if ifs-full"
            value={metadata.metadata.content}
            onChange={(e) => handleMetadata("content", e.target.value)}
          />
        </div>
        <div className="fit-container fx-centered fx-col">
          <input
            type="text"
            placeholder={
              metadata.metadata.type === "zap"
                ? "Invoice / Lightning address"
                : "URL"
            }
            className="if ifs-full"
            value={metadata.metadata.url}
            onChange={(e) => handleMetadata("url", e.target.value)}
          />
          {metadata.metadata.type === "zap" && (
            <p className="gray-c p-medium">
              Generate an invoice in the{" "}
              <a href="/wallet" className="orange-c" target="_blank">
                wallet page
              </a>
            </p>
          )}
        </div>
        <div
          className="fx-scattered fit-container"
          style={{
            pointerEvents: !["regular", "zap"].includes(metadata.metadata.type)
              ? "none"
              : "",
            opacity: !["regular", "zap"].includes(metadata.metadata.type)
              ? 0.7
              : 1,
          }}
        >
          <p>Background color</p>
          <div className="fx-centered">
            <label
              htmlFor="btn-bg-color"
              className="pointer"
              style={{ position: "relative" }}
            >
              <input
                type="color"
                name="btn-bg-color"
                id="btn-bg-color"
                style={{
                  opacity: 0,
                  position: "absolute",
                  right: 0,
                  top: 0,
                  zIndex: -1,
                }}
                value={metadata.metadata.background_color}
                onChange={(e) =>
                  handleMetadata("background_color", e.target.value)
                }
              />
              <div
                className="round-icon-small"
                style={{
                  backgroundColor: metadata.metadata.background_color,
                  position: "relative",
                  zIndex: 2,
                }}
              ></div>
            </label>
            {metadata.metadata.background_color && (
              <div
                className="round-icon-small"
                onClick={() => handleMetadata("background_color", "")}
              >
                <div className="trash"></div>
              </div>
            )}
          </div>
        </div>
        <div
          className="fx-scattered fit-container"
          style={{
            pointerEvents: !["regular", "zap"].includes(metadata.metadata.type)
              ? "none"
              : "",
            opacity: !["regular", "zap"].includes(metadata.metadata.type)
              ? 0.7
              : 1,
          }}
        >
          <p>Text color</p>
          <div className="fx-centered">
            <label
              htmlFor="btn-text-color"
              className="pointer"
              style={{ position: "relative" }}
            >
              <input
                type="color"
                name="btn-text-color"
                id="btn-text-color"
                style={{
                  opacity: 0,
                  position: "absolute",
                  right: 0,
                  top: 0,
                  zIndex: -1,
                }}
                value={metadata.metadata.text_color}
                onChange={(e) => handleMetadata("text_color", e.target.value)}
              />
              <div
                className="round-icon-small"
                style={{
                  backgroundColor: metadata.metadata.text_color,
                  position: "relative",
                  zIndex: 2,
                }}
              ></div>
            </label>
            {metadata.metadata.text_color && (
              <div
                className="round-icon-small"
                onClick={() => handleMetadata("text_color", "")}
              >
                <div className="trash"></div>
              </div>
            )}
          </div>
        </div>

        <div className="fit-container fx-scattered">
          <p>Button type</p>
          <select
            className="if"
            onChange={(e) => handleMetadata("type", e.target.value)}
            value={metadata.metadata.type}
          >
            <option value="regular">Regular</option>
            <option value="zap">Zap</option>
            <option value="youtube">Youtube</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="x">X</option>
          </select>
        </div>
      </div>
    );

  if (metadata.type === "zap-poll")
    return (
      <>
        {showAddPoll && (
          <AddPoll
            exit={() => setShowAddPoll(false)}
            setNevent={(data) => {
              handleMetadata("nevent", data);
              setShowAddPoll(false);
            }}
          />
        )}
        <div className="fit-container fx-centered fx-col fx-start-v">
          <div className="fit-container fx-scattered">
            <input
              type="text"
              placeholder="nEvent"
              className="if ifs-full"
              value={metadata.metadata.nevent}
              onChange={(e) => handleMetadata("nevent", e.target.value)}
            />
            <div
              className="round-icon round-icon-tooltip"
              data-tooltip="Add poll"
              onClick={() => setShowAddPoll(true)}
            >
              <div className="plus-sign"></div>
            </div>
          </div>
          <div className="fx-scattered fit-container">
            <p>Content text color</p>
            <div className="fx-centered">
              <label
                htmlFor="content_text_color"
                className="pointer"
                style={{ position: "relative" }}
              >
                <input
                  type="color"
                  name="content_text_color"
                  id="content_text_color"
                  style={{
                    opacity: 0,
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: -1,
                  }}
                  value={metadata.metadata.content_text_color}
                  onChange={(e) =>
                    handleMetadata("content_text_color", e.target.value)
                  }
                />
                <div
                  className="round-icon-small"
                  style={{
                    backgroundColor: metadata.metadata.content_text_color,
                    position: "relative",
                    zIndex: 2,
                  }}
                ></div>
              </label>
              {metadata.metadata.content_text_color && (
                <div
                  className="round-icon-small"
                  onClick={() => handleMetadata("content_text_color", "")}
                >
                  <div className="trash"></div>
                </div>
              )}
            </div>
          </div>
          <div className="fx-scattered fit-container">
            <p>Options text color</p>
            <div className="fx-centered">
              <label
                htmlFor="options_text_color"
                className="pointer"
                style={{ position: "relative" }}
              >
                <input
                  type="color"
                  name="options_text_color"
                  id="options_text_color"
                  style={{
                    opacity: 0,
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: -1,
                  }}
                  value={metadata.metadata.options_text_color}
                  onChange={(e) =>
                    handleMetadata("options_text_color", e.target.value)
                  }
                />
                <div
                  className="round-icon-small"
                  style={{
                    backgroundColor: metadata.metadata.options_text_color,
                    position: "relative",
                    zIndex: 2,
                  }}
                ></div>
              </label>
              {metadata.metadata.options_text_color && (
                <div
                  className="round-icon-small"
                  onClick={() => handleMetadata("options_text_color", "")}
                >
                  <div className="trash"></div>
                </div>
              )}
            </div>
          </div>
          <div className="fx-scattered fit-container">
            <p>Options background color</p>
            <div className="fx-centered">
              <label
                htmlFor="options_background_color"
                className="pointer"
                style={{ position: "relative" }}
              >
                <input
                  type="color"
                  name="options_background_color"
                  id="options_background_color"
                  style={{
                    opacity: 0,
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: -1,
                  }}
                  value={metadata.metadata.options_background_color}
                  onChange={(e) =>
                    handleMetadata("options_background_color", e.target.value)
                  }
                />
                <div
                  className="round-icon-small"
                  style={{
                    backgroundColor: metadata.metadata.options_background_color,
                    position: "relative",
                    zIndex: 2,
                  }}
                ></div>
              </label>
              {metadata.metadata.options_background_color && (
                <div
                  className="round-icon-small"
                  onClick={() => handleMetadata("options_background_color", "")}
                >
                  <div className="trash"></div>
                </div>
              )}
            </div>
          </div>
          <div className="fx-scattered fit-container">
            <p>Options foreground color</p>
            <div className="fx-centered">
              <label
                htmlFor="options_foreground_color"
                className="pointer"
                style={{ position: "relative" }}
              >
                <input
                  type="color"
                  name="options_foreground_color"
                  id="options_foreground_color"
                  style={{
                    opacity: 0,
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: -1,
                  }}
                  value={metadata.metadata.options_foreground_color}
                  onChange={(e) =>
                    handleMetadata("options_foreground_color", e.target.value)
                  }
                />
                <div
                  className="round-icon-small"
                  style={{
                    backgroundColor: metadata.metadata.options_foreground_color,
                    position: "relative",
                    zIndex: 2,
                  }}
                ></div>
              </label>
              {metadata.metadata.options_foreground_color && (
                <div
                  className="round-icon-small"
                  onClick={() => handleMetadata("options_foreground_color", "")}
                >
                  <div className="trash"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
};
