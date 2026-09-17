// =========================================================
// SLIMECRAFT AI - HOME
// =========================================================

const SUPABASE_URL =
    "https://jwkwuzdpyqpvclovjpfi.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_ZCznj2jywRlhjzI8VvNSUQ_PQVC1qEO";

const { createClient } = supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// CHECK AUTH
// =========================================================

async function checkUser() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    const navActions =
        document.querySelector(".nav-actions");

    if (!navActions) {
        return;
    }


    if (session) {

        const user =
            session.user;

        const name =
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";


        navActions.innerHTML = `

            <a href="chat.html"
               class="nav-login">
                Open Chat
            </a>

            <button
                class="button button-small"
                id="home-logout">
                Log out
            </button>

        `;


        document
            .getElementById("home-logout")
            .addEventListener("click", async () => {

                await supabaseClient.auth.signOut();

                window.location.reload();

            });


        /*
           Update CTA buttons
        */

        document
            .querySelectorAll('a[href="login.html?signup=true"]')
            .forEach(button => {

                button.href = "chat.html";

                button.innerHTML =
                    "Open SlimeCraft AI <span>→</span>";

            });

    }

}


checkUser();