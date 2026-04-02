document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("authMessage");
  const loginBtn = document.getElementById("loginBtn");

  loginBtn.addEventListener("click", async () => {
    message.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      message.textContent = "Email and password are required.";
      return;
    }

    try {
      const response = await QuantityApi.request("login", {
        method: "POST",
        body: { email, password },
      });

      QuantityAuth.saveAuth(response);
      window.location.href = "index.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
});
