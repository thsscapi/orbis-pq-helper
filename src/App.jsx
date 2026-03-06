import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* -------------------------
   Weight Stage Helper config
-------------------------- */

const PROBES = [
  { id: "500", text: "Check 5-0-0", imgSrc: "/img/500.png" },
  { id: "410", text: "Check 4-1-0", imgSrc: "/img/410.png" },
  { id: "401", text: "Check 4-0-1", imgSrc: "/img/401.png" },
];

function resolveChain({ r500, r410, r401 }) {
  if (r500 == null || r410 == null || r401 == null) return null;

  if (r500 === 0 && r410 === 1) return ["311", "212", "113", "014"];

  const pattern = `${r500}${r410}${r401}`;

  const map = {
    "101": ["302", "203", "104", "005"],
    "110": ["320", "230", "140", "050"],
    "001": ["221", "131", "041"],
    "000": ["122", "023", "032"],
  };

  return map[pattern] ?? null;
}

function formatStep(step) {
  const s = String(step).padStart(3, "0");
  return `${s[0]}-${s[1]}-${s[2]}`;
}

/* -------------------------
   Accordion
-------------------------- */

function Accordion({
  title,
  isOpen,
  onToggle,
  statueIcon,
  pieceCount,
  pieceIcon,
  locked = false,
  children,
}) {
  return (
    <section className={`acc ${locked ? "locked" : ""}`}>
      <button
        className="accHeader"
        onClick={locked ? undefined : onToggle}
        type="button"
      >
        <span className="accTitle">{title}</span>

        <span className="accHeaderRight">
          {pieceCount != null && (
            <>
              <span className="pieceCount">{pieceCount}</span>
              <img className="accHeaderIcon" src={pieceIcon} alt="Stone Piece" />
            </>
          )}

          {statueIcon && (
            <img className="accHeaderIcon" src={statueIcon} alt="Statue Piece" />
          )}

          <span
            className={`accChevron ${!locked && isOpen ? "open" : ""} ${
              locked ? "hiddenChevron" : ""
            }`}
          >
            ▾
          </span>
        </span>
      </button>

      {!locked && (
        <div className={`accBody ${isOpen ? "open" : "closed"}`}>{children}</div>
      )}
    </section>
  );
}

/* -------------------------
   Server Day (UTC)
-------------------------- */

function ServerDay() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const day = useMemo(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[now.getUTCDay()];
  }, [now]);

  return (
    <div className="serverTime">
      <span className="serverTimeLabel">Current Server Day (UTC): </span>
      <span className="serverDayValue">{day}</span>
    </div>
  );
}

/* -------------------------
   Static images
-------------------------- */

const ASSETS = {
  lobbyMap: "/img/lobby.png",
  loungeMap: "/img/lounge.png",
  onTheWayUp: "/img/on-the-way-up.png",
  tower: "/img/tower.png",
};

function ImgBlock({ src, alt }) {
  return (
    <div className="imgBlock">
      <img src={src} alt={alt} className="staticImg" />
    </div>
  );
}

/* -------------------------
   Storage tracker
-------------------------- */

function StorageTracker() {
  const order = [1, 10, 9, 13, 11, 6, 12, 2, 5, 15, 8, 4, 7, 3, 14];
  const raw = order.join("-");

  const [index, setIndex] = useState(0);

  function next() {
    setIndex((i) => Math.min(i + 1, order.length));
  }

  function reset() {
    setIndex(0);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
    } catch {}
  }

  return (
    <div className="storageWrap">
      <div className="storageCopyRow">
        <input className="storageCopyInput" value={raw} readOnly name="name" id="storageInput" autoComplete="none" />
        <button className="minorBtn" onClick={copy}>Copy to clipboard</button>
      </div>

      <div className="storageSequence">
        {order.map((n, i) => (
          <span key={i} className={`storageBox ${i < index ? "done" : ""}`}>
            {n}
          </span>
        ))}
      </div>

      <div className="storageControls">
        <button className="minorBtn" onClick={next}>Next</button>
        <button className="minorBtn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

/* -------------------------
   Main App
-------------------------- */

export default function App() {

  const [sel, setSel] = useState({
    "500": null,
    "410": null,
    "401": null,
  });

  const [chainDone, setChainDone] = useState(new Set());

  const [showEakHelp, setShowEakHelp] = useState(false);

  const allSelected =
    sel["500"] != null &&
    sel["410"] != null &&
    sel["401"] != null;

  const chain = useMemo(
    () =>
      resolveChain({
        r500: sel["500"],
        r410: sel["410"],
        r401: sel["401"],
      }),
    [sel]
  );

  const patternDashed = useMemo(() => {
    if (!allSelected) return "";
    return `${sel["500"]}-${sel["410"]}-${sel["401"]}`;
  }, [allSelected, sel]);

  function setProbe(id, value) {
    setSel((prev) => ({ ...prev, [id]: value }));
    setChainDone(new Set());
  }

  function toggleChain(step) {
    setChainDone((prev) => {
      const next = new Set(prev);
      next.has(step) ? next.delete(step) : next.add(step);
      return next;
    });
  }

  const [acc, setAcc] = useState({
    lobby: false,
    lounge: false,
    sealed: true,
    storage: false,
    up: false,
    tower: false,
  });

  function toggleAcc(key) {
    setAcc((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function resetSealedRoom() {
    setSel({
      "500": null,
      "410": null,
      "401": null,
    });

    setChainDone(new Set());
  }

  const ACC_KEYS = ["lobby", "lounge", "sealed", "storage", "up", "tower"];

  const allOpen = useMemo(() => {
    return ACC_KEYS.every((k) => acc[k]);
  }, [acc]);

  function toggleAllAccordions() {
    const next = !allOpen;
    setAcc((prev) => {
      const updated = { ...prev };
      for (const k of ACC_KEYS) updated[k] = next;
      return updated;
    });
  }

  function resetApp() {
    window.location.reload();
  }

  return (
    <div className="wrap">

      <header className="appHeader">

        <h1 className="appTitle">
          Sparrow's OPQ Helper
        </h1>

        <p className="appDescription">
          A small helper tool for Orbis PQ (MapleLegends). It is designed to be a one-stop reference for leading OPQ.
        </p>

        <div className="appCredits">
          Created by: <strong>thsscapi (Sparrow)</strong>
        </div>

      </header>

      {/* Entrance */}
      <Accordion
        title="Entrance"
        locked
        pieceCount={20}
        pieceIcon="https://maplelegends.com/static/images/lib/item/04001063.png"
      />

      {/* Lobby */}
      <Accordion
        title="Lobby"
        isOpen={acc.lobby}
        onToggle={() => toggleAcc("lobby")}
        statueIcon="https://maplelegends.com/static/images/lib/item/04001046.png"
      >
        <ServerDay />
        <ImgBlock src={ASSETS.lobbyMap} alt="Lobby map" />
        <div className="legendGrid">
          <div className="legendCell icon">
            <img
              className="legendIcon"
              src="https://maplelegends.com/static/images/lib/character/01072264.png"
              alt="Silver Strap Shoes"
              loading="lazy"
            />
          </div>
          <div className="legendCell text">Minimum Jump stat required</div>

          <div className="legendCell icon">
            <img
              className="legendIcon"
              src="https://maplelegends.com/static/images/lib/skill/2101002.png"
              alt="Teleport"
              loading="lazy"
            />
          </div>
          <div className="legendCell text">Mage&apos;s Teleport skill required</div>

          <div className="legendCell icon">
            <img
              className="legendIcon"
              src="https://maplelegends.com/static/images/lib/skill/4101004.png"
              alt="Haste"
              loading="lazy"
            />
          </div>
          <div className="legendCell text">Thief&apos;s Haste or max Jump required</div>

          <div className="legendCell icon">
            <img
              className="legendIcon"
              src="https://maplelegends.com/static/images/lib/skill/5201005.png"
              alt="Wings"
              loading="lazy"
            />
          </div>
          <div className="legendCell text">Gunslinger with maxed Wings</div>
        </div>

        <div className="attrib">
          Requirements as worked out by{" "}
          <a
            href="https://forum.maplelegends.com/index.php?members/hondony.55099/"
            target="_blank"
            rel="noreferrer"
          >
            Hodony
          </a>
          {" "}in their{" "}
          <a
            href="https://forum.maplelegends.com/index.php?threads/orbis-party-quest-guide.54745/"
            target="_blank"
            rel="noreferrer"
          >
            Orbis Party Quest Guide
          </a>
          .
        </div>
      </Accordion>

      {/* Lounge */}
      <Accordion
        title="Lounge"
        isOpen={acc.lounge}
        onToggle={() => toggleAcc("lounge")}
        statueIcon="https://maplelegends.com/static/images/lib/item/04001048.png"
        pieceCount={40}
        pieceIcon="https://maplelegends.com/static/images/lib/item/04001052.png"
      >
        <ImgBlock src={ASSETS.loungeMap} alt="Lounge Dark Room map" />
        <div className="attrib">
          Dark Room image from{" "}
          <a
            href="https://forum.maplelegends.com/index.php?members/hondony.55099/"
            target="_blank"
            rel="noreferrer"
          >
            Hodony
          </a>
          &apos;s{" "}
          <a
            href="https://forum.maplelegends.com/index.php?threads/orbis-party-quest-guide.54745/"
            target="_blank"
            rel="noreferrer"
          >
            Orbis Party Quest Guide
          </a>
          .
        </div>
      </Accordion>

      {/* Sealed Room */}
      <Accordion
        title="Sealed Room"
        isOpen={acc.sealed}
        onToggle={() => toggleAcc("sealed")}
        statueIcon="https://maplelegends.com/static/images/lib/item/04001047.png"
      >

        <p className="para">
          Run 5-0-0, 4-1-0, 4-0-1 and enter Eak's result. The app will determine the only valid remaining order.
        </p>

        <button
          className="minorBtn eakBtn"
          onClick={() => setShowEakHelp(!showEakHelp)}
        >
          {showEakHelp ? "Hide" : "How to read Eak"}
        </button>

        {showEakHelp && (
          <div className="eakHelp">
            <img
              src="/img/eak-sample.png"
              className="eakHelpImg"
              alt="Example of Eak dialog"
            />
            <div className="eakHelpCaption">
              Use the <strong>second number</strong> only.
            </div>
          </div>
        )}

        <div className="sealedGrid">

          {PROBES.map((p) => {
            const value = sel[p.id];

            return (
              <div className="probeCard" key={p.id}>

                <div className="imgCard">
                  <img src={p.imgSrc} className="probeImg" />
                </div>

                <div className="probeTitle">{p.text}</div>

                <div className="eakLabel">
                  <img
                    className="eakIcon"
                    src="https://maplelegends.com/static/images/lib/npc/2013001.png"
                  />
                  <span>Eak says:</span>
                </div>

                <div className="btnRow">
                  <button
                    className={`pickBtn ${value === 0 ? "active" : ""}`}
                    onClick={() => setProbe(p.id, 0)}
                  >
                    0 <span>platforms</span>
                  </button>

                  <button
                    className={`pickBtn ${value === 1 ? "active" : ""}`}
                    onClick={() => setProbe(p.id, 1)}
                  >
                    1 <span>platform</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {allSelected && !chain && (
          <div className="error">
            Pattern {patternDashed} cannot occur in the puzzle. Please recheck the results from the NPC.
            <br/>You can reset the puzzle room by using up all 7 attempts.
          </div>
        )}

        {allSelected && chain && (
          <div className="chainBox">

            <div className="sealedSummary">
              Pattern <strong>{patternDashed}</strong> has only one valid remaining order:
            </div>

            <div className="chainList">
              {chain.map((step, idx) => {
                const done = chainDone.has(step);

                return (
                  <button
                    key={step}
                    className={`chainItem ${done ? "done" : ""}`}
                    onClick={() => toggleChain(step)}
                  >
                    {/*<span className="chainIdx">{idx + 1}</span>*/}
                    <span className="chainStep">{formatStep(step)}</span>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        <div className="sealedControls">
          <button className="minorBtn" onClick={resetSealedRoom}>
            Reset
          </button>
        </div>
      </Accordion>

      {/* Storage */}
      <Accordion
        title="Storage"
        isOpen={acc.storage}
        onToggle={() => toggleAcc("storage")}
        statueIcon="https://maplelegends.com/static/images/lib/item/04001045.png"
      >
        <StorageTracker />
      </Accordion>

      {/* Walkway */}
      <Accordion
        title="Walkway"
        locked
        statueIcon="https://maplelegends.com/static/images/lib/item/04001044.png"
        pieceCount={30}
        pieceIcon="https://maplelegends.com/static/images/lib/item/04001050.png"
      />

      {/* On The Way Up */}
      <Accordion
        title="On The Way Up"
        isOpen={acc.up}
        onToggle={() => toggleAcc("up")}
        statueIcon="https://maplelegends.com/static/images/lib/item/04001049.png"
      >

      <p className="para">
      Hit the levers in the sequence shown, about once every 1.5s.
      </p>

      <div className="leverSequenceMobile">
        3234 → 3235 → 3234 → 3231
      </div>

      <div className="storageCopyRow">

        <input
          className="storageCopyInput"
          value="3234-3235-3234-3231"
          readOnly
          name="name2"
          id="onthewayupInput"
          autoComplete="none"
        />

        <button
          className="minorBtn"
          onClick={() => navigator.clipboard.writeText("3234-3235-3234-3231")}
        >
        Copy to clipboard
        </button>

      </div>

      <ImgBlock
        src={ASSETS.onTheWayUp}
        alt="On The Way Up reference"
      />

      </Accordion>

      {/* Tower */}
      <Accordion
        title="Tower"
        isOpen={acc.tower}
        onToggle={() => toggleAcc("tower")}
      >
        <ImgBlock src={ASSETS.tower} alt="Statue Pieces location" />
        <div className="attrib">
          Statue Piece Location image from{" "}
          <a
            href="https://forum.maplelegends.com/index.php?members/hondony.55099/"
            target="_blank"
            rel="noreferrer"
          >
            Hodony
          </a>
          &apos;s{" "}
          <a
            href="https://forum.maplelegends.com/index.php?threads/orbis-party-quest-guide.54745/"
            target="_blank"
            rel="noreferrer"
          >
            Orbis Party Quest Guide
          </a>
          .
        </div>
      </Accordion>

      <footer className="appFooter">
        <div className="footerInner">
          <div className="footerLeft">
            <div className="footerLinks">
              Other MapleLegends tools by Sparrow: <a href="https://butler-pq-helper.vercel.app/">Phantom Forest Navigator</a>
            </div>
            <div className="footerCredits">
              Made with love for <a href="https://maplelegends.com/" target="_blank" rel="noreferrer">MapleLegends</a>, but not affiliated. For feedback, please DM thsscapi on <a href="https://forum.maplelegends.com/index.php?conversations/add&amp;to=thsscapi" target="_blank" rel="noreferrer">ML forums</a>.
              <br/>Image credits: xMiho, n2ghtygirl, iFredaz, FrozenCarrot, Fredl
            </div>
          </div>
          <div className="footerRight">
            <a
              href="https://ko-fi.com/thsscapi"
              target="_blank"
              rel="noreferrer"
              className="donateBtn"
            >
              <img src="https://maplelegends.com/static/images/lib/item/02030008.png" alt="Coffee Milk" className="donateImage"/>  If you found this tool useful, consider giving me a tip
            </a>
          </div>
        </div>

      </footer>

      <div className="floatingBtns">
        <button className="floatingBtn" onClick={toggleAllAccordions}>
          {allOpen ? "Close all" : "Open all"}
        </button>

        <button className="floatingBtn danger" onClick={resetApp}>
          Reset app
        </button>
      </div>

    </div>
  );
}