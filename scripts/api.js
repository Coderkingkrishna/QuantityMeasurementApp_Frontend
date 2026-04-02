const QuantityApi = (() => {
  const DEFAULT_CONFIG = {
    apiBaseUrl: "http://localhost:5105",
    endpoints: {
      signup: "/api/auth/signup",
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      convert: "/api/quantitymeasurement/convert",
      compare: "/api/quantitymeasurement/compare",
      add: "/api/quantitymeasurement/add",
      subtract: "/api/quantitymeasurement/subtract",
      divide: "/api/quantitymeasurement/divide",
      history: "/api/quantitymeasurement/history",
    },
  };

  let configPromise;
  let activeBaseUrl;

  async function loadConfig() {
    if (!configPromise) {
      // file:// pages cannot fetch sibling JSON files due to browser security restrictions.
      if (window.location.protocol === "file:") {
        configPromise = Promise.resolve(DEFAULT_CONFIG);
      } else {
        configPromise = fetch("data/app-config.json")
          .then((r) => {
            if (!r.ok) {
              throw new Error("Unable to load app-config.json");
            }
            return r.json();
          })
          .catch(() => DEFAULT_CONFIG);
      }
    }
    return configPromise;
  }

  async function request(endpointKey, { method = "GET", body, requiresAuth = false } = {}) {
    const config = await loadConfig();
    const endpoint = config.endpoints[endpointKey];

    if (!endpoint) {
      throw new Error(`Endpoint key ${endpointKey} is not configured.`);
    }

    const headers = { "Content-Type": "application/json" };

    const token = localStorage.getItem("qm_token");

    if (requiresAuth && !token) {
      throw new Error("Please login first.");
    }

    // Send JWT whenever available so backend can attribute audit rows to the user,
    // even on [AllowAnonymous] endpoints.
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const baseCandidates = getBaseUrlCandidates(activeBaseUrl || config.apiBaseUrl);

    let response;
    let networkError;

    for (const baseUrl of baseCandidates) {
      try {
        response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        activeBaseUrl = baseUrl;
        break;
      } catch (error) {
        networkError = error;
      }
    }

    if (!response) {
      throw new Error(
        networkError?.message ||
          "Unable to connect to backend. Verify API is running and URL/port are correct."
      );
    }

    const text = await response.text();
    const payload = text ? tryParseJson(text) : null;

    if (!response.ok) {
      const fallbackError = `Request failed with status ${response.status}`;
      const message = typeof payload === "string" ? payload : payload?.message || fallbackError;
      throw new Error(message);
    }

    return payload;
  }

  function getBaseUrlCandidates(configuredBaseUrl) {
    const candidates = [];
    const pushUnique = (url) => {
      if (url && !candidates.includes(url)) {
        candidates.push(url);
      }
    };

    pushUnique(configuredBaseUrl);

    try {
      const parsed = new URL(configuredBaseUrl);
      const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      if (isLocalhost) {
        const flippedProtocol = parsed.protocol === "https:" ? "http:" : "https:";
        pushUnique(`${flippedProtocol}//${parsed.host}`);

        if (parsed.port === "5105") {
          pushUnique("https://localhost:7137");
          pushUnique("http://localhost:5105");
        }

        if (parsed.port === "7137") {
          pushUnique("http://localhost:5105");
          pushUnique("https://localhost:7137");
        }
      }
    } catch {
      // If configured URL is invalid, candidate list will only include the original value.
    }

    return candidates;
  }

  function tryParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return {
    request,
  };
})();
