// Rent Studs - Advanced Filters
// Person 2

function calculateTotal(room) {
    return (
        room.rent +
        room.food +
        room.electricity +
        room.wifiCost +
        room.maintenance
    );
}

function filterRooms(roomList) {

    const maxBudget = Number(document.getElementById("budgetFilter").value) || Infinity;
    const maxDistance = Number(document.getElementById("distanceFilter").value) || Infinity;
    const sharing = document.getElementById("sharingFilter").value;
    const food = document.getElementById("foodFilter").checked;
    const wifi = document.getElementById("wifiFilter").checked;
    const furnished = document.getElementById("furnishedFilter").checked;
    const parking = document.getElementById("parkingFilter").checked;
    const minRating = Number(document.getElementById("ratingFilter").value) || 0;

    const filtered = roomList.filter(room => {

        const total = calculateTotal(room);

        if (total > maxBudget) return false;
        if (room.distance > maxDistance) return false;
        if (sharing && room.sharing !== sharing) return false;
        if (food && !room.foodAvailable) return false;
        if (wifi && !room.wifi) return false;
        if (furnished && !room.furnished) return false;
        if (parking && !room.parking) return false;
        if (room.rating < minRating) return false;

        return true;
    });

    document.getElementById("resultCount").textContent =
        `${filtered.length} room(s) found`;

    return filtered;
}

function resetFilters() {

    document.getElementById("budgetFilter").value = "";
    document.getElementById("distanceFilter").value = "";
    document.getElementById("sharingFilter").value = "";
    document.getElementById("foodFilter").checked = false;
    document.getElementById("wifiFilter").checked = false;
    document.getElementById("furnishedFilter").checked = false;
    document.getElementById("parkingFilter").checked = false;
    document.getElementById("ratingFilter").value = "";

}