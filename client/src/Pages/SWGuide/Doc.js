import React, { useEffect } from "react";
import ArrowUp from "../../Components/ArrowUp";
import { Helmet } from "react-helmet";
import Sidebar from "./Sidebar";
import SearchEngine from "./SearchEngine";
import RightSidebar from "./RightSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";
import slugify from "slugify";
import { swContent } from "./content";
import { nanoid } from "nanoid";
import { copyText, straightUp } from "../../Helpers/Helpers";
import Footer from "./Footer";
import rehypeRaw from 'rehype-raw';
import { useParams } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";

export default function Doc() {
  let { keyword } = useParams();
  keyword = keyword ? keyword.toLowerCase() : "";

  const handleCopyelement = (id) => {
    const codeRef = document.getElementById(id);
    if (!codeRef) return;
    const codeText = codeRef.innerText;
    copyText(codeText, "Code is copied");
  };
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const id = hash.replace("#", "");
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
        }
      }, 100);
    } else {
      straightUp();
    }
  }, [keyword]);

  if (!swContent[keyword]) {
    window.location.pathname = "/docs/sw/intro";
    return;
  }

  return (
    <div className="fit-container">
      <Helmet>
        <title>Yakihonne | {swContent[keyword].title}</title>
        <meta name="description" content={swContent[keyword].title} />
        <meta property="og:description" content={swContent[keyword].title} />
        <meta property="og:image" content={"N/A"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta
          property="og:url"
          content={"https://yakihonne.com/docs/sw/" + keyword}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content={swContent[keyword].title} />
        <meta property="twitter:title" content={swContent[keyword].title} />
        <meta
          property="twitter:description"
          content={swContent[keyword].title}
        />
        <meta property="twitter:image" content={"N/A"} />
      </Helmet>
      <MobileNavbar page={keyword}/>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            <ArrowUp />
            <div
              className="fx-centered fit-container fx-start-h fx-start-v"
              style={{ gap: 0 }}
            >
              <div
                className="box-pad-h-m fx-col fx-centered fx-start-h fx-start-v main-middle-wide"
                style={{ gap: 0 }}
              >
                <div className="fit-container mb-hide sticky" style={{zIndex: 10}}>
                  <SearchEngine sticky={false}/>
                </div>
                <div className="fit-container  box-pad-h-s md-content">
                  <ReactMarkdown
                    children={swContent[keyword].content}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    components={{
                      h1({ node, children }) {
                        const id = slugify(String(children), {
                          lower: true,
                          strict: true,
                        });
                        return <h1 id={id}>{children}</h1>;
                      },
                      h2({ node, children }) {
                        const id = slugify(String(children), {
                          lower: true,
                          strict: true,
                        });
                        return <h2 id={id}>{children}</h2>;
                      },
                      h3({ node, children }) {
                        const id = slugify(String(children), {
                          lower: true,
                          strict: true,
                        });
                        return <h3 id={id}>{children}</h3>;
                      },
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeRef = nanoid();
                        return !inline ? (
                          <pre style={{ padding: "1rem 0" }}>
                            <div
                              className="sc-s-18 box-pad-v-s box-pad-h-m fit-container fx-scattered"
                              style={{
                                borderBottomRightRadius: 0,
                                borderBottomLeftRadius: 0,
                                position: "relative",
                                top: "0px",
                                position: "sticky",
                                border: "none",
                              }}
                            >
                              <p className="gray-c p-italic">
                                {match?.length > 0 ? match[1] : ""}
                              </p>
                              <div
                                className="copy pointer"
                                onClick={() => {
                                  handleCopyelement(codeRef);
                                }}
                              ></div>
                            </div>
                            <code
                              className={`hljs ${className}`}
                              {...props}
                              id={codeRef}
                            >
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code
                            className="inline-code"
                            {...props}
                            style={{ margin: "1rem 0" }}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  />
                </div>
                <Footer />
              </div>
              <div
                style={{
                  flex: 1,
                  border: "none",
                  paddingTop: "80px",
                }}
                className={`fx-centered  fx-wrap fx-start-v box-pad-v sticky extras-homepage`}
              >
                <RightSidebar page={keyword} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
