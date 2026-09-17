// =========================================================
// SLIMECRAFT AI - AUTHENTICATION
// =========================================================

const SUPABASE_URL = "https://jwkwuzdpyqpvclovjpfi.supabase.co";

// PUT YOUR PUBLISHABLE KEY HERE
const SUPABASE_KEY = "sb_publishable_ZCznj2jywRlhjzI8VvNSUQ_PQVC1qEO";

const { createClient } = supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// Elements

const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const formLabel = document.getElementById("form-label");

const nameField = document.querySelector(".signup-field");
const nameInput = document.getElementById("name");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const authButton = document.getElementById("auth-button");

const switchModeButton = document.getElementById("switch-mode");
const switchText = document.getElementById("switch-text");

const authMessage = document.getElementById("auth-message");

const togglePassword = document.getElementById("toggle-password");

let isSignup = new URLSearchParams(window.location.search).get("signup") === "true";


// =========================================================
// UI MODE
// =========================================================

function updateAuthMode() {

    if (isSignup) {

        formLabel.textContent = "CREATE YOUR ACCOUNT";

        formTitle.textContent = "Let's get creating.";

        formSubtitle.textContent =
            "Create an account to save your slime conversations.";

        nameField.classList.remove("hidden");

        authButton.innerHTML = `
            Create account
            <span>→</span>
        `;

        switchText.textContent =
            "Already have an account?";

        switchModeButton.textContent =
            "Log in";

    } else {

        formLabel.textContent = "WELCOME BACK";

        formTitle.textContent =
            "Let's get creating.";

        formSubtitle.textContent =
            "Log in to continue your slime journey.";

        nameField.classList.add("hidden");

        authButton.innerHTML = `
            Log in
            <span>→</span>
        `;

        switchText.textContent =
            "Don't have an account?";

        switchModeButton.textContent =
            "Sign up";
    }
}

updateAuthMode();


// =========================================================
// SWITCH LOGIN / SIGNUP
// =========================================================

switchModeButton.addEventListener("click", () => {

    isSignup = !isSignup;

    updateAuthMode();

    authMessage.textContent = "";

});


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";
    }

});


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message, isError = false) {

    authMessage.textContent = message;

    authMessage.style.color =
        isError
            ? "#b46f83"
            : "#789f94";
}


// =========================================================
// LOGIN
// =========================================================

async function loginUser() {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {

        showMessage(
            "Please enter your email and password.",
            true
        );

        return;
    }

    authButton.disabled = true;

    authButton.innerHTML = `
        Logging in...
    `;

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {

        showMessage(
            error.message,
            true
        );

        authButton.disabled = false;

        updateAuthMode();

        return;
    }

    showMessage("Login successful.");

    window.location.replace("/chat");

}


// =========================================================
// SIGNUP
// =========================================================

async function signupUser() {

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {

        showMessage(
            "Please fill in all fields.",
            true
        );

        return;
    }

    if (password.length < 6) {

        showMessage(
            "Password must contain at least 6 characters.",
            true
        );

        return;
    }

    authButton.disabled = true;

    authButton.innerHTML = `
        Creating account...
    `;


    const { data, error } =
        await supabaseClient.auth.signUp({

            email,
            password,

            options: {
                data: {
                    name: name
                }
            }

        });


    if (error) {

        showMessage(
            error.message,
            true
        );

        authButton.disabled = false;

        updateAuthMode();

        return;
    }


    /*
       Supabase may require email confirmation.

       If confirmation is disabled,
       session will already exist.

       If confirmation is enabled,
       user will receive an email.
    */

    if (data.session) {

    showMessage(
        "Account created! Opening SlimeCraft AI..."
    );

    window.location.replace("/chat");



    } else {

        showMessage(
            "Account created. Please check your email to confirm your account."
        );

        authButton.disabled = false;

        updateAuthMode();
    }

}


// =========================================================
// SUBMIT
// =========================================================

authButton.addEventListener("click", async () => {

    authMessage.textContent = "";

    if (isSignup) {

        await signupUser();

    } else {

        await loginUser();

    }

});