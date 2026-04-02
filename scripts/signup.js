document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("authMessage");
  const signupBtn = document.getElementById("signupBtn");

  signupBtn.addEventListener("click", async () => {
    message.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {
      message.textContent = "Name, email, and password are required.";
      return;
    }

    try {
      const response = await QuantityApi.request("signup", {
        method: "POST",
        body: { name, email, password },
      });

      QuantityAuth.saveAuth(response);
      window.location.href = "index.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
});
