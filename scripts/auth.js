const QuantityAuth = (() => {
  function saveAuth(authResponse) {
    if (!authResponse || !authResponse.token) {
      throw new Error("Token not found in response.");
    }

    localStorage.setItem("qm_token", authResponse.token);
    localStorage.setItem("qm_user_name", authResponse.name || "");
    localStorage.setItem("qm_user_email", authResponse.email || "");
  }

  function clearAuth() {
    localStorage.removeItem("qm_token");
    localStorage.removeItem("qm_user_name");
    localStorage.removeItem("qm_user_email");
  }

  function isLoggedIn() {
    return Boolean(localStorage.getItem("qm_token"));
  }

  function getUserName() {
    return localStorage.getItem("qm_user_name") || "";
  }

  return {
    saveAuth,
    clearAuth,
    isLoggedIn,
    getUserName,
  };
})();
