import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Erreur inconnue",
    };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#fff" }}>
          <div style={{ maxWidth: 720, width: "100%", border: "1px solid #e8dccb", borderRadius: 12, padding: 20 }}>
            <h1 style={{ margin: 0, marginBottom: 12, fontSize: 24, color: "#1a1a1a" }}>Une erreur est survenue</h1>
            <p style={{ margin: 0, marginBottom: 12, color: "#4a4a4a" }}>
              L’application a rencontré une erreur côté navigateur.
            </p>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "#8a1f1f", fontSize: 13 }}>
              {this.state.errorMessage}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid #d4af37", background: "#d4af37", color: "#fff", cursor: "pointer" }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
