import {
    auth,
    db,
    storage,
    googleProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
} from "./firebase.js";



/* ==========================================
   GLOBAL STATE
========================================== */


function clearSubscriptions() {

    [

        "unsubscribeListings",
        "unsubscribeChats",
        "unsubscribeMessages",
        "unsubscribeReviews"

    ].forEach(
        key => {

            state[key]?.();
            state[key] = null;

        }
    );

}


const state = {
    user: null,
    profile: null,
    role: null,
    page: "landing",
    selectedListing: null,
    selectedChat: null,
    listings: [],
    chats: [],
    messages: [],
    reviews: {},
    unsubscribeListings: null,
    unsubscribeChats: null,
    unsubscribeMessages: null,
    unsubscribeReviews: null
};

/* ==========================================
   DEFAULT SEED LISTINGS & STORAGE CACHE
========================================== */

const DEFAULT_SAMPLE_LISTINGS = [
    {
        id: "mits-seed-1",
        ownerId: "sample-owner-1",
        ownerName: "Sunil Rajput",
        title: "Sagar Boys Hostel (AC & Non-AC) near MITS Gate 1",
        type: "Hostel",
        price: 4500,
        location: "Near MITS College Gate 1, Thatipur, Gwalior",
        distance: 0.3,
        sharing: "2 Sharing",
        arrival: "Open 24/7 (Gate timing 10:00 PM)",
        smoking: "Not Allowed",
        food: "Available",
        electricity: 300,
        wifi: 0,
        maintenance: 100,
        facilities: ["Wi-Fi", "Food/Mess", "Power Backup", "RO Water", "CCTV", "Bed", "Study Table", "Geyser"],
        description: "Best hostel for MITS engineering students right outside Gate 1. Includes 3 times hygienic food, high speed Wi-Fi, 24/7 power backup, and quiet study environment.",
        media: [{
            kind: "image",
            url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
        }],
                booked: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 }
    },
    {
        id: "mits-seed-2",
        ownerId: "sample-owner-2",
        ownerName: "Sharma PG Rentals",
        title: "Comfort Zone Luxury PG (Boys & Girls Separate)",
        type: "PG",
        price: 6500,
        location: "Thatipur Colony, Morar Road, Gwalior",
        distance: 1.1,
        sharing: "Single",
        arrival: "Available immediately",
        smoking: "Not Allowed",
        food: "Available",
        electricity: 500,
        wifi: 0,
        maintenance: 200,
        facilities: ["Wi-Fi", "AC", "Geyser", "Parking", "Furnished", "Laundry", "CCTV", "Food/Mess"],
        description: "Fully furnished single rooms with attached washrooms, individual AC, daily housekeeping, RO water, and high speed fiber internet.",
        media: [{
            kind: "image",
            url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80"
        }],
                booked: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 43200 }
    },
    {
        id: "mits-seed-3",
        ownerId: "sample-owner-3",
        ownerName: "Dr. R.K. Gupta",
        title: "Spacious Private Room with Attached Balcony",
        type: "House Room",
        price: 5000,
        location: "Anand Nagar, Near Rajmata Square, Thatipur",
        distance: 1.8,
        sharing: "Single",
        arrival: "Available after 1st of month",
        smoking: "Outside Only",
        food: "Not Available",
        electricity: 400,
        wifi: 150,
        maintenance: 0,
        facilities: ["Furnished", "Parking", "Geyser", "Wi-Fi", "Bed", "Cupboard", "Study Table"],
        description: "Peaceful independent room in 1st floor family house. Independent entry, private balcony, suitable for sincere college students.",
        media: [{
            kind: "image",
            url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
        }],
                booked: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 21600 }
    }
];

function getStoredListings() {
    try {
        const local = localStorage.getItem("rentstuds_local_listings");
        if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return DEFAULT_SAMPLE_LISTINGS;
}

function saveStoredListings(listings) {
    try {
        localStorage.setItem("rentstuds_local_listings", JSON.stringify(listings));
    } catch (e) {}
}

function getStoredChats() {
    try {
        const local = localStorage.getItem("rentstuds_local_chats");
        if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return [
        {
            id: "chat_mits-seed-1_demo",
            listingId: "mits-seed-1",
            listingTitle: "Sagar Boys Hostel near MITS Gate 1",
            ownerId: "sample-owner-1",
            ownerName: "Sunil Rajput",
            studentId: "demo-student-mits",
            studentName: "Aman Verma",
            participantIds: ["demo-student-mits", "sample-owner-1"],
            studentAcceptedNumber: true,
            ownerAcceptedNumber: true,
            studentPhone: "+91 91111 22334",
            ownerPhone: "+91 98260 54321",
            booked: false,
            bookedAt: null,
            lastMessage: "Hi, is this room still available?",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 }
        }
    ];
}

function saveStoredChats(chats) {
    try {
        localStorage.setItem("rentstuds_local_chats", JSON.stringify(chats));
    } catch (e) {}
}

function getStoredMessages(chatId) {
    try {
        const local = localStorage.getItem("rentstuds_local_msgs_" + chatId);
        if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return [
        {
            id: "msg-welcome-" + chatId,
            senderId: "system",
            senderName: "Rent Studs",
            text: "Welcome to Rent Studs chat! Ask about rent, amenities, or visiting times.",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 }
        },
        {
            id: "msg-seed-1-" + chatId,
            senderId: "sample-owner-1",
            senderName: "Sunil Rajput (Hostel)",
            text: "Hello! Welcome to Sagar Boys Hostel. Let me know when you would like to visit.",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 }
        }
    ];
}

function saveStoredMessages(chatId, messages) {
    try {
        localStorage.setItem("rentstuds_local_msgs_" + chatId, JSON.stringify(messages));
    } catch (e) {}
}


function previewImages(event) {
    const container = document.getElementById("media-preview-container");
    if (!container) return;
    container.innerHTML = "";
    const files = event.target.files;
    if (!files || !files.length) return;

    for (let i = 0; i < Math.min(files.length, 4); i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "preview-thumb";
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}



const app =
    document.getElementById("app");



/* ==========================================
   HELPERS
========================================== */


function escapeHTML(
    value = ""
) {

    return String(value)
        .replace(
            /[&<>"']/g,
            char => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[char])
        );

}



function money(
    value
) {

    return new Intl.NumberFormat(
        "en-IN"
    ).format(
        Number(value || 0)
    );

}



function toast(
    message
) {

    const root =
        document.getElementById(
            "toast-root"
        );


    if (!root) {

        return;

    }


    root.innerHTML = `

        <div class="toast">

            ${escapeHTML(
                message
            )}

        </div>

    `;


    setTimeout(
        () => {

            root.innerHTML = "";

        },
        3000
    );

}



function go(
    page
) {

    state.page =
        page;

    render();

}



/* ==========================================
   LANDING
========================================== */


function landingPage() {

    return `

        <main class="hero">


            <div class="
                hero-inner
            ">


                <span class="
                    hero-badge
                ">

                    ✦ MITS Gwalior
                    • Student Accommodation

                </span>



                <h1>

                    Find a stay that

                    <br>

                    <span>
                        fits your life.
                    </span>

                </h1>



                <p class="
                    hero-description
                ">

                    Discover rooms, PGs
                    and hostels around MITS
                    based on your budget,
                    distance, facilities
                    and lifestyle.

                    <br><br>

                    <strong>

                        Don't just find a room.
                        Find YOUR right room.

                    </strong>

                </p>



                <div class="
                    role-grid
                ">


                    <section
                        class="role-card">


                        <div class="
                            role-icon
                        ">

                            🏠

                        </div>


                        <h2>
                            Property Provider
                        </h2>


                        <p>

                            List your hostel,
                            PG or house room,
                            connect with students
                            and connect directly
                            with students.

                        </p>


                        <button
                            class="
                                btn
                                btn-primary
                            "

                            onclick="
                                window.rentStuds
                                .chooseRole(
                                    'owner'
                                )
                            ">

                            List Your Property →

                        </button>


                    </section>



                    <section
                        class="role-card">


                        <div class="
                            role-icon
                        ">

                            🎓

                        </div>


                        <h2>
                            Student
                        </h2>


                        <p>

                            Find the best stays
                            around MITS based on
                            rent, distance,
                            sharing and facilities.

                        </p>


                        <button
                            class="
                                btn
                                btn-primary
                            "

                            onclick="
                                window.rentStuds
                                .chooseRole(
                                    'student'
                                )
                            ">

                            Find My Stay →

                        </button>


                    </section>


                </div>


            </div>


        </main>

    `;

}



/* ==========================================
   LOGIN
========================================== */


function loginPage() {
    const isFileProto = window.location.protocol === "file:";

    return `
        <main class="login-page">
            <section class="login-card">
                <div class="brand">
                    Rent <span>Studs</span>
                </div>

                <h2 style="margin-top:15px">
                    ${state.role === "owner"
                        ? "Property Provider Login"
                        : "Student Login"}
                </h2>

                <p class="muted" style="margin-top:8px">
                    Sign in to list rooms or discover verified stays around MITS Gwalior.
                </p>

                ${isFileProto ? `
                    <div class="protocol-warning">
                        <strong>⚠️ Notice (file:// protocol):</strong><br>
                        You opened this file directly. Browsers restrict Google Sign-In popups on file:// URLs.<br>
                        Please run <code>python server.py</code> or <code>run.bat</code>, or use <strong>Quick Demo Mode</strong> below!
                    </div>
                ` : ''}

                <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px;">
                    <button
                        class="google-btn"
                        onclick="window.rentStuds.login()">
                        🔵 Continue with Google
                    </button>

                    <div class="demo-divider">
                        <span>OR INSTANT DEMO ACCESS</span>
                    </div>

                    <div class="demo-btn-group">
                        <button
                            class="btn-demo btn-demo-student"
                            onclick="window.rentStuds.demoLogin('student')">
                            🎓 Demo as Student
                        </button>

                        <button
                            class="btn-demo btn-demo-owner"
                            onclick="window.rentStuds.demoLogin('owner')">
                            🏠 Demo as Property Owner
                        </button>
                    </div>

                    <button
                        class="btn btn-outline"
                        onclick="window.rentStuds.go('landing')">
                        ← Back to Home
                    </button>
                </div>
            </section>
        </main>
    `;
}

function chooseRole(role) {
    if (role !== "owner" && role !== "student") return;
    state.role = role;
    go("login");
}

async function login() {
    if (window.location.protocol === "file:") {
        toast("Google Sign-In requires an HTTP server. Run 'server.py' or use Demo Login.");
        return;
    }

    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Popup login error:", error);
        if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
            try {
                toast("Popup blocked by browser. Redirecting to Google Sign-In...");
                await signInWithRedirect(auth, googleProvider);
                return;
            } catch (redirError) {
                console.error("Redirect login error:", redirError);
            }
        }
        toast(error.message || "Google login failed. You can use Demo Mode to test immediately.");
    }
}

function demoLogin(role = state.role || "student") {
    state.role = role;
    state.user = {
        uid: role === "owner" ? "demo-owner-mits" : "demo-student-mits",
        displayName: role === "owner" ? "Rajesh Sharma (Property Host)" : "Aman Verma (MITS Student)",
        email: role === "owner" ? "rajesh.hostel@rentstuds.com" : "aman.verma@mitsgwalior.in",
        photoURL: role === "owner"
            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
            : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
        isDemo: true
    };
    state.profile = {
        uid: state.user.uid,
        name: state.user.displayName,
        email: state.user.email,
        photoURL: state.user.photoURL,
        phone: role === "owner" ? "+91 98260 11223" : "+91 91111 22334",
        role: role
    };
    subscribeToData();
    state.page = role === "owner" ? "ownerHome" : "studentHome";
    toast(`Welcome! Logged in as ${role === "owner" ? "Property Owner" : "Student"}.`);
    render();
}

function switchRole(targetRole) {
    state.role = targetRole;
    if (state.profile) {
        state.profile.role = targetRole;
    }
    state.page = targetRole === "owner" ? "ownerHome" : "studentHome";
    subscribeToData();
    toast(`Switched to ${targetRole === "owner" ? "Property Owner" : "Student"} View`);
    render();
}



/* ==========================================
   USER PROFILE
========================================== */


async function loadProfile() {

    const userRef =
        doc(
            db,
            "users",
            state.user.uid
        );


    const snapshot =
        await getDoc(
            userRef
        );


    if (
        !snapshot.exists()
    ) {

        state.profile = {

            uid:
                state.user.uid,

            name:
                state.user.displayName ||
                "Rent Studs User",

            email:
                state.user.email ||
                "",

            photoURL:
                state.user.photoURL ||
                "",

            phone:
                "",

            role:
                state.role ||
                "student"

        };


        await setDoc(
            userRef,
            state.profile
        );


    } else {

        state.profile =
            snapshot.data();


        state.role =
            state.profile.role ||
            state.role ||
            "student";


        if (
            !state.profile.role
        ) {

            await updateDoc(
                userRef,
                {

                    role:
                        state.role

                }
            );


            state.profile.role =
                state.role;

        }

    }

}



/* ==========================================
   TOP BAR
========================================== */


function topbar() {
    const isOwner = state.role === "owner";
    const otherRole = isOwner ? "student" : "owner";
    const otherLabel = isOwner ? "🎓 Switch to Student View" : "🏠 Switch to Owner View";

    return `
        <header class="topbar">
            <button
                class="brand"
                onclick="window.rentStuds.go('${isOwner ? "ownerHome" : "studentHome"}')">
                Rent <span>Studs</span>
                <span class="role-pill ${isOwner ? 'role-owner' : 'role-student'}">
                    ${isOwner ? 'Owner' : 'Student'}
                </span>
            </button>

            <div class="topbar-actions">
                <button
                    class="btn btn-role-switch"
                    onclick="window.rentStuds.switchRole('${otherRole}')"
                    title="Switch perspective to see how the other side looks">
                    ${otherLabel}
                </button>

                <span class="topbar-user small">
                    ${escapeHTML(state.profile?.name || state.user?.displayName || "")}
                </span>

                <button
                    class="btn btn-outline"
                    onclick="window.rentStuds.logout()">
                    Logout
                </button>
            </div>
        </header>
    `;
}



/* ==========================================
   BOTTOM NAV
========================================== */


function bottomNav(
    active
) {

    if (
        state.role ===
        "owner"
    ) {

        return `

            <nav class="
                bottom-nav
            ">


                <button
                    class="
                        nav-btn
                        ${
                            active === "home"
                            ? "active"
                            : ""
                        }
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'ownerHome'
                        )
                    ">

                    🏠

                    <span>
                        Home
                    </span>

                </button>



                <button
                    class="
                        nav-btn
                        ${
                            active === "chat"
                            ? "active"
                            : ""
                        }
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'chat'
                        )
                    ">

                    💬

                    <span>
                        Chat
                    </span>

                </button>



                <button
                    class="
                        nav-plus
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'create'
                        )
                    ">

                    +

                </button>



                <button
                    class="
                        nav-btn
                        ${
                            active === "profile"
                            ? "active"
                            : ""
                        }
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'profile'
                        )
                    ">

                    👤

                    <span>
                        Me
                    </span>

                </button>


            </nav>

        `;

    }


    return `

        <nav class="
            bottom-nav
        ">


            <button
                class="
                    nav-btn
                    ${
                        active === "home"
                        ? "active"
                        : ""
                    }
                "

                onclick="
                    window.rentStuds
                    .go(
                        'studentHome'
                    )
                ">

                🏠

                <span>
                    Home
                </span>

            </button>



            <button
                class="
                    nav-btn
                    ${
                        active === "chat"
                        ? "active"
                        : ""
                    }
                "

                onclick="
                    window.rentStuds
                    .go(
                        'chat'
                    )
                ">

                💬

                <span>
                    Chat
                </span>

            </button>



            <button
                class="
                    nav-btn
                    ${
                        active === "profile"
                        ? "active"
                        : ""
                    }
                "

                onclick="
                    window.rentStuds
                    .go(
                        'profile'
                    )
                ">

                👤

                <span>
                    Me
                </span>

            </button>


        </nav>

    `;

}



/* ==========================================
   PROVIDER HOME
========================================== */


function ownerHome() {
    const mine = state.listings.filter(
        listing => listing.ownerId === state.user.uid
    );

    const available = mine.filter(listing => !listing.booked).length;
    const booked = mine.filter(listing => listing.booked).length;

    return `
        <div>
            ${topbar()}

            <main class="container page">
                <div class="heading">
                    <div>
                        <h1>My Listings</h1>
                        <p>Manage your properties and room availability.</p>
                    </div>

                    <button
                        class="btn btn-primary"
                        onclick="window.rentStuds.go('create')">
                        + Add Listing
                    </button>
                </div>

                <div class="kpi-row">
                    <div class="card kpi">
                        <div class="small">Total Listings</div>
                        <div class="kpi-number">${mine.length}</div>
                    </div>

                    <div class="card kpi">
                        <div class="small">Available</div>
                        <div class="kpi-number">${available}</div>
                    </div>

                    <div class="card kpi">
                        <div class="small">Booked</div>
                        <div class="kpi-number">${booked}</div>
                    </div>
                </div>



                ${
                    mine.length

                    ?

                    `

                    <div class="
                        grid-3
                    ">

                        ${mine
                            .map(
                                ownerCard
                            )
                            .join("")}

                    </div>

                    `

                    :

                    `

                    <div class="
                        card
                        empty
                    ">

                        <div class="
                            empty-icon
                        ">

                            🏠

                        </div>


                        <h2>

                            No Listings Yet

                        </h2>


                        <p>

                            Add your first
                            student-friendly
                            property.

                        </p>


                        <button
                            class="
                                btn
                                btn-primary
                            "

                            onclick="
                                window.rentStuds
                                .go(
                                    'create'
                                )
                            ">

                            Create Listing

                        </button>


                    </div>

                    `

                }


            </main>


            ${bottomNav("home")}


        </div>

    `;

}



/* ==========================================
   PROVIDER CARD
========================================== */


function ownerCard(
    listing
) {

    const image =
        listing.media?.find(
            media =>
                media.kind ===
                "image"
        )?.url;


    return `

        <article class="
            card
            listing-card
        ">


            <div class="
                listing-media
            ">


                ${
                    image

                    ?

                    `<img
                        src="${escapeHTML(
                            image
                        )}"
                        alt="${escapeHTML(
                            listing.title
                        )}"
                    >`

                    :

                    `<div class="
                        media-placeholder
                    ">

                        🏠

                    </div>`

                }


                <span class="
                    media-chip
                ">

                    ${escapeHTML(
                        listing.type
                    )}

                </span>


            </div>



            <div class="
                listing-body
            ">


                <div class="badges">
                    ${
                        listing.booked
                        ? `<span class="badge badge-booked">BOOKED</span>`
                        : `<span class="badge badge-neutral">AVAILABLE</span>`
                    }
                </div>


                <h3>

                    ${escapeHTML(
                        listing.title
                    )}

                </h3>


                <div class="meta">

                    📍

                    ${escapeHTML(
                        listing.location
                    )}

                    •

                    ${
                        listing.distance ||
                        0
                    }

                    km

                </div>


                <div class="
                    price-row
                ">

                    <span class="
                        price
                    ">

                        ₹${money(
                            listing.price
                        )}

                    </span>


                    <span class="
                        small
                    ">

                        ${escapeHTML(
                            listing.sharing
                        )}

                    </span>


                </div>


                <div class="tags">

                    ${
                        (
                            listing.facilities ||
                            []
                        )
                        .slice(
                            0,
                            4
                        )
                        .map(
                            item =>
                                `<span class="tag">
                                    ${escapeHTML(
                                        item
                                    )}
                                </span>`
                        )
                        .join("")
                    }

                </div>


                <button
                    class="
                        btn
                        btn-outline
                        btn-block
                    "

                    onclick="
                        window.rentStuds
                        .openOwner(
                            '${listing.id}'
                        )
                    ">

                    Manage Listing

                </button>


            </div>


        </article>

    `;

}



/* ==========================================
   CREATE LISTING
========================================== */


function createListingPage() {

    const facilities = [

        "Wi-Fi",
        "AC",
        "Geyser",
        "Parking",
        "Furnished",
        "Bed",
        "Study Table",
        "Cupboard",
        "Laundry",
        "CCTV",
        "Power Backup",
        "Food/Mess"

    ];


    return `

        <div>


            ${topbar()}


            <main class="
                container
                page
            ">


                <div class="heading">


                    <div>

                        <h1>
                            Create a Listing
                        </h1>

                        <p>

                            Add complete property
                            information.

                        </p>

                    </div>


                </div>



                <form
                    id="listing-form"
                    class="
                        card
                        form-card
                    ">


                    <div class="
                        form-grid
                    ">


                        <div class="
                            field
                            full
                        ">

                            <label>
                                Stay Type *
                            </label>

                            <select
                                name="type"
                                required>

                                <option value="">
                                    Choose stay type
                                </option>

                                <option>
                                    Hostel
                                </option>

                                <option>
                                    PG
                                </option>

                                <option>
                                    House Room
                                </option>

                            </select>

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Listing Title *
                            </label>

                            <input
                                name="title"
                                required

                                placeholder="
                                    Modern PG near MITS
                                ">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Monthly Rent *
                            </label>

                            <input
                                name="price"
                                type="number"
                                min="0"
                                required

                                placeholder="6500">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Location *
                            </label>

                            <input
                                name="location"
                                required

                                placeholder="
                                    Thatipur, Gwalior
                                ">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Distance from MITS (km)
                            </label>

                            <input
                                name="distance"
                                type="number"
                                min="0"
                                step="0.1"

                                placeholder="2.5">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Sharing
                            </label>

                            <select
                                name="sharing">

                                <option>
                                    Single
                                </option>

                                <option>
                                    2 Sharing
                                </option>

                                <option>
                                    3 Sharing
                                </option>

                                <option>
                                    4+ Sharing
                                </option>

                            </select>

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Move-in / Entry Window
                            </label>

                            <input
                                name="arrival"

                                placeholder="
                                    Available after 2 PM
                                ">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Smoking
                            </label>

                            <select
                                name="smoking">

                                <option>
                                    Not Allowed
                                </option>

                                <option>
                                    Allowed
                                </option>

                                <option>
                                    Outside Only
                                </option>

                            </select>

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Food / Mess
                            </label>

                            <select
                                name="food">

                                <option>
                                    Not Available
                                </option>

                                <option>
                                    Available
                                </option>

                                <option>
                                    Optional
                                </option>

                            </select>

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Electricity / Month
                            </label>

                            <input
                                name="electricity"
                                type="number"
                                min="0"
                                value="0">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Wi-Fi / Month
                            </label>

                            <input
                                name="wifi"
                                type="number"
                                min="0"
                                value="0">

                        </div>



                        <div class="
                            field
                        ">

                            <label>
                                Maintenance / Month
                            </label>

                            <input
                                name="maintenance"
                                type="number"
                                min="0"
                                value="0">

                        </div>



                        <div class="
                            field
                            full
                        ">

                            <label>
                                Facilities
                            </label>


                            <div class="
                                check-grid
                            ">


                                ${
                                    facilities
                                    .map(
                                        facility => `

                                        <label class="
                                            check
                                        ">

                                            <input
                                                type="checkbox"
                                                name="facility"
                                                value="${facility}"
                                            >

                                            ${facility}

                                        </label>

                                        `
                                    )
                                    .join("")
                                }


                            </div>


                        </div>



                        <div class="
                            field
                            full
                        ">

                            <label>
                                Custom Facilities
                            </label>

                            <input
                                name="
                                    customFacilities
                                "

                                placeholder="
                                    Balcony, Lift, RO Water
                                ">

                        </div>



                        <div class="
                            field
                            full
                        ">

                            <label>
                                Description & Rules
                            </label>

                            <textarea
                                name="
                                    description
                                "

                                placeholder="
                                    Visitor rules,
                                    gate timing,
                                    deposit,
                                    house rules,
                                    etc.
                                "></textarea>

                        </div>



                        <div class="field full">
                            <label>Room Photos</label>
                            <input
                                name="media"
                                id="listing-media-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onchange="window.rentStuds.previewImages(event)">
                            <div id="media-preview-container" class="preview-grid" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;"></div>
                            <span class="small">Upload photos of the room/stay. If left empty, high quality default photos are automatically assigned.</span>
                        </div>


                    </div>



                    <div class="
                        form-actions
                    ">


                        <button
                            type="button"
                            class="
                                btn
                                btn-outline
                            "

                            onclick="
                                window.rentStuds
                                .go(
                                    'ownerHome'
                                )
                            ">

                            Cancel

                        </button>


                        <button
                            type="submit"
                            class="
                                btn
                                btn-primary
                            ">

                            Publish Listing

                        </button>


                    </div>


                </form>


            </main>


            ${bottomNav("home")}


        </div>

    `;

}



/* ==========================================
   CREATE LISTING
========================================== */


async function submitListing(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
        const facilities = [
            ...form.querySelectorAll('[name="facility"]:checked')
        ].map(item => item.value);

        const custom = String(data.get("customFacilities") || "");
        custom
            .split(",")
            .map(x => x.trim())
            .filter(Boolean)
            .forEach(x => facilities.push(x));

        // Process media photos
        const mediaFiles = form.querySelector('[name="media"]')?.files;
        let mediaItems = [];

        if (mediaFiles && mediaFiles.length > 0) {
            for (let i = 0; i < Math.min(mediaFiles.length, 3); i++) {
                const file = mediaFiles[i];
                try {
                    const dataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(file);
                    });
                    if (dataUrl) {
                        mediaItems.push({ kind: "image", url: dataUrl });
                    }
                } catch (err) {
                    console.warn("Could not read image file:", err);
                }
            }
        }

        // Beautiful curated fallback image if no photo uploaded
        if (mediaItems.length === 0) {
            const stayType = data.get("type");
            let defaultImg = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
            if (stayType === "PG") {
                defaultImg = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80";
            } else if (stayType === "House Room") {
                defaultImg = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";
            }
            mediaItems.push({ kind: "image", url: defaultImg });
        }

        const newListingData = {
            ownerId: state.user.uid,
            ownerName: state.profile?.name || state.user?.displayName || "Property Provider",
            title: data.get("title"),
            type: data.get("type"),
            price: Number(data.get("price") || 0),
            location: data.get("location"),
            distance: Number(data.get("distance") || 0),
            sharing: data.get("sharing") || "Single",
            arrival: data.get("arrival") || "",
            smoking: data.get("smoking") || "Not Allowed",
            food: data.get("food") || "Not Available",
            electricity: Number(data.get("electricity") || 0),
            wifi: Number(data.get("wifi") || 0),
            maintenance: Number(data.get("maintenance") || 0),
            facilities: facilities,
            description: data.get("description") || "",
            media: mediaItems,
            booked: false,
            createdAt: serverTimestamp()
        };

        let createdId = "listing-" + Date.now();
        try {
            if (!state.user.isDemo) {
                const docRef = await addDoc(collection(db, "listings"), newListingData);
                createdId = docRef.id;
            }
        } catch (dbError) {
            console.warn("Firestore save failed, using local storage sync:", dbError);
        }

        const createdListing = {
            id: createdId,
            ...newListingData,
            createdAt: { seconds: Math.floor(Date.now() / 1000) }
        };

        state.listings.unshift(createdListing);
        saveStoredListings(state.listings);

        toast("Listing published! It is now live on the student interface.");
        go("ownerHome");

    } catch (error) {
        console.error(error);
        toast(error.message || "Could not create listing.");
    }
}



/* ==========================================
   OWNER DETAILS
========================================== */


function openOwner(
    id
) {

    state.selectedListing =
        id;

    go("ownerDetails");

}



function ownerDetailsPage() {

    const listing =
        state.listings.find(
            item =>
                item.id ===
                state.selectedListing
        );


    if (!listing) {

        return `
            <div class="
                container
                page
            ">

                <div class="
                    card
                    empty
                ">

                    <h2>
                        Listing not found
                    </h2>

                </div>

            </div>
        `;

    }


    const images =
        (
            listing.media ||
            []
        ).filter(
            media =>
                media.kind ===
                "image"
        );


    return `

        <div>


            ${topbar()}


            <main class="
                container
                page
            ">


                <button
                    class="
                        btn
                        btn-outline
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'ownerHome'
                        )
                    ">

                    ← Back

                </button>


                <br><br>



                <div class="
                    detail-grid
                ">


                    <section>


                        <div class="
                            gallery
                        ">


                            <div class="
                                gallery-main
                            ">

                                ${
                                    images[0]

                                    ?

                                    `<img
                                        src="${escapeHTML(
                                            images[0].url
                                        )}"
                                        alt=""
                                    >`

                                    :

                                    `<div
                                        class="
                                            media-placeholder
                                        ">

                                        🏠

                                    </div>`

                                }

                            </div>


                            <div class="
                                gallery-side
                            ">


                                ${
                                    images[1]

                                    ?

                                    `<div>
                                        <img
                                            src="${escapeHTML(
                                                images[1].url
                                            )}"
                                            alt=""
                                        >
                                    </div>`

                                    :

                                    `<div class="
                                        media-placeholder
                                    ">
                                        Room
                                    </div>`

                                }


                                ${
                                    images[2]

                                    ?

                                    `<div>
                                        <img
                                            src="${escapeHTML(
                                                images[2].url
                                            )}"
                                            alt=""
                                        >
                                    </div>`

                                    :

                                    `<div class="
                                        media-placeholder
                                    ">
                                        View
                                    </div>`

                                }


                            </div>


                        </div>



                        <div class="
                            card
                            detail-card
                        ">


                            <div class="
                                badges
                            ">


                                <span class="
                                    badge
                                    ${
                                        listing.verified
                                        ? "badge-verified"
                                        : "badge-unverified"
                                    }
                                ">

                                    ${
                                        listing.verified
                                        ? "✓ VERIFIED"
                                        : "⚠ UNVERIFIED"
                                    }

                                </span>


                                <span class="
                                    badge
                                    badge-neutral
                                ">

                                    ${escapeHTML(
                                        listing.type
                                    )}

                                </span>


                            </div>


                            <h2>

                                ${escapeHTML(
                                    listing.title
                                )}

                            </h2>


                            <div class="
                                meta
                            ">

                                📍

                                ${escapeHTML(
                                    listing.location
                                )}

                            </div>


                            <div class="
                                price-row
                            ">

                                <span class="
                                    price
                                ">

                                    ₹${money(
                                        listing.price
                                    )}

                                </span>


                                <span class="
                                    small
                                ">

                                    ${escapeHTML(
                                        listing.sharing
                                    )}

                                </span>

                            </div>


                            <h3>
                                Description & Rules
                            </h3>


                            <p>

                                ${escapeHTML(
                                    listing.description ||
                                    "No description."
                                )}

                            </p>


                            <h3>
                                Facilities
                            </h3>


                            <div class="
                                facilities
                            ">


                                ${
                                    (
                                        listing.facilities ||
                                        []
                                    )

                                    .map(
                                        facility =>
                                            `<div class="
                                                facility
                                            ">

                                                ✓
                                                ${escapeHTML(
                                                    facility
                                                )}

                                            </div>`
                                    )

                                    .join("")
                                }


                            </div>


                        </div>


                    </section>



                    <aside class="
                        sticky-card
                    ">


                        <div class="
                            cost-box
                        ">


                            <div class="
                                cost-label
                            ">

                                Estimated Monthly Cost

                            </div>


                            <div class="
                                cost-value
                            ">

                                ₹${money(

                                    (
                                        listing.price ||
                                        0
                                    )

                                    +

                                    (
                                        listing.electricity ||
                                        0
                                    )

                                    +

                                    (
                                        listing.wifi ||
                                        0
                                    )

                                    +

                                    (
                                        listing.maintenance ||
                                        0
                                    )

                                )}

                            </div>

                        </div>






                    </aside>


                </div>


            </main>


            ${bottomNav("home")}

        </div>

    `;

}







/* ==========================================
   STUDENT HOME
========================================== */


function studentHome() {

    return `

        <div>


            ${topbar()}


            <main class="
                container
                page
            ">


                <div class="
                    heading
                ">


                    <div>

                        <h1>
                            Find Your Stay
                        </h1>

                        <p>

                            Accommodations around MITS.

                        </p>

                    </div>


                </div>



                <div class="
                    tabs
                ">


                    <button
                        class="
                            tab
                            active
                        "
                        data-type="">

                        All Stays

                    </button>


                    <button
                        class="
                            tab
                        "
                        data-type="Hostel">

                        Hostel

                    </button>


                    <button
                        class="
                            tab
                        "
                        data-type="PG">

                        PG

                    </button>


                    <button
                        class="
                            tab
                        "
                        data-type="House Room">

                        House Rooms

                    </button>


                </div>



                <div class="
                    search-row
                ">


                    <input
                        id="student-search"
                        class="search"

                        placeholder="
                            Search area or property...
                        ">


                    <select
                        id="student-sort"
                        class="search">

                        <option value="">
                            Sort
                        </option>

                        <option value="priceAsc">

                            Lowest Price

                        </option>

                        <option value="priceDesc">

                            Highest Price

                        </option>

                        <option value="distance">

                            Closest to MITS

                        </option>


                    </select>


                </div>



                <div class="
                    filters
                ">


                    <select
                        id="filter-sharing">

                        <option value="">
                            Sharing
                        </option>

                        <option>
                            Single
                        </option>

                        <option>
                            2 Sharing
                        </option>

                        <option>
                            3 Sharing
                        </option>

                        <option>
                            4+ Sharing
                        </option>

                    </select>



                    <select
                        id="filter-smoking">

                        <option value="">
                            Smoking
                        </option>

                        <option>
                            Not Allowed
                        </option>

                        <option>
                            Allowed
                        </option>

                        <option>
                            Outside Only
                        </option>

                    </select>



                    <select
                        id="filter-food">

                        <option value="">
                            Food / Mess
                        </option>

                        <option>
                            Available
                        </option>

                        <option>
                            Optional
                        </option>

                        <option>
                            Not Available
                        </option>

                    </select>



                    <select
                        id="filter-facility">

                        <option value="">
                            Facility
                        </option>

                        <option>
                            Wi-Fi
                        </option>

                        <option>
                            AC
                        </option>

                        <option>
                            Geyser
                        </option>

                        <option>
                            Parking
                        </option>

                        <option>
                            Furnished
                        </option>

                    </select>



                    <select
                        id="filter-price">

                        <option value="">
                            Max Rent
                        </option>

                        <option value="5000">
                            ₹5,000
                        </option>

                        <option value="7000">
                            ₹7,000
                        </option>

                        <option value="10000">
                            ₹10,000
                        </option>

                        <option value="15000">
                            ₹15,000
                        </option>

                    </select>




                </div>



                <div
                    id="student-results"
                    class="grid-3">

                </div>


            </main>


            ${bottomNav("home")}


        </div>

    `;

}



/* ==========================================
   STUDENT FILTERS
========================================== */


function setupStudentFilters() {

    const filterState = {

        type:
            ""

    };


    document
        .querySelectorAll(".tab")
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".tab"
                            )
                            .forEach(
                                item =>
                                    item.classList
                                        .remove(
                                            "active"
                                        )
                            );


                        tab.classList.add(
                            "active"
                        );


                        filterState.type =
                            tab.dataset.type;


                        applyStudentFilters(
                            filterState
                        );

                    }
                );

            }
        );


    [
        "#student-search",
        "#student-sort",
        "#filter-sharing",
        "#filter-smoking",
        "#filter-food",
        "#filter-facility",
        "#filter-price",
    ].forEach(
        selector => {

            document
                .querySelector(
                    selector
                )
                ?.addEventListener(
                    "input",
                    () =>
                        applyStudentFilters(
                            filterState
                        )
                );

        }
    );


    applyStudentFilters(
        filterState
    );

}



/* ==========================================
   FILTER
========================================== */


function applyStudentFilters(
    filterState
) {

    let listings = [...state.listings];



    const search =
        (
            document.querySelector(
                "#student-search"
            )?.value ||
            ""
        )
        .toLowerCase();


    const sharing =
        document.querySelector(
            "#filter-sharing"
        )?.value ||
        "";


    const smoking =
        document.querySelector(
            "#filter-smoking"
        )?.value ||
        "";


    const food =
        document.querySelector(
            "#filter-food"
        )?.value ||
        "";


    const facility =
        document.querySelector(
            "#filter-facility"
        )?.value ||
        "";


    const maxPrice =
        Number(
            document.querySelector(
                "#filter-price"
            )?.value ||
            0
        );


    const sort =
        document.querySelector(
            "#student-sort"
        )?.value ||
        "";



    if (
        filterState.type
    ) {

        listings =
            listings.filter(
                listing =>
                    listing.type ===
                    filterState.type
            );

    }


    if (search) {

        listings =
            listings.filter(
                listing =>

                    (
                        listing.title ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        search
                    )

                    ||

                    (
                        listing.location ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        search
                    )
            );

    }


    if (sharing) {

        listings =
            listings.filter(
                listing =>
                    listing.sharing ===
                    sharing
            );

    }


    if (smoking) {

        listings =
            listings.filter(
                listing =>
                    listing.smoking ===
                    smoking
            );

    }


    if (food) {

        listings =
            listings.filter(
                listing =>
                    listing.food ===
                    food
            );

    }


    if (facility) {

        listings =
            listings.filter(
                listing =>
                    (
                        listing.facilities ||
                        []
                    ).includes(
                        facility
                    )
            );

    }


    if (maxPrice) {

        listings =
            listings.filter(
                listing =>
                    Number(
                        listing.price ||
                        0
                    ) <=
                    maxPrice
            );

    }


    if (
        sort ===
        "priceAsc"
    ) {

        listings.sort(
            (a,b) =>
                Number(
                    a.price || 0
                )
                -
                Number(
                    b.price || 0
                )
        );

    }


    if (
        sort ===
        "priceDesc"
    ) {

        listings.sort(
            (a,b) =>
                Number(
                    b.price || 0
                )
                -
                Number(
                    a.price || 0
                )
        );

    }


    if (
        sort ===
        "distance"
    ) {

        listings.sort(
            (a,b) =>
                Number(
                    a.distance || 0
                )
                -
                Number(
                    b.distance || 0
                )
        );

    }


    const root =
        document.getElementById(
            "student-results"
        );


    if (!root) return;


    if (!listings.length) {

        root.innerHTML = `

            <div
                class="
                    card
                    empty
                "

                style="
                    grid-column:
                    1 / -1;
                ">


                <div class="
                    empty-icon
                ">

                    🔎

                </div>


                <h2>

                    No Stays Match Your Filters

                </h2>


                <p>

                    Try changing
                    your filters.

                </p>


            </div>

        `;


        return;

    }


    root.innerHTML =
        listings
            .map(
                studentCard
            )
            .join("");

}



/* ==========================================
   STUDENT CARD
========================================== */


function studentCard(
    listing
) {

    const image =
        listing.media?.find(
            media =>
                media.kind ===
                "image"
        )?.url;


    const totalCost =

        Number(
            listing.price ||
            0
        )

        +

        Number(
            listing.electricity ||
            0
        )

        +

        Number(
            listing.wifi ||
            0
        )

        +

        Number(
            listing.maintenance ||
            0
        );


    return `

        <article class="
            card
            listing-card
        ">


            <div class="
                listing-media
            ">


                ${
                    image

                    ?

                    `<img
                        src="${escapeHTML(
                            image
                        )}"
                        alt="${escapeHTML(
                            listing.title
                        )}"
                    >`

                    :

                    `<div class="
                        media-placeholder
                    ">

                        🏠

                    </div>`

                }


                <span class="
                    media-chip
                ">

                    ${escapeHTML(
                        listing.type
                    )}

                </span>


            </div>



            <div class="
                listing-body
            ">


                <div class="badges">
                    ${
                        listing.booked
                        ? `<span class="badge badge-booked">BOOKED</span>`
                        : `<span class="badge badge-neutral">AVAILABLE</span>`
                    }
                </div>


                <h3>

                    ${escapeHTML(
                        listing.title
                    )}

                </h3>


                <div class="
                    meta
                ">

                    📍

                    ${escapeHTML(
                        listing.location
                    )}

                    •

                    ${
                        listing.distance ||
                        0
                    }

                    km

                </div>


                <div class="
                    price-row
                ">


                    <span class="
                        price
                    ">

                        ₹${money(
                            listing.price
                        )}

                    </span>


                    <span class="
                        small
                    ">

                        ₹${money(
                            totalCost
                        )}

                        est. total

                    </span>


                </div>


                <div class="
                    tags
                ">


                    ${
                        (
                            listing.facilities ||
                            []
                        )

                        .slice(
                            0,
                            4
                        )

                        .map(
                            item =>
                                `<span class="tag">
                                    ${escapeHTML(
                                        item
                                    )}
                                </span>`
                        )

                        .join("")
                    }


                </div>


                <button
                    class="
                        btn
                        btn-primary
                        btn-block
                    "

                    onclick="
                        window.rentStuds
                        .openStudent(
                            '${listing.id}'
                        )
                    ">

                    More Details

                </button>


            </div>


        </article>

    `;

}



/* ==========================================
   STUDENT DETAILS
========================================== */


function openStudent(
    id
) {

    state.selectedListing =
        id;

    go("studentDetails");

}



function studentDetailsPage() {

    const listing =
        state.listings.find(
            item =>
                item.id ===
                state.selectedListing
        );


    if (!listing) {

        return `

            <div class="
                container
                page
            ">

                <div class="
                    card
                    empty
                ">

                    <h2>
                        Listing not found
                    </h2>

                </div>

            </div>

        `;

    }


    const media =
        listing.media ||
        [];


    const images =
        media.filter(
            item =>
                item.kind ===
                "image"
        );


    const totalCost =

        Number(
            listing.price ||
            0
        )

        +

        Number(
            listing.electricity ||
            0
        )

        +

        Number(
            listing.wifi ||
            0
        )

        +

        Number(
            listing.maintenance ||
            0
        );


    const reviews =
        state.reviews[
            listing.id
        ] ||
        [];


    return `

        <div>


            ${topbar()}


            <main class="
                container
                page
            ">


                <button
                    class="
                        btn
                        btn-outline
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'studentHome'
                        )
                    ">

                    ← Back

                </button>


                <br><br>



                <div class="
                    detail-grid
                ">


                    <section>


                        <div class="
                            gallery
                        ">


                            <div class="
                                gallery-main
                            ">


                                ${
                                    images[0]

                                    ?

                                    `<img
                                        src="${escapeHTML(
                                            images[0].url
                                        )}"
                                        alt=""
                                    >`

                                    :

                                    `<div class="
                                        media-placeholder
                                    ">
                                        🏠
                                    </div>`

                                }


                            </div>


                            <div class="
                                gallery-side
                            ">


                                ${
                                    images[1]

                                    ?

                                    `<div>

                                        <img
                                            src="${escapeHTML(
                                                images[1].url
                                            )}"
                                            alt=""
                                        >

                                    </div>`

                                    :

                                    `<div class="
                                        media-placeholder
                                    ">
                                        Room
                                    </div>`

                                }


                                ${
                                    images[2]

                                    ?

                                    `<div>

                                        <img
                                            src="${escapeHTML(
                                                images[2].url
                                            )}"
                                            alt=""
                                        >

                                    </div>`

                                    :

                                    `<div class="
                                        media-placeholder
                                    ">
                                        View
                                    </div>`

                                }


                            </div>


                        </div>



                        <div class="
                            card
                            detail-card
                        ">


                            <div class="badges">
                                <span class="badge badge-neutral">
                                    ${escapeHTML(listing.type)}
                                </span>
                                ${
                                    listing.booked
                                    ? `<span class="badge badge-booked">BOOKED</span>`
                                    : `<span class="badge badge-neutral">AVAILABLE</span>`
                                }
                            </div>



                            <h2>

                                ${escapeHTML(
                                    listing.title
                                )}

                            </h2>



                            <div class="
                                meta
                            ">

                                📍

                                ${escapeHTML(
                                    listing.location
                                )}

                                •

                                ${
                                    listing.distance ||
                                    0
                                }

                                km from MITS

                            </div>



                            <div class="
                                price-row
                            ">


                                <span class="
                                    price
                                ">

                                    ₹${money(
                                        listing.price
                                    )}
                                    /month

                                </span>


                                <span class="
                                    small
                                ">

                                    ${escapeHTML(
                                        listing.sharing
                                    )}

                                </span>


                            </div>



                            <h3>

                                About this Stay

                            </h3>


                            <p>

                                ${escapeHTML(
                                    listing.description ||
                                    "No description."
                                )}

                            </p>



                            <h3>

                                Facilities

                            </h3>


                            <div class="
                                facilities
                            ">


                                ${
                                    (
                                        listing.facilities ||
                                        []
                                    )

                                    .map(
                                        item =>
                                            `<div class="
                                                facility
                                            ">

                                                ✓
                                                ${escapeHTML(
                                                    item
                                                )}

                                            </div>`
                                    )

                                    .join("")
                                }


                            </div>



                            <h3>

                                Important Information

                            </h3>



                            <div class="
                                tags
                            ">


                                <span class="
                                    tag
                                ">

                                    🕒
                                    ${escapeHTML(
                                        listing.arrival ||
                                        "Not specified"
                                    )}

                                </span>


                                <span class="
                                    tag
                                ">

                                    🚭
                                    ${escapeHTML(
                                        listing.smoking
                                    )}

                                </span>


                                <span class="
                                    tag
                                ">

                                    🍱
                                    ${escapeHTML(
                                        listing.food
                                    )}

                                </span>


                                <span class="
                                    tag
                                ">

                                    👥
                                    ${escapeHTML(
                                        listing.sharing
                                    )}

                                </span>


                            </div>


                        </div>



                        <div class="
                            card
                            detail-card
                        ">


                            <h2>

                                Student Reviews

                            </h2>


                            ${
                                reviews.length

                                ?

                                reviews

                                    .map(
                                        review => `

                                            <div class="
                                                review
                                            ">

                                                <strong>

                                                    ${escapeHTML(
                                                        review.name ||
                                                        "Student"
                                                    )}

                                                </strong>


                                                <div>

                                                    ⭐
                                                    ${review.rating}
                                                    /5

                                                </div>


                                                <p>

                                                    ${escapeHTML(
                                                        review.text
                                                    )}

                                                </p>

                                            </div>

                                        `
                                    )

                                    .join("")

                                :

                                `<p>
                                    No reviews yet.
                                </p>`

                            }


                        </div>


                    </section>



                    <aside class="
                        sticky-card
                    ">


                        <div class="
                            cost-box
                        ">


                            <div class="
                                cost-label
                            ">

                                Estimated Monthly Cost

                            </div>


                            <div class="
                                cost-value
                            ">

                                ₹${money(
                                    totalCost
                                )}

                            </div>


                            <div
                                style="
                                    font-size:
                                    12px;
                                    opacity:
                                    .85;
                                ">

                                Rent + listed recurring
                                expenses.

                            </div>


                        </div>



                        <div class="
                            card
                            detail-card
                        ">


                            <h2>

                                Interested?

                            </h2>


                            <p>

                                Start a conversation
                                with the provider.

                            </p>


                            <button
                                class="
                                    btn
                                    btn-primary
                                    btn-block
                                "

                                onclick="
                                    window.rentStuds
                                    .startChat(
                                        '${listing.id}'
                                    )
                                ">

                                💬 Chat With Provider

                            </button>


                        </div>


                    </aside>


                </div>


            </main>


            ${bottomNav("home")}


        </div>

    `;

}



/* ==========================================
   CHAT SYSTEM
========================================== */

async function startChat(listingId) {
    try {
        if (!state.user) {
            state.role = "student";
            toast("Please sign in or use Demo mode to chat.");
            go("login");
            return;
        }

        const listing = state.listings.find(item => item.id === listingId);
        if (!listing) {
            toast("Listing details could not be found.");
            return;
        }

        // Deterministic chatId for this listing and student
        const chatId = "chat_" + listing.id + "_" + state.user.uid;
        let chat = state.chats.find(c => c.id === chatId || (c.listingId === listing.id && c.studentId === state.user.uid));

        if (!chat) {
            chat = {
                id: chatId,
                listingId: listing.id,
                listingTitle: listing.title,
                ownerId: listing.ownerId,
                ownerName: listing.ownerName || "Property Provider",
                studentId: state.user.uid,
                studentName: state.profile?.name || state.user?.displayName || "Student",
                participantIds: [state.user.uid, listing.ownerId],
                studentAcceptedNumber: false,
                ownerAcceptedNumber: false,
                studentPhone: state.profile?.phone || "",
                ownerPhone: "+91 98260 12345",
                booked: false,
                bookedAt: null,
                lastMessage: "Conversation started",
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };

            state.chats.unshift(chat);
            saveStoredChats(state.chats);

            const initialMsgs = [
                {
                    id: "msg-init-" + Date.now(),
                    senderId: "system",
                    senderName: "Rent Studs",
                    text: `Started conversation for "${listing.title}". Type a message below to inquire about rent, amenities, or visits!`,
                    createdAt: { seconds: Math.floor(Date.now() / 1000) }
                }
            ];
            saveStoredMessages(chatId, initialMsgs);

            if (!state.user?.isDemo) {
                try {
                    await setDoc(doc(db, "chats", chatId), {
                        ...chat,
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.warn("Firestore setDoc for chat note:", e);
                }
            }
        }

        state.selectedChat = chat.id;
        state.messages = getStoredMessages(chat.id);
        go("chat");

    } catch (err) {
        console.error("startChat error:", err);
        toast("Could not open chat.");
    }
}

function chatPage() {
    if (!state.chats || state.chats.length === 0) {
        state.chats = getStoredChats();
    }

    const selected =
        state.chats.find(chat => chat.id === state.selectedChat) ||
        state.chats[0];

    if (selected) {
        state.selectedChat = selected.id;
        state.messages = getStoredMessages(selected.id);
    }

    return `
        <div>
            ${topbar()}

            <main class="container page">
                <div class="heading">
                    <div>
                        <h1>Chat</h1>
                        <p>Discuss property details, amenities, and room visits.</p>
                    </div>
                </div>

                <div class="card chat-layout">
                    <div class="chat-list">
                        ${
                            state.chats.length
                            ? state.chats.map(chat => `
                                <div
                                    class="chat-item ${selected?.id === chat.id ? "active" : ""}"
                                    data-id="${chat.id}"
                                    onclick="window.rentStuds.selectChat('${chat.id}')">
                                    <strong>${escapeHTML(chat.listingTitle || "Property")}</strong>
                                    <p>${escapeHTML(chat.lastMessage || "Start conversation")}</p>
                                </div>
                            `).join("")
                            : `<div class="empty"><p>No conversations yet.</p></div>`
                        }
                    </div>

                    <div class="chat-main">
                        ${selected ? renderChatWindow(selected) : `<div class="empty"><p>Select a conversation.</p></div>`}
                    </div>
                </div>
            </main>

            ${bottomNav("chat")}
        </div>
    `;
}

function renderChatWindow(chat) {
    const phoneUnlocked = chat.studentAcceptedNumber && chat.ownerAcceptedNumber;
    const myAccepted = state.role === "student" ? chat.studentAcceptedNumber : chat.ownerAcceptedNumber;

    return `
        <div class="chat-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${escapeHTML(chat.listingTitle || "Property")}</strong>
                <div class="small muted">Host: ${escapeHTML(chat.ownerName || "Property Provider")}</div>
            </div>
            ${chat.booked ? '<span class="badge badge-booked">ROOM BOOKED</span>' : '<span class="badge badge-neutral">AVAILABLE</span>'}
        </div>

        <div id="messages" class="messages">
            ${
                state.messages.length
                ? state.messages.map(message => {
                    const isMine = message.senderId === state.user?.uid;
                    const isSystem = message.senderId === "system";
                    if (isSystem) {
                        return `<div style="text-align:center; margin:8px 0; color:var(--muted); font-size:12px; background:var(--primary-soft); padding:6px 12px; border-radius:8px;">ℹ️ ${escapeHTML(message.text)}</div>`;
                    }
                    return `<div class="bubble ${isMine ? "mine" : ""}">${escapeHTML(message.text)}</div>`;
                }).join("")
                : `<div style="color:var(--muted); text-align:center; padding:20px;">Start the conversation below.</div>`
            }
        </div>

        <div class="card phone-box">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <div>
                    <strong>Direct Contact & Phone</strong>
                    <div class="small">Revealed when both student and host agree to connect.</div>
                </div>

                <button
                    class="btn btn-soft"
                    onclick="window.rentStuds.acceptNumber('${chat.id}')">
                    ${myAccepted ? "Shared ✓" : "Share My Phone Number"}
                </button>
            </div>

            ${phoneUnlocked ? `
                <div class="notice mt-sm" style="background:var(--green-soft); color:var(--green);">
                    ✓ Contact Unlocked!<br>
                    <strong>Student:</strong> ${escapeHTML(chat.studentPhone || "Not provided")}<br>
                    <strong>Provider:</strong> ${escapeHTML(chat.ownerPhone || "+91 98260 12345")}
                </div>
            ` : ''}

            ${state.role === "owner" ? `
                <div class="mt-sm" style="display:flex; justify-content:flex-end;">
                    <button
                        class="btn ${chat.booked ? "btn-danger" : "btn-success"}"
                        onclick="window.rentStuds.toggleBooking('${chat.id}', ${!chat.booked})">
                        ${chat.booked ? "Mark Not Booked" : "Mark Room Booked"}
                    </button>
                </div>
            ` : ''}
        </div>

        <div class="chat-compose">
            <input
                id="chat-input"
                placeholder="Write a message and press Enter..."
                autocomplete="off"
                onkeydown="if(event.key === 'Enter'){ window.rentStuds.sendMessage('${chat.id}'); }">

            <button
                class="btn btn-primary"
                onclick="window.rentStuds.sendMessage('${chat.id}')">
                Send
            </button>
        </div>
    `;
}

function renderMessagesDOM() {
    const root = document.getElementById("messages");
    if (!root) return;

    root.innerHTML = state.messages.map(message => {
        const isMine = message.senderId === state.user?.uid;
        const isSystem = message.senderId === "system";
        if (isSystem) {
            return `<div style="text-align:center; margin:8px 0; color:var(--muted); font-size:12px; background:var(--primary-soft); padding:6px 12px; border-radius:8px;">ℹ️ ${escapeHTML(message.text)}</div>`;
        }
        return `<div class="bubble ${isMine ? "mine" : ""}">${escapeHTML(message.text)}</div>`;
    }).join("");

    root.scrollTop = root.scrollHeight;
}

function loadMessages(chatId) {
    if (state.unsubscribeMessages) {
        state.unsubscribeMessages();
        state.unsubscribeMessages = null;
    }

    state.messages = getStoredMessages(chatId);
    renderMessagesDOM();

    if (!state.user?.isDemo) {
        try {
            const q = query(
                collection(db, `chats/${chatId}/messages`),
                orderBy("createdAt", "asc")
            );

            state.unsubscribeMessages = onSnapshot(
                q,
                snapshot => {
                    if (!snapshot.empty) {
                        const remote = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        const combined = [...state.messages];
                        remote.forEach(rm => {
                            if (!combined.some(m => m.id === rm.id)) {
                                combined.push(rm);
                            }
                        });
                        state.messages = combined;
                        saveStoredMessages(chatId, combined);
                        renderMessagesDOM();
                    }
                },
                err => {
                    console.warn("Firestore message listener warning (using local):", err);
                }
            );
        } catch (e) {
            console.warn("Could not setup Firestore message listener:", e);
        }
    }
}

function selectChat(chatId) {
    state.selectedChat = chatId;
    state.messages = getStoredMessages(chatId);
    go("chat");
    setTimeout(() => loadMessages(chatId), 50);
}

async function sendMessage(chatId) {
    const input = document.getElementById("chat-input");
    const text = input?.value.trim();
    if (!text) return;

    input.value = "";

    const userMsg = {
        id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        senderId: state.user?.uid || "user",
        senderName: state.profile?.name || state.user?.displayName || "Me",
        text: text,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    state.messages.push(userMsg);
    saveStoredMessages(chatId, state.messages);
    renderMessagesDOM();

    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
        chat.lastMessage = text;
        saveStoredChats(state.chats);
        const itemPreview = document.querySelector(`.chat-item[data-id="${chatId}"] p`);
        if (itemPreview) itemPreview.textContent = text;
    }

    if (!state.user?.isDemo) {
        try {
            await addDoc(collection(db, `chats/${chatId}/messages`), {
                senderId: state.user.uid,
                text: text,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "chats", chatId), {
                lastMessage: text
            });
        } catch (e) {
            console.warn("Firestore message send note:", e);
        }
    }

    // Auto-reply response simulation for instant feedback
    setTimeout(() => {
        const isOwner = state.role === "owner";
        const replies = isOwner ? [
            "Thank you! When can I come for a room visit?",
            "Understood. Are the mess and food charges separate?",
            "Sounds great! I will connect with you shortly on the phone number.",
            "Thanks for the info! Is the security deposit refundable?"
        ] : [
            "Hi! Yes, this room is available. You are welcome to visit anytime today.",
            "Water, Wi-Fi, and power backup are all in place. When are you looking to move in?",
            "The room is vacant and clean. Let me know if you want me to hold it for you.",
            "Great! Click 'Share My Phone Number' above so we can connect directly on WhatsApp."
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg = {
            id: "msg-reply-" + Date.now(),
            senderId: isOwner ? "student-inquirer" : (chat?.ownerId || "owner-host"),
            senderName: isOwner ? "Student Inquirer" : (chat?.ownerName || "Property Host"),
            text: randomReply,
            createdAt: { seconds: Math.floor(Date.now() / 1000) }
        };

        state.messages.push(replyMsg);
        saveStoredMessages(chatId, state.messages);
        if (chat) {
            chat.lastMessage = randomReply;
            saveStoredChats(state.chats);
            const itemPreview = document.querySelector(`.chat-item[data-id="${chatId}"] p`);
            if (itemPreview) itemPreview.textContent = randomReply;
        }
        renderMessagesDOM();
    }, 1000);
}

async function acceptNumber(chatId) {
    const phone = state.profile?.phone || (state.role === "owner" ? "+91 98260 12345" : "+91 91111 22334");
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    if (state.role === "student") {
        chat.studentAcceptedNumber = true;
        chat.studentPhone = phone;
    } else {
        chat.ownerAcceptedNumber = true;
        chat.ownerPhone = phone;
    }

    saveStoredChats(state.chats);

    if (!state.user?.isDemo) {
        try {
            await updateDoc(doc(db, "chats", chatId), {
                studentAcceptedNumber: chat.studentAcceptedNumber,
                ownerAcceptedNumber: chat.ownerAcceptedNumber,
                studentPhone: chat.studentPhone,
                ownerPhone: chat.ownerPhone
            });
        } catch (e) {
            console.warn("Firestore acceptNumber note:", e);
        }
    }

    toast("Phone number shared successfully.");
    go("chat");
}

async function toggleBooking(chatId, isBooked) {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    chat.booked = isBooked;
    chat.bookedAt = isBooked ? { seconds: Math.floor(Date.now() / 1000) } : null;
    saveStoredChats(state.chats);

    const listing = state.listings.find(l => l.id === chat.listingId);
    if (listing) {
        listing.booked = isBooked;
        saveStoredListings(state.listings);
    }

    if (!state.user?.isDemo) {
        try {
            await updateDoc(doc(db, "chats", chatId), {
                booked: isBooked,
                bookedAt: isBooked ? serverTimestamp() : null
            });
            if (chat.listingId) {
                await updateDoc(doc(db, "listings", chat.listingId), {
                    booked: isBooked
                });
            }
        } catch (e) {
            console.warn("Firestore toggleBooking note:", e);
        }
    }

    toast(isBooked ? "Room marked as Booked!" : "Room marked as Available.");
    go("chat");
}

/* ==========================================
   REVIEWS
========================================== */


function openReview(
    listingId
) {

    showModal(`

        <div class="
            modal-card
        ">


            <div class="
                modal-header
            ">

                <h2>
                    Leave a Review
                </h2>


                <button
                    class="
                        close
                    "

                    onclick="
                        window.rentStuds
                        .closeModal()
                    ">

                    ×

                </button>

            </div>


            <div class="
                field
            ">


                <label>
                    Rating
                </label>


                <select
                    id="review-rating">

                    <option value="5">
                        ⭐⭐⭐⭐⭐ 5
                    </option>

                    <option value="4">
                        ⭐⭐⭐⭐ 4
                    </option>

                    <option value="3">
                        ⭐⭐⭐ 3
                    </option>

                    <option value="2">
                        ⭐⭐ 2
                    </option>

                    <option value="1">
                        ⭐ 1
                    </option>

                </select>

            </div>


            <div class="
                field
                mt
            ">


                <label>
                    Review
                </label>


                <textarea
                    id="review-text"
                    placeholder="
                        Tell future students
                        about your experience...
                    "></textarea>


            </div>


            <div class="
                form-actions
            ">


                <button
                    class="
                        btn
                        btn-outline
                    "

                    onclick="
                        window.rentStuds
                        .closeModal()
                    ">

                    Cancel

                </button>


                <button
                    class="
                        btn
                        btn-primary
                    "

                    onclick="
                        window.rentStuds
                        .submitReview(
                            '${listingId}'
                        )
                    ">

                    Submit Review

                </button>


            </div>


        </div>

    `);

}



/* ==========================================
   SUBMIT REVIEW
========================================== */


async function submitReview(
    listingId
) {

    const rating =
        Number(
            document.getElementById(
                "review-rating"
            ).value
        );


    const text =
        document.getElementById(
            "review-text"
        ).value.trim();


    if (!text) {

        toast(
            "Write a review first."
        );

        return;

    }


    try {

        await addDoc(

            collection(
                db,
                "reviews"
            ),

            {

                listingId:
                    listingId,

                studentId:
                    state.user.uid,

                name:
                    state.profile.name,

                rating:
                    rating,

                text:
                    text,

                createdAt:
                    serverTimestamp()

            }

        );


        closeModal();


        toast(
            "Review submitted."
        );


    } catch (
        error
    ) {

        console.error(
            error
        );

        toast(
            error.message
        );

    }

}



/* ==========================================
   PROFILE
========================================== */


function profilePage() {

    return `

        <div>


            ${topbar()}


            <main class="
                container
                page
            ">


                <section
                    class="
                        card
                        profile
                    ">


                    <div class="
                        avatar
                    ">


                        ${
                            state.profile?.photoURL

                            ?

                            `<img
                                src="${escapeHTML(
                                    state.profile.photoURL
                                )}"
                                alt=""
                            >`

                            :

                            "👤"

                        }


                    </div>


                    <h2>

                        ${escapeHTML(
                            state.profile?.name ||
                            ""
                        )}

                    </h2>


                    <p class="
                        muted
                    ">

                        ${escapeHTML(
                            state.profile?.email ||
                            ""
                        )}

                    </p>


                    <br>


                    <div class="
                        field
                    ">


                        <label>
                            Phone Number
                        </label>


                        <input
                            id="profile-phone"

                            value="${escapeHTML(
                                state.profile?.phone ||
                                ""
                            )}"

                            placeholder="
                                Enter phone number
                            ">


                    </div>


                    <div class="
                        form-actions
                    ">


                        <button
                            class="
                                btn
                                btn-primary
                            "

                            onclick="
                                window.rentStuds
                                .saveProfile()
                            ">

                            Save Profile

                        </button>


                    </div>


                    <div class="
                        notice
                        mt
                    ">

                        Your phone number
                        is revealed only after
                        both people agree.

                    </div>


                </section>


            </main>


            ${bottomNav("profile")}


        </div>

    `;

}



/* ==========================================
   SAVE PROFILE
========================================== */


async function saveProfile() {

    const phone =
        document.getElementById(
            "profile-phone"
        ).value.trim();


    try {

        await updateDoc(

            doc(
                db,
                "users",
                state.user.uid
            ),

            {

                phone:
                    phone

            }

        );


        state.profile.phone =
            phone;


        toast(
            "Profile saved."
        );


    } catch (
        error
    ) {

        console.error(
            error
        );

        toast(
            error.message
        );

    }

}



/* ==========================================
   MODAL
========================================== */


function showModal(
    html
) {

    let root =
        document.getElementById(
            "modal-root"
        );


    if (!root) {

        root =
            document.createElement(
                "div"
            );


        root.id =
            "modal-root";


        document.body.appendChild(
            root
        );

    }


    root.innerHTML =
        `<div class="modal">
            ${html}
        </div>`;

}



function closeModal() {

    document
        .getElementById(
            "modal-root"
        )
        ?.remove();

}



/* ==========================================
   DATA
========================================== */


function subscribeToData() {
    if (state.unsubscribeListings) {
        state.unsubscribeListings();
        state.unsubscribeListings = null;
    }

    if (state.unsubscribeChats) {
        state.unsubscribeChats();
        state.unsubscribeChats = null;
    }

    // Initialize with local cache or sample stays
    if (!state.listings || state.listings.length === 0) {
        state.listings = getStoredListings();
    }

    if (state.user?.isDemo) {
        return;
    }

    try {
        // Query all listings for both student and owner views so newly listed rooms appear immediately!
        const listingsQuery = query(collection(db, "listings"));

        state.unsubscribeListings = onSnapshot(
            listingsQuery,
            snapshot => {
                if (!snapshot.empty) {
                    const dbListings = snapshot.docs.map(item => ({
                        id: item.id,
                        ...item.data()
                    })).sort(
                        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                    );

                    state.listings = dbListings;
                    saveStoredListings(dbListings);
                } else if (state.listings.length === 0) {
                    state.listings = getStoredListings();
                }

                if (state.page === "ownerHome" || state.page === "ownerDetails" || state.page === "studentHome") {
                    render();
                }
            },
            error => {
                console.warn("Firestore listings subscription note:", error);
                if (!state.listings || state.listings.length === 0) {
                    state.listings = getStoredListings();
                }
                if (state.page === "ownerHome" || state.page === "studentHome") {
                    render();
                }
            }
        );
    } catch (e) {
        console.warn("Could not setup Firestore listings subscription:", e);
    }

    try {
        const chatsQuery = query(
            collection(db, "chats"),
            where("participantIds", "array-contains", state.user.uid)
        );

        state.unsubscribeChats = onSnapshot(
            chatsQuery,
            snapshot => {
                state.chats = snapshot.docs.map(item => ({
                    id: item.id,
                    ...item.data()
                })).sort(
                    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                );

                if (state.page === "chat") {
                    render();
                }
            },
            error => {
                console.warn("Firestore chats note:", error);
            }
        );
    } catch (e) {
        console.warn("Could not setup Firestore chats subscription:", e);
    }
}



/* ==========================================
   REVIEWS
========================================== */


function loadReviews(
    listingId
) {

    if (
        state.unsubscribeReviews
    ) {

        state.unsubscribeReviews();

    }


    const q =
        query(

            collection(
                db,
                "reviews"
            ),

            where(
                "listingId",
                "==",
                listingId
            )

        );


    state.unsubscribeReviews =
        onSnapshot(

            q,

            snapshot => {

                state.reviews[
                    listingId
                ] =
                    snapshot.docs.map(
                        item => ({

                            id:
                                item.id,

                            ...item.data()

                        })
                    );


                if (
                    state.page ===
                    "studentDetails"
                ) {

                    render();

                }

            },

            error => {

                console.error(
                    error
                );

                toast(
                    "Could not load reviews."
                );

            }

        );

}



/* ==========================================
   RENDER
========================================== */


function render() {

    if (
        !state.user
    ) {

        app.innerHTML =
            state.page ===
            "login"

            ?

            loginPage()

            :

            landingPage();


        return;

    }


    switch (
        state.page
    ) {


        case "ownerHome":

            app.innerHTML =
                ownerHome();

            break;


        case "create":

            app.innerHTML =
                createListingPage();

            document
                .getElementById(
                    "listing-form"
                )
                ?.addEventListener(
                    "submit",
                    submitListing
                );

            break;


        case "ownerDetails":

            app.innerHTML =
                ownerDetailsPage();

            break;


        case "studentHome":

            app.innerHTML =
                studentHome();

            setupStudentFilters();

            break;


        case "studentDetails":

            app.innerHTML =
                studentDetailsPage();

            if (
                state.selectedListing
            ) {

                loadReviews(
                    state.selectedListing
                );

            }

            break;


        case "chat":
            app.innerHTML = chatPage();
            if (state.selectedChat) {
                loadMessages(state.selectedChat);
            }
            break;


        case "profile":

            app.innerHTML =
                profilePage();

            break;


        default:

            app.innerHTML =
                state.role ===
                "owner"

                ?

                ownerHome()

                :

                studentHome();

    }

}



/* ==========================================
   LOGOUT
========================================== */


async function logout() {

    try {

        clearSubscriptions();


        await signOut(
            auth
        );


        state.user =
            null;

        state.profile =
            null;

        state.role =
            null;

        state.page =
            "landing";

        state.selectedListing =
            null;

        state.selectedChat =
            null;


        state.listings =
            [];


        state.chats =
            [];


        state.messages =
            [];


        render();


    } catch (
        error
    ) {

        console.error(
            error
        );

    }

}



/* ==========================================
   PUBLIC API
========================================== */


window.rentStuds = {
    go,
    chooseRole,
    login,
    demoLogin,
    switchRole,
    logout,
    openOwner,
    openStudent,
    startChat,
    selectChat,
    sendMessage,
    acceptNumber,
    toggleBooking,
    openReview,
    submitReview,
    closeModal,
    saveProfile,
    previewImages
};



/* ==========================================
   REDIRECT & AUTH STATE
========================================== */

getRedirectResult(auth).then(result => {
    if (result && result.user) {
        toast(`Signed in as ${result.user.displayName || "User"}`);
    }
}).catch(err => {
    console.warn("Redirect auth check:", err);
});

onAuthStateChanged(

    auth,

    async user => {

        if (!user) {

            clearSubscriptions();

            state.profile =
                null;

            state.role =
                null;

            state.listings =
                [];

            state.chats =
                [];

            state.messages =
                [];

            state.selectedListing =
                null;

            state.selectedChat =
                null;

            state.page =
                "landing";

        }

        state.user =
            user;


        if (
            user
        ) {

            try {

                await loadProfile();

                subscribeToData();


                if (
                    state.page ===
                    "landing"

                    ||

                    state.page ===
                    "login"
                ) {

                    state.page =
                        state.role ===
                        "owner"

                        ?

                        "ownerHome"

                        :

                        "studentHome";

                }

            } catch (
                error
            ) {

                console.error(
                    error
                );

                toast(
                    "Could not load your account."
                );

            }

        }


        render();

    }

);