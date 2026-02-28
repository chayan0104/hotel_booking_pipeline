import React, { useEffect, useState } from "react";
import "./App.css";

const pipelineStages = [
  { name: "Code", detail: "React + Spring Boot changes are versioned in Git." },
  { name: "Build", detail: "Frontend and backend artifacts are built in Jenkins." },
  { name: "Test", detail: "Automated checks validate API and UI integration." },
  { name: "Deploy", detail: "Containers are promoted to runtime targets." },
];

const serviceCards = [
  {
    title: "React Frontend",
    subtitle: "User experience layer",
    stat: "Port 3000",
  },
  {
    title: "Spring Boot API",
    subtitle: "Business logic + service contracts",
    stat: "Port 8080",
  },
  {
    title: "Oracle XE",
    subtitle: "Durable relational data store",
    stat: "Port 1521",
  },
];

const removeTrailingSlash = (value) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const envUrl =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_API_URL) ||
    "";
  if (envUrl && envUrl.trim()) {
    return removeTrailingSlash(envUrl.trim());
  }

  return "";
};

function App() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("loading");
  const [updatedAt, setUpdatedAt] = useState("");
  const apiBaseUrl = resolveApiBaseUrl();

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/hello`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return res.text();
      })
      .then((data) => {
        setMessage(data);
        setStatus("online");
        setUpdatedAt(new Date().toLocaleString());
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("offline");
          setMessage("Unable to reach backend service.");
          setUpdatedAt(new Date().toLocaleString());
        }
      });

    return () => controller.abort();
  }, [apiBaseUrl]);

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">DevSecOps Pipeline Dashboard</p>
        <h1>React + Spring Boot + Oracle</h1>
        <p className="hero-copy">
          A bulked-up view of service health, integration flow, and pipeline progress.
        </p>
        <div className={`status-chip ${status}`}>
          <span className="dot" />
          Backend status: {status === "online" ? "Connected" : status === "offline" ? "Disconnected" : "Checking..."}
        </div>
      </header>

      <section className="grid services">
        {serviceCards.map((item) => (
          <article className="card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.subtitle}</p>
            <strong>{item.stat}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Live API Response</h2>
          <span>Last update: {updatedAt || "Waiting for response..."}</span>
        </div>
        <p className="api-message">{message || "Loading backend message..."}</p>
      </section>

      <section className="panel">
        <h2>Pipeline Stages</h2>
        <div className="grid stages">
          {pipelineStages.map((stage, index) => (
            <article className="stage" key={stage.name}>
              <p className="stage-number">0{index + 1}</p>
              <h3>{stage.name}</h3>
              <p>{stage.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
