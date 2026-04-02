document.addEventListener("DOMContentLoaded", async () => {
  const DEFAULT_UNITS_DATA = {
    categories: {
      Length: ["Feet", "Inches", "Yards", "Centimeters"],
      Weight: ["Kilogram", "Gram", "Pound"],
      Volume: ["Litre", "Millilitre", "Gallon"],
      Temperature: ["Celsius", "Fahrenheit", "Kelvin"],
    },
    arithmeticOperators: [
      { label: "Add (+)", value: "add" },
      { label: "Subtract (-)", value: "subtract" },
      { label: "Divide (/)", value: "divide" },
    ],
  };

  const state = {
    category: "Length",
    action: "comparison",
    unitsByCategory: {},
    historyVisible: false,
  };

  const categoryCards = document.getElementById("categoryCards");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const calculateBtn = document.getElementById("calculateBtn");
  const resultText = document.getElementById("resultText");
  const resultSubText = document.getElementById("resultSubText");
  const message = document.getElementById("message");
  const historyToggleBtn = document.getElementById("historyToggleBtn");
  const historyPanel = document.getElementById("historyPanel");
  const historyMessage = document.getElementById("historyMessage");
  const historyList = document.getElementById("historyList");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  const welcomeUser = document.getElementById("welcomeUser");
  const arithmeticTab = document.querySelector('.tab[data-action="arithmetic"]');
  const arithTargetWrap = document.getElementById("arithTargetWrap");
  const arithOperator = document.getElementById("arithOperator");

  const sections = {
    comparison: document.getElementById("comparisonFields"),
    conversion: document.getElementById("conversionFields"),
    arithmetic: document.getElementById("arithmeticFields"),
  };

  bindAuthUi();

  try {
    // file:// pages cannot fetch sibling JSON files due to browser security restrictions.
    const unitsData =
      window.location.protocol === "file:"
        ? DEFAULT_UNITS_DATA
        : await fetch("data/units.json")
            .then((r) => {
              if (!r.ok) {
                throw new Error("Unable to load units.json");
              }
              return r.json();
            })
            .catch(() => DEFAULT_UNITS_DATA);

    state.unitsByCategory = unitsData.categories;

    buildCategoryCards();
    bindTabs();
    fillAllUnitSelects();
    fillOperators();
    bindOperatorUi();
    updateActionUi();
  } catch (error) {
    message.textContent = error.message;
  }

  calculateBtn.addEventListener("click", onCalculate);

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        if (QuantityAuth.isLoggedIn()) {
          await QuantityApi.request("logout", {
            method: "POST",
            requiresAuth: true,
          });
        }
      } catch {
      } finally {
        QuantityAuth.clearAuth();
        location.reload();
      }
    });
  }

  if (historyToggleBtn) {
    historyToggleBtn.addEventListener("click", async () => {
      const loggedIn = QuantityAuth.isLoggedIn();

      if (!loggedIn) {
        message.textContent = "Login to view history.";
        return;
      }

      state.historyVisible = !state.historyVisible;
      historyPanel.classList.toggle("is-hidden", !state.historyVisible);
      historyToggleBtn.textContent = state.historyVisible ? "Hide History" : "View History";

      if (state.historyVisible) {
        await loadHistory();
      }
    });
  }

  function bindAuthUi() {
    const loggedIn = QuantityAuth.isLoggedIn();
    const userName = QuantityAuth.getUserName();

    if (loggedIn) {
      loginLink.style.display = "none";
      signupLink.style.display = "none";
      logoutBtn.style.display = "inline-block";
      welcomeUser.textContent = userName ? `Hi, ${userName}` : "Logged in";
    } else {
      loginLink.style.display = "inline-block";
      signupLink.style.display = "inline-block";
      logoutBtn.style.display = "none";
      welcomeUser.textContent = "";
    }
  }

  function buildCategoryCards() {
    const categoryMeta = [
      { key: "Length", icon: "📏" },
      { key: "Weight", icon: "⚖️" },
      { key: "Temperature", icon: "🌡️" },
      { key: "Volume", icon: "🧴" },
    ];

    categoryCards.innerHTML = "";

    categoryMeta.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-btn";
      if (item.key === state.category) {
        btn.classList.add("is-active");
      }
      btn.dataset.category = item.key;
      btn.innerHTML = `<span>${item.icon}</span><span>${item.key}</span>`;
      btn.addEventListener("click", () => {
        state.category = item.key;
        Array.from(categoryCards.children).forEach((node) => node.classList.remove("is-active"));
        btn.classList.add("is-active");
        fillAllUnitSelects();
        fillOperators();
        updateActionAvailability();
        updateArithmeticUi();
      });
      categoryCards.appendChild(btn);
    });
  }

  function bindTabs() {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((x) => x.classList.remove("is-active"));
        tab.classList.add("is-active");
        state.action = tab.dataset.action;
        updateActionUi();
        updateArithmeticUi();
        message.textContent = "";
      });
    });
  }

  function fillOperators() {
    const operators = getAllowedOperators(state.category);
    arithOperator.innerHTML = operators
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join("");

    if (!operators.length) {
      arithOperator.innerHTML = `<option value="">Not Supported</option>`;
    }
  }

  function bindOperatorUi() {
    arithOperator.addEventListener("change", updateArithmeticUi);
  }

  function fillAllUnitSelects() {
    const units = state.unitsByCategory[state.category] || [];

    const selects = [
      "compareUnit1",
      "compareUnit2",
      "convertUnitFrom",
      "convertUnitTo",
      "arithUnit1",
      "arithUnit2",
      "arithTargetUnit",
    ];

    selects.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) {
        return;
      }

      select.innerHTML = units.map((unit) => `<option value="${unit}">${unit}</option>`).join("");
    });

    const compareUnit2 = document.getElementById("compareUnit2");
    if (compareUnit2 && units.length > 1) {
      compareUnit2.selectedIndex = 1;
    }

    const convertUnitTo = document.getElementById("convertUnitTo");
    if (convertUnitTo && units.length > 1) {
      convertUnitTo.selectedIndex = 1;
    }

    const arithUnit2 = document.getElementById("arithUnit2");
    if (arithUnit2 && units.length > 1) {
      arithUnit2.selectedIndex = 1;
    }
  }

  function updateActionUi() {
    Object.entries(sections).forEach(([key, section]) => {
      section.classList.toggle("is-hidden", key !== state.action);
    });
    updateActionAvailability();
    updateArithmeticUi();
  }

  function updateActionAvailability() {
    const arithmeticSupported = getAllowedOperators(state.category).length > 0;

    arithmeticTab.disabled = !arithmeticSupported;
    arithmeticTab.classList.toggle("is-disabled", !arithmeticSupported);

    if (!arithmeticSupported && state.action === "arithmetic") {
      state.action = "comparison";
      tabs.forEach((x) => x.classList.toggle("is-active", x.dataset.action === "comparison"));
      sections.arithmetic.classList.add("is-hidden");
      sections.comparison.classList.remove("is-hidden");
      message.textContent = "Arithmetic is not supported for Temperature.";
    }
  }

  function updateArithmeticUi() {
    if (state.action !== "arithmetic") {
      return;
    }

    const selectedOperator = arithOperator.value;
    const hideTargetUnit = selectedOperator === "divide";

    arithTargetWrap.classList.toggle("is-hidden", hideTargetUnit);
    sections.arithmetic.classList.toggle("compact", hideTargetUnit);
  }

  function getAllowedOperators(category) {
    if (category === "Temperature") {
      return [];
    }

    return DEFAULT_UNITS_DATA.arithmeticOperators;
  }

  async function loadHistory() {
    historyMessage.textContent = "";
    historyList.innerHTML = "";

    try {
      const entries = await QuantityApi.request("history", {
        method: "GET",
        requiresAuth: true,
      });

      if (!entries || !entries.length) {
        historyMessage.textContent = "No history found.";
        return;
      }

      entries.forEach((entry) => {
        const item = document.createElement("li");
        item.className = `history-item${entry.isError ? " is-error" : ""}`;
        const timestamp = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "";
        item.innerHTML = `
          <div class="history-top">
            <span>${timestamp}</span>
            <span>${entry.isError ? "Error" : "Success"}</span>
          </div>
          <div>${entry.description || "-"}</div>
          ${entry.errorMessage ? `<div class="history-error">${entry.errorMessage}</div>` : ""}
        `;
        historyList.appendChild(item);
      });
    } catch (error) {
      historyMessage.textContent = error.message;
    }
  }

  function quantity(value, unit) {
    return {
      value: Number(value),
      unit,
      category: state.category,
    };
  }

  async function onCalculate() {
    message.textContent = "";
    resultSubText.textContent = "";

    try {
      if (state.action === "comparison") {
        const first = quantity(
          document.getElementById("compareValue1").value,
          document.getElementById("compareUnit1").value
        );
        const second = quantity(
          document.getElementById("compareValue2").value,
          document.getElementById("compareUnit2").value
        );

        const response = await QuantityApi.request("compare", {
          method: "POST",
          body: { first, second },
        });

        resultText.textContent = response ? "True" : "False";
        resultSubText.textContent = `${first.value} ${first.unit} and ${second.value} ${second.unit}`;
        await refreshHistoryIfVisible();
        return;
      }

      if (state.action === "conversion") {
        const source = quantity(
          document.getElementById("convertValue").value,
          document.getElementById("convertUnitFrom").value
        );
        const targetUnit = document.getElementById("convertUnitTo").value;

        const response = await QuantityApi.request("convert", {
          method: "POST",
          body: { source, targetUnit },
        });

        resultText.textContent = formatNumber(response.value);
        resultSubText.textContent = response.unit;
        await refreshHistoryIfVisible();
        return;
      }

      const first = quantity(
        document.getElementById("arithValue1").value,
        document.getElementById("arithUnit1").value
      );
      const second = quantity(
        document.getElementById("arithValue2").value,
        document.getElementById("arithUnit2").value
      );
      const targetUnit = document.getElementById("arithTargetUnit").value;
      const operator = document.getElementById("arithOperator").value;

      if (operator === "divide") {
        const divideResponse = await QuantityApi.request("divide", {
          method: "POST",
          body: { first, second },
        });

        resultText.textContent = formatNumber(divideResponse);
        resultSubText.textContent = "Unitless ratio";
        await refreshHistoryIfVisible();
        return;
      }

      const endpoint = operator === "subtract" ? "subtract" : "add";
      const response = await QuantityApi.request(endpoint, {
        method: "POST",
        body: { first, second, targetUnit },
      });

      resultText.textContent = formatNumber(response.value);
      resultSubText.textContent = response.unit;
      await refreshHistoryIfVisible();
    } catch (error) {
      message.textContent = error.message;
      resultText.textContent = "-";
      resultSubText.textContent = "";
    }
  }

  async function refreshHistoryIfVisible() {
    if (!state.historyVisible || !QuantityAuth.isLoggedIn()) {
      return;
    }

    await loadHistory();
  }

  function formatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return String(value);
    }

    return n % 1 === 0 ? String(n) : n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
});
