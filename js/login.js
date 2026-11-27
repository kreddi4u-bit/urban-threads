// Login page: log in or sign up with an email and password (Firebase Authentication).
import {
  renderChrome, authReady, auth, db, doc, setDoc, serverTimestamp,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
  friendlyAuthError, isConfigured,
} from "./app.js";

renderChrome("login");

const params = new URLSearchParams(location.search);
const allowedPages = ["index.html", "shop.html", "cart.html"];
const nextPage = allowedPages.includes(params.get("next")) ? params.get("next") : "shop.html";

const tabs = document.querySelectorAll("[data-tab]");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPassword=document.getElementById("forgotPassword");

/* ---------- tabs ---------- */
function showTab(name) {
  const isLogin = name === "login";
  loginForm.hidden = !isLogin;
  signupForm.hidden = isLogin;
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".form__message").forEach((el) => (el.textContent = ""));
}

tabs.forEach((tab) => tab.addEventListener("click", () => showTab(tab.dataset.tab)));
showTab(params.get("mode") === "signup" ? "signup" : "login");

/* ---------- already logged in ---------- */
authReady.then((user) => {
  if (user) location.replace(nextPage);
});

/* ---------- helpers ---------- */
function setBusy(form, busy, label) {
  const button = form.querySelector("button[type=submit]");
  button.disabled = busy;
  button.textContent = busy ? "Please wait..." : label;
}

function checkSetup(form) {
  if (isConfigured) return true;
  form.querySelector(".form__message").textContent =
    "Firebase is not set up yet. Paste your settings into js/firebase-config.js first.";
  return false;
}

/* ---------- forgot password ---------- */
forgotPassword.addEventListener("click", async (event) => {
  event.preventDefault();

  const email = loginForm.email.value.trim();
  const message = loginForm.querySelector(".form__message");

  message.textContent = "";

  if (!email) {
    message.textContent = "Enter your email address first.";
    loginForm.email.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    message.textContent = "Password reset email sent. Check your inbox.";
  } catch (error) {
    console.error(error);
    message.textContent = friendlyAuthError(error.code);
  }
});

/* ---------- log in ---------- */
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = loginForm.querySelector(".form__message");
  message.textContent = "";
  if (!checkSetup(loginForm)) return;

  setBusy(loginForm, true, "Log in");
  try {
    await signInWithEmailAndPassword(
      auth,
      loginForm.email.value.trim(),
      loginForm.password.value
    );
    location.href = nextPage;
  } catch (error) {
    console.error(error);
    message.textContent = friendlyAuthError(error.code);
    setBusy(loginForm, false, "Log in");
  }
});

/* ---------- sign up ---------- */
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = signupForm.querySelector(".form__message");
  message.textContent = "";
  if (!checkSetup(signupForm)) return;

  const name = signupForm.name.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value;

  if (!name) {
    message.textContent = "Enter your name.";
    return;
  }

  setBusy(signupForm, true, "Create account");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    /* save a profile document for the new user (the cart is stored inside it) */
    try {
      await setDoc(doc(db, "users", credential.user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Could not save the profile document.", error);
    }

    location.href = nextPage;
  } catch (error) {
    console.error(error);
    message.textContent = friendlyAuthError(error.code);
    setBusy(signupForm, false, "Create account");
  }
});
