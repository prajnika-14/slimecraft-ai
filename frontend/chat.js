// =========================================================
// SLIMECRAFT AI - CHAT
// Supabase + FastAPI + Chat History
// =========================================================


const SUPABASE_URL =
    "https://jwkwuzdpyqpvclovjpfi.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_ZCznj2jywRlhjzI8VvNSUQ_PQVC1qEO";


const API_URL =
    "";


const { createClient } = supabase;


const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// ELEMENTS
// =========================================================

const messagesArea =
    document.getElementById("messages-area");

const messagesContainer =
    document.getElementById("messages-container");

const welcomeChat =
    document.getElementById("welcome-chat");

const chatForm =
    document.getElementById("chat-form");

const messageInput =
    document.getElementById("message-input");

const sendButton =
    document.getElementById("send-button");

const newChatButton =
    document.getElementById("new-chat-button");

const logoutButton =
    document.getElementById("logout-button");

const userName =
    document.getElementById("user-name");

const userEmail =
    document.getElementById("user-email");

const userAvatar =
    document.getElementById("user-avatar");

const chatSidebar =
    document.getElementById("chat-sidebar");

const mobileMenu =
    document.getElementById("mobile-menu");

const chatList =
    document.getElementById("chat-list");


// =========================================================
// STATE
// =========================================================

let currentUser = null;

let currentChatId = null;


// =========================================================
// INITIALIZE
// =========================================================

async function initializeChat() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href =
            "/login";

        return;
    }


    currentUser = session.user;


    const name =
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0] ||
        "User";


    userName.textContent =
        name;


    userEmail.textContent =
        currentUser.email;


    userAvatar.textContent =
        name.charAt(0).toUpperCase();


    await loadChatHistory();

}


initializeChat();


// =========================================================
// LOGOUT
// =========================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        window.location.href =
            "/";

    }
);


// =========================================================
// MOBILE SIDEBAR
// =========================================================

mobileMenu.addEventListener(
    "click",
    () => {

        chatSidebar.classList.toggle(
            "open"
        );

    }
);


// =========================================================
// NEW CHAT
// =========================================================

newChatButton.addEventListener(
    "click",
    async () => {

        currentChatId = null;

        messagesContainer.innerHTML = "";

        welcomeChat.style.display =
            "block";

        messageInput.value = "";

        messageInput.style.height =
            "auto";

        document
            .querySelectorAll(".chat-history-item")
            .forEach(item => {

                item.classList.remove(
                    "active"
                );

            });

        messageInput.focus();


        // Close sidebar on mobile
        chatSidebar.classList.remove(
            "open"
        );

    }
);


// =========================================================
// SUGGESTION BUTTONS
// =========================================================

document
    .querySelectorAll(".suggestion-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.querySelector(
                        "small"
                    ).textContent;


                messageInput.value =
                    question;


                messageInput.focus();


                sendMessage();

            }
        );

    });


// =========================================================
// TEXTAREA AUTO RESIZE
// =========================================================

messageInput.addEventListener(
    "input",
    () => {

        messageInput.style.height =
            "auto";


        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                130
            ) + "px";

    }
);


// =========================================================
// ENTER TO SEND
// =========================================================

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// =========================================================
// CREATE CHAT
// =========================================================

async function createChat(
    firstMessage
) {

    const title =
        firstMessage.length > 35
            ? firstMessage.substring(
                0,
                35
            ) + "..."
            : firstMessage;


    const {
        data,
        error
    } = await supabaseClient
        .from("chats")
        .insert({

            user_id:
                currentUser.id,

            title:
                title

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Create chat error:",
            error
        );

        throw error;

    }


    currentChatId =
        data.id;


    await loadChatHistory();


    return data;

}


// =========================================================
// SAVE MESSAGE
// =========================================================

async function saveMessage(
    chatId,
    role,
    content
) {

    const {
        data,
        error
    } = await supabaseClient
        .from("messages")
        .insert({

            chat_id:
                chatId,

            role:
                role,

            content:
                content

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Save message error:",
            error
        );

        throw error;

    }


    return data;

}


// =========================================================
// LOAD CHAT HISTORY
// =========================================================

async function loadChatHistory() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("chats")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Load chats error:",
            error
        );

        chatList.innerHTML = `
            <div class="empty-chats">
                Unable to load chats.
            </div>
        `;

        return;

    }


    chatList.innerHTML = "";


    if (!data || data.length === 0) {

        chatList.innerHTML = `
            <div class="empty-chats">
                Start a conversation to see
                your chats here.
            </div>
        `;

        return;

    }


    data.forEach(chat => {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "chat-history-item";


        if (
            chat.id === currentChatId
        ) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            chat.title ||
            "New Chat";


        button.addEventListener(
            "click",
            () => {

                openChat(chat.id);

                chatSidebar.classList.remove(
                    "open"
                );

            }
        );


        chatList.appendChild(
            button
        );

    });

}


// =========================================================
// OPEN EXISTING CHAT
// =========================================================

async function openChat(
    chatId
) {

    currentChatId =
        chatId;


    messagesContainer.innerHTML = "";

    welcomeChat.style.display =
        "none";


    const {
        data,
        error
    } = await supabaseClient
        .from("messages")
        .select("*")
        .eq(
            "chat_id",
            chatId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Load messages error:",
            error
        );

        addMessage(
            "I couldn't load this conversation.",
            "assistant"
        );

        return;

    }


    if (!data || data.length === 0) {

        welcomeChat.style.display =
            "block";

        return;

    }


    data.forEach(message => {

        addMessage(
            message.content,
            message.role === "user"
                ? "user"
                : "assistant",
            false
        );

    });


    updateActiveChat();


    scrollToBottom();

}


// =========================================================
// UPDATE ACTIVE CHAT
// =========================================================

function updateActiveChat() {

    document
        .querySelectorAll(
            ".chat-history-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    /*
       The active button is matched
       using the current chat title
       after reload.
    */

}


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(
    text,
    role,
    shouldScroll = true
) {

    welcomeChat.style.display =
        "none";


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `message-row ${role}`;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    bubble.textContent =
        text;


    row.appendChild(
        bubble
    );


    messagesContainer.appendChild(
        row
    );


    if (shouldScroll) {

        scrollToBottom();

    }

}


// =========================================================
// TYPING INDICATOR
// =========================================================

function showTyping() {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row assistant";


    row.id =
        "typing-row";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble typing-bubble";


    bubble.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;


    row.appendChild(
        bubble
    );


    messagesContainer.appendChild(
        row
    );


    scrollToBottom();

}


// =========================================================
// REMOVE TYPING
// =========================================================

function removeTyping() {

    const typing =
        document.getElementById(
            "typing-row"
        );


    if (typing) {

        typing.remove();

    }

}


// =========================================================
// SCROLL
// =========================================================

function scrollToBottom() {

    setTimeout(
        () => {

            messagesArea.scrollTop =
                messagesArea.scrollHeight;

        },
        50
    );

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {

        return;

    }


    // Display user message
    addMessage(
        message,
        "user"
    );


    messageInput.value = "";

    messageInput.style.height =
        "auto";


    sendButton.disabled =
        true;


    try {

        // ---------------------------------------------
        // Create chat if this is the first message
        // ---------------------------------------------

        if (!currentChatId) {

            await createChat(
                message
            );

        }


        // ---------------------------------------------
        // Save user message
        // ---------------------------------------------

        await saveMessage(
            currentChatId,
            "user",
            message
        );


        // ---------------------------------------------
        // Show AI typing
        // ---------------------------------------------

        showTyping();


        // ---------------------------------------------
        // Call FastAPI
        // ---------------------------------------------

        const response = await fetch("/api/chat", 
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            message
                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const result =
            await response.json();


        const aiResponse =
            result.response ||
            "I couldn't generate a response.";


        // ---------------------------------------------
        // Remove typing
        // ---------------------------------------------

        removeTyping();


        // ---------------------------------------------
        // Display AI response
        // ---------------------------------------------

        addMessage(
            aiResponse,
            "assistant"
        );


        // ---------------------------------------------
        // Save AI response
        // ---------------------------------------------

        await saveMessage(
            currentChatId,
            "assistant",
            aiResponse
        );


        // Refresh sidebar
        await loadChatHistory();


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        removeTyping();


        addMessage(
            "Sorry, I couldn't connect to SlimeCraft AI. Please make sure the backend server is running.",
            "assistant"
        );

    }


    sendButton.disabled =
        false;


    messageInput.focus();

}


// =========================================================
// FORM SUBMIT
// =========================================================

chatForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        sendMessage();

    }
);