import {

    auth,
    db,

    googleProvider,

    signInWithPopup,
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

    serverTimestamp

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
                            and get your property
                            verified by Rent Studs.

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

                            Find verified stays
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

    return `

        <main class="
            login-page
        ">


            <section class="
                login-card
            ">


                <div class="brand">

                    Rent
                    <span>
                        Studs
                    </span>

                </div>


                <h2
                    style="margin-top:15px">

                    ${state.role === "owner"
                        ? "Property Provider Login"
                        : "Student Login"}

                </h2>


                <p
                    class="muted"
                    style="margin-top:8px">

                    Continue securely
                    with Google.

                </p>


                <button
                    class="
                        google-btn
                    "

                    onclick="
                        window.rentStuds
                        .login()
                    ">

                    🔵
                    Continue with Google

                </button>


                <button
                    class="
                        btn
                        btn-outline
                    "

                    onclick="
                        window.rentStuds
                        .go(
                            'landing'
                        )
                    ">

                    ← Back

                </button>


            </section>

        </main>

    `;

}



/* ==========================================
   CHOOSE ROLE
========================================== */


function chooseRole(
    role
) {

    if (
        role !== "owner" &&
        role !== "student"
    ) {

        return;

    }

    state.role =
        role;

    go("login");

}



/* ==========================================
   LOGIN
========================================== */


async function login() {

    try {

        await signInWithPopup(
            auth,
            googleProvider
        );

    } catch (
        error
    ) {

        console.error(
            error
        );

        toast(
            error.message ||
            "Google login failed."
        );

    }

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

    return `

        <header class="
            topbar
        ">


            <button
                class="
                    brand
                "

                onclick="
                    window.rentStuds.go(
                        '${state.role === "owner"
                            ? "ownerHome"
                            : "studentHome"}'
                    )
                ">

                Rent
                <span>
                    Studs
                </span>

            </button>



            <div class="
                topbar-actions
            ">


                <span class="
                    topbar-user
                    small
                ">

                    ${escapeHTML(
                        state.profile?.name ||
                        ""
                    )}

                </span>


                <button
                    class="
                        btn
                        btn-outline
                    "

                    onclick="
                        window.rentStuds
                        .logout()
                    ">

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

    const mine =
        state.listings.filter(
            listing =>
                listing.ownerId ===
                state.user.uid
        );


    const verified =
        mine.filter(
            listing =>
                listing.verified
        ).length;


    const pending =
        mine.filter(
            listing =>
                listing.verificationStatus ===
                "scheduled"
        ).length;



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
                            My Listings
                        </h1>

                        <p>

                            Manage your stays
                            and verification.

                        </p>

                    </div>


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

                        + Add Listing

                    </button>


                </div>



                <div class="
                    kpi-row
                ">


                    <div class="
                        card
                        kpi
                    ">

                        <div class="small">
                            Total Listings
                        </div>

                        <div class="
                            kpi-number
                        ">

                            ${mine.length}

                        </div>

                    </div>



                    <div class="
                        card
                        kpi
                    ">

                        <div class="small">
                            Verified
                        </div>

                        <div class="
                            kpi-number
                        ">

                            ${verified}

                        </div>

                    </div>



                    <div class="
                        card
                        kpi
                    ">

                        <div class="small">
                            Pending
                        </div>

                        <div class="
                            kpi-number
                        ">

                            ${pending}

                        </div>

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


                    ${
                        listing.booked

                        ?

                        `<span
                            class="
                                badge
                                badge-booked
                            ">

                            BOOKED

                        </span>`

                        :

                        ""

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



                        <div class="
                            field
                            full
                        ">

                            <label>
                                Room Photos / Video
                            </label>

                            <input
                                name="media"
                                type="file"

                                accept="
                                    image/*,
                                    video/*
                                "

                                multiple>


                            <span class="
                                small
                            ">

                                Media upload will
                                be connected in
                                our final storage step.

                            </span>

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


async function submitListing(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const data =
        new FormData(
            form
        );


    try {

        const facilities =

            [
                ...form.querySelectorAll(
                    '[name="facility"]:checked'
                )
            ]

            .map(
                item =>
                    item.value
            );


        const custom =
            String(
                data.get(
                    "customFacilities"
                ) ||
                ""
            );


        custom

            .split(",")

            .map(
                x =>
                    x.trim()
            )

            .filter(Boolean)

            .forEach(
                x =>
                    facilities.push(x)
            );



        await addDoc(

            collection(
                db,
                "listings"
            ),

            {

                ownerId:
                    state.user.uid,

                ownerName:
                    state.profile.name,

                title:
                    data.get("title"),

                type:
                    data.get("type"),

                price:
                    Number(
                        data.get(
                            "price"
                        ) ||
                        0
                    ),

                location:
                    data.get(
                        "location"
                    ),

                distance:
                    Number(
                        data.get(
                            "distance"
                        ) ||
                        0
                    ),

                sharing:
                    data.get(
                        "sharing"
                    ),

                arrival:
                    data.get(
                        "arrival"
                    ),

                smoking:
                    data.get(
                        "smoking"
                    ),

                food:
                    data.get(
                        "food"
                    ),

                electricity:
                    Number(
                        data.get(
                            "electricity"
                        ) ||
                        0
                    ),

                wifi:
                    Number(
                        data.get(
                            "wifi"
                        ) ||
                        0
                    ),

                maintenance:
                    Number(
                        data.get(
                            "maintenance"
                        ) ||
                        0
                    ),

                facilities:
                    facilities,

                description:
                    data.get(
                        "description"
                    ),

                media:
                    [],

                verified:
                    false,

                verificationStatus:
                    "not-scheduled",

                verificationDate:
                    null,

                verificationTime:
                    null,

                booked:
                    false,

                createdAt:
                    serverTimestamp()

            }

        );


        toast(
            "Listing created successfully."
        );


        go("ownerHome");


    } catch (
        error
    ) {

        console.error(
            error
        );

        toast(
            error.message ||
            "Could not create listing."
        );

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



                        <div class="
                            card
                            detail-card
                        ">


                            <h2>
                                Verification
                            </h2>


                            <p>

                                ${
                                    listing.verified

                                    ?

                                    "This property is verified."

                                    :

                                    listing.verificationStatus ===
                                    "scheduled"

                                    ?

                                    "Verification call is scheduled."

                                    :

                                    "This property has not been verified."

                                }

                            </p>


                            <br>


                            ${
                                listing.verified

                                ?

                                `

                                <span class="
                                    badge
                                    badge-verified
                                ">

                                    ✓ Students can see this

                                </span>

                                `

                                :

                                listing.verificationStatus ===
                                "scheduled"

                                ?

                                `

                                <div class="
                                    notice
                                ">

                                    Scheduled:

                                    ${escapeHTML(
                                        listing.verificationDate ||
                                        ""
                                    )}

                                    at

                                    ${escapeHTML(
                                        listing.verificationTime ||
                                        ""
                                    )}

                                </div>


                                <button
                                    class="
                                        btn
                                        btn-success
                                        btn-block
                                        mt
                                    "

                                    onclick="
                                        window.rentStuds
                                        .demoVerify(
                                            '${listing.id}'
                                        )
                                    ">

                                    Demo: Mark Verified

                                </button>

                                `

                                :

                                `

                                <button
                                    class="
                                        btn
                                        btn-primary
                                        btn-block
                                    "

                                    onclick="
                                        window.rentStuds
                                        .openVerification(
                                            '${listing.id}'
                                        )
                                    ">

                                    Schedule ₹100 Verification

                                </button>

                                `

                            }


                        </div>


                    </aside>


                </div>


            </main>


            ${bottomNav("home")}

        </div>

    `;

}



/* ==========================================
   VERIFICATION
========================================== */


function openVerification(
    id
) {

    showModal(`

        <div class="
            modal-card
        ">


            <div class="
                modal-header
            ">


                <h2>
                    Schedule Verification
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


            <p class="muted">

                Rent Studs provides
                live video verification
                for <strong>₹100</strong>.

                No payment is collected
                in this prototype.

            </p>


            <br>


            <div class="
                notice
            ">

                Select a convenient date
                and time for the
                verification call.

            </div>


            <br>


            <div class="
                form-grid
            ">


                <div class="
                    field
                ">

                    <label>
                        Date
                    </label>

                    <input
                        id="verify-date"
                        type="date">

                </div>


                <div class="
                    field
                ">

                    <label>
                        Time
                    </label>

                    <input
                        id="verify-time"
                        type="time">

                </div>


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
                        .scheduleVerification(
                            '${id}'
                        )
                    ">

                    Schedule Call

                </button>


            </div>


        </div>

    `);

}



async function scheduleVerification(
    id
) {

    const date =
        document.getElementById(
            "verify-date"
        ).value;


    const time =
        document.getElementById(
            "verify-time"
        ).value;


    if (
        !date ||
        !time
    ) {

        toast(
            "Select a date and time."
        );

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "listings",
                id
            ),

            {

                verificationStatus:
                    "scheduled",

                verificationDate:
                    date,

                verificationTime:
                    time

            }

        );


        closeModal();


        toast(
            "Verification call scheduled."
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



async function demoVerify(
    id
) {

    if (
        !confirm(
            "Mark this listing as VERIFIED?"
        )
    ) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "listings",
                id
            ),

            {

                verified:
                    true,

                verificationStatus:
                    "verified"

            }

        );


        toast(
            "Listing verified."
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

                            Verified accommodation
                            around MITS.

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
        "#filter-price"

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

    let listings =
        state.listings.filter(
            listing =>
                listing.verified
        );


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

                    No Verified Stays Match

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


                <div class="
                    badges
                ">

                    <span class="
                        badge
                        badge-verified
                    ">

                        ✓ VERIFIED

                    </span>

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


                            <div class="
                                badges
                            ">


                                <span class="
                                    badge
                                    badge-verified
                                ">

                                    ✓ VERIFIED PROPERTY

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
   CHAT
========================================== */


async function startChat(
    listingId
) {

    const listing =
        state.listings.find(
            item =>
                item.id ===
                listingId
        );


    if (!listing) {

        return;

    }


    const q =
        query(

            collection(
                db,
                "chats"
            ),

            where(
                "listingId",
                "==",
                listingId
            ),

            where(
                "studentId",
                "==",
                state.user.uid
            )

        );


    const snapshot =
        await getDocs(
            q
        );


    let chatId;


    if (
        !snapshot.empty
    ) {

        chatId =
            snapshot.docs[0].id;

    } else {

        const created =
            await addDoc(

                collection(
                    db,
                    "chats"
                ),

                {

                    listingId:
                        listingId,

                    listingTitle:
                        listing.title,

                    ownerId:
                        listing.ownerId,

                    studentId:
                        state.user.uid,

                    participantIds: [

                        state.user.uid,

                        listing.ownerId

                    ],

                    studentAcceptedNumber:
                        false,

                    ownerAcceptedNumber:
                        false,

                    studentPhone:
                        "",

                    ownerPhone:
                        "",

                    booked:
                        false,

                    bookedAt:
                        null,

                    lastMessage:
                        "",

                    createdAt:
                        serverTimestamp()

                }

            );


        chatId =
            created.id;

    }


    state.selectedChat =
        chatId;


    go("chat");

}



/* ==========================================
   CHAT PAGE
========================================== */


function chatPage() {

    const selected =
        state.chats.find(
            chat =>
                chat.id ===
                state.selectedChat
        )
        ||
        state.chats[0];


    if (
        selected &&
        state.selectedChat !==
        selected.id
    ) {

        state.selectedChat =
            selected.id;


        loadMessages(
            selected.id
        );

    }


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
                            Chat
                        </h1>

                        <p>

                            Talk about the
                            property before booking.

                        </p>

                    </div>


                </div>



                <div class="
                    card
                    chat-layout
                ">


                    <div class="
                        chat-list
                    ">


                        ${
                            state.chats.length

                            ?

                            state.chats
                                .map(
                                    chat => `

                                        <div
                                            class="
                                                chat-item
                                                ${
                                                    selected?.id ===
                                                    chat.id
                                                    ? "active"
                                                    : ""
                                                }
                                            "

                                            onclick="
                                                window.rentStuds
                                                .selectChat(
                                                    '${chat.id}'
                                                )
                                            ">


                                            <strong>

                                                ${escapeHTML(
                                                    chat.listingTitle ||
                                                    "Property"
                                                )}

                                            </strong>


                                            <p>

                                                ${escapeHTML(
                                                    chat.lastMessage ||
                                                    "Start conversation"
                                                )}

                                            </p>


                                        </div>

                                    `
                                )

                                .join("")

                            :

                            `

                                <div class="
                                    empty
                                ">

                                    <p>

                                        No conversations yet.

                                    </p>

                                </div>

                            `

                        }


                    </div>



                    <div class="
                        chat-main
                    ">


                        ${
                            selected

                            ?

                            renderChatWindow(
                                selected
                            )

                            :

                            `<div class="
                                empty
                            ">

                                <p>

                                    Select a conversation.

                                </p>

                            </div>`

                        }


                    </div>


                </div>


            </main>


            ${bottomNav("chat")}


        </div>

    `;

}



/* ==========================================
   CHAT WINDOW
========================================== */


function renderChatWindow(
    chat
) {

    const phoneUnlocked =
        chat.studentAcceptedNumber &&
        chat.ownerAcceptedNumber;


    const myAccepted =
        state.role ===
        "student"

        ?

        chat.studentAcceptedNumber

        :

        chat.ownerAcceptedNumber;


    return `

        <div class="
            chat-header
        ">

            ${escapeHTML(
                chat.listingTitle ||
                "Property"
            )}

        </div>



        <div
            id="messages"
            class="
                messages
            ">


            ${
                state.messages.length

                ?

                state.messages
                    .map(
                        message => `

                            <div class="
                                bubble
                                ${
                                    message.senderId ===
                                    state.user.uid
                                    ? "mine"
                                    : ""
                                }
                            ">

                                ${escapeHTML(
                                    message.text
                                )}

                            </div>

                        `
                    )
                    .join("")

                :

                `<div
                    style="
                        color:
                        var(--muted);
                        text-align:
                        center;
                    ">

                    Start the conversation.

                </div>`

            }


        </div>



        <div class="
            card
            phone-box
        ">


            <div
                style="
                    display:
                    flex;
                    justify-content:
                    space-between;
                    align-items:
                    center;
                    gap:
                    10px;
                ">


                <div>

                    <strong>

                        Phone Number

                    </strong>


                    <div class="
                        small
                    ">

                        Revealed only
                        when both agree.

                    </div>

                </div>


                <button
                    class="
                        btn
                        btn-soft
                    "

                    onclick="
                        window.rentStuds
                        .acceptNumber(
                            '${chat.id}'
                        )
                    ">

                    ${
                        myAccepted
                        ? "Accepted ✓"
                        : "Share My Number"
                    }

                </button>


            </div>



            ${
                phoneUnlocked

                ?

                `

                <div class="
                    notice
                    mt-sm
                "
                style="
                    background:
                    var(--green-soft);
                    color:
                    var(--green);
                ">

                    Phone numbers unlocked.

                    <br>

                    Student:
                    ${escapeHTML(
                        chat.studentPhone ||
                        "Not added"
                    )}

                    <br>

                    Provider:
                    ${escapeHTML(
                        chat.ownerPhone ||
                        "Not added"
                    )}

                </div>

                `

                :

                ""

            }



            ${
                phoneUnlocked

                ?

                `

                <div
                    style="
                        display:
                        flex;
                        justify-content:
                        space-between;
                        align-items:
                        center;
                        gap:
                        10px;
                        margin-top:
                        10px;
                    ">


                    <span class="
                        small
                    ">

                        Status:

                        ${
                            chat.booked
                            ? "Booked"
                            : "Not Booked"
                        }

                    </span>


                    <button
                        class="
                            btn
                            ${
                                chat.booked
                                ? "btn-danger"
                                : "btn-success"
                            }
                        "

                        onclick="
                            window.rentStuds
                            .toggleBooking(
                                '${chat.id}',
                                ${!chat.booked}
                            )
                        ">

                        ${
                            chat.booked
                            ? "Mark Not Booked"
                            : "Room Booked"
                        }

                    </button>


                </div>

                `

                :

                ""

            }


        </div>



        <div class="
            chat-compose
        ">


            <input
                id="chat-input"

                placeholder="
                    Write a message...
                "

                onkeydown="
                    if(event.key === 'Enter')
                    window.rentStuds
                    .sendMessage(
                        '${chat.id}'
                    )
                ">


            <button
                class="
                    btn
                    btn-primary
                "

                onclick="
                    window.rentStuds
                    .sendMessage(
                        '${chat.id}'
                    )
                ">

                Send

            </button>


        </div>

    `;

}



/* ==========================================
   LOAD MESSAGES
========================================== */


function loadMessages(
    chatId
) {

    if (
        state.unsubscribeMessages
    ) {

        state.unsubscribeMessages();

    }


    state.messages =
        [];


    const q =
        query(

            collection(
                db,
                `chats/${chatId}/messages`
            ),

            orderBy(
                "createdAt",
                "asc"
            )

        );


    state.unsubscribeMessages =
        onSnapshot(
            q,

            snapshot => {

                state.messages =
                    snapshot.docs.map(
                        item => ({

                            id:
                                item.id,

                            ...item.data()

                        })
                    );


                const root =
                    document.getElementById(
                        "messages"
                    );


                if (!root) {

                    return;

                }


                root.innerHTML =
                    state.messages
                        .map(
                            message => `

                                <div
                                    class="
                                        bubble
                                        ${
                                            message.senderId ===
                                            state.user.uid
                                            ? "mine"
                                            : ""
                                        }
                                    ">

                                    ${escapeHTML(
                                        message.text
                                    )}

                                </div>

                            `
                        )
                        .join("");


                root.scrollTop =
                    root.scrollHeight;

            },

            error => {

                console.error(
                    error
                );

                toast(
                    "Could not load chat messages."
                );

                state.messages =
                    [];

            }

        );

}



/* ==========================================
   SELECT CHAT
========================================== */


function selectChat(
    chatId
) {

    state.selectedChat =
        chatId;


    loadMessages(
        chatId
    );


    go("chat");

}



/* ==========================================
   SEND MESSAGE
========================================== */


async function sendMessage(
    chatId
) {

    const input =
        document.getElementById(
            "chat-input"
        );


    const text =
        input?.value.trim();


    if (!text) {

        return;

    }


    try {

        await addDoc(

            collection(
                db,
                `chats/${chatId}/messages`
            ),

            {

                senderId:
                    state.user.uid,

                text:
                    text,

                createdAt:
                    serverTimestamp()

            }

        );


        await updateDoc(

            doc(
                db,
                "chats",
                chatId
            ),

            {

                lastMessage:
                    text

            }

        );


        input.value = "";


    } catch (
        error
    ) {

        console.error(
            error
        );

        toast(
            "Message could not be sent."
        );

    }

}



/* ==========================================
   ACCEPT NUMBER
========================================== */


async function acceptNumber(
    chatId
) {

    const phone =
        state.profile?.phone ||
        "";


    if (!phone) {

        toast(
            "Add your phone number in Profile first."
        );

        go("profile");

        return;

    }


    try {

        if (
            state.role ===
            "student"
        ) {

            await updateDoc(

                doc(
                    db,
                    "chats",
                    chatId
                ),

                {

                    studentAcceptedNumber:
                        true,

                    studentPhone:
                        phone

                }

            );

        } else {

            await updateDoc(

                doc(
                    db,
                    "chats",
                    chatId
                ),

                {

                    ownerAcceptedNumber:
                        true,

                    ownerPhone:
                        phone

                }

            );

        }


        toast(
            "Your consent has been saved."
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
   BOOKING
========================================== */


async function toggleBooking(
    chatId,
    value
) {

    try {

        const chat =
            state.chats.find(
                item =>
                    item.id ===
                    chatId
            );


        await updateDoc(

            doc(
                db,
                "chats",
                chatId
            ),

            {

                booked:
                    value,

                bookedAt:
                    value
                    ? new Date()
                        .toISOString()
                    : null

            }

        );


        if (
            chat?.listingId
        ) {

            await updateDoc(

                doc(
                    db,
                    "listings",
                    chat.listingId
                ),

                {

                    booked:
                        value

                }

            );

        }


        toast(
            value
            ? "Room marked as booked."
            : "Booking status updated."
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

    if (
        state.unsubscribeListings
    ) {

        state.unsubscribeListings();

    }


    if (
        state.unsubscribeChats
    ) {

        state.unsubscribeChats();

    }


    let listingsQuery;


    if (
        state.role ===
        "owner"
    ) {

        listingsQuery =
            query(

                collection(
                    db,
                    "listings"
                ),

                where(
                    "ownerId",
                    "==",
                    state.user.uid
                )

            );

    } else {

        listingsQuery =
            query(

                collection(
                    db,
                    "listings"
                ),

                where(
                    "verified",
                    "==",
                    true
                )

            );

    }


    state.unsubscribeListings =
        onSnapshot(

            listingsQuery,

            snapshot => {

                state.listings =
                    snapshot.docs

                        .map(
                            item => ({

                                id:
                                    item.id,

                                ...item.data()

                            })
                        )

                        .sort(
                            (a,b) =>

                                (
                                    b.createdAt
                                    ?.seconds ||
                                    0
                                )

                                -

                                (
                                    a.createdAt
                                    ?.seconds ||
                                    0
                                )
                        );


                if (

                    state.page ===
                    "ownerHome"

                    ||

                    state.page ===
                    "ownerDetails"

                    ||

                    state.page ===
                    "studentHome"

                ) {

                    render();

                }

            },

            error => {

                console.error(
                    error
                );

                toast(
                    "Could not load listings."
                );

            }

        );



    const chatsQuery =
        query(

            collection(
                db,
                "chats"
            ),

            where(
                "participantIds",
                "array-contains",
                state.user.uid
            )

        );


    state.unsubscribeChats =
        onSnapshot(

            chatsQuery,

            snapshot => {

                state.chats =
                    snapshot.docs

                        .map(
                            item => ({

                                id:
                                    item.id,

                                ...item.data()

                            })
                        )

                        .sort(
                            (a,b) =>

                                (
                                    b.createdAt
                                    ?.seconds ||
                                    0
                                )

                                -

                                (
                                    a.createdAt
                                    ?.seconds ||
                                    0
                                )
                        );


                if (
                    state.page ===
                    "chat"
                ) {

                    render();

                }

            },

            error => {

                console.error(
                    error
                );

                toast(
                    "Could not load chats."
                );

            }

        );

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

            app.innerHTML =
                chatPage();

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

    openVerification,

    scheduleVerification,

    demoVerify,

    closeModal,

    saveProfile

};



/* ==========================================
   AUTH STATE
========================================== */


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