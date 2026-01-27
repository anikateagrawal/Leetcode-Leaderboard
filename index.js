/* ===================== CONFIG ===================== */
const SHEET_API = "https://script.google.com/macros/s/AKfycbwjhkzuhKVx82KVY0IKJ4l0o8gSFOmhG6LSs_7SCzNaud1yqXLXouAKKGJF-DDdVQ3e/exec";

let currentBatch = "BATCH_1"; // default batch

/* ===================== DOM ===================== */
const batch1Btn = document.querySelector('#batch-1-btn');
const batch2Btn = document.querySelector('#batch-2-btn');
const batch3Btn = document.querySelector('#batch-3-btn');
const leaderboardBody = document.getElementById('leaderboard-body');
const sectionFilter = document.getElementById('section-filter');
const searchBar = document.getElementById('search-bar');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const updateBtn = document.getElementById('update-btn');


/* ===================== EVENTS ===================== */
document.addEventListener('DOMContentLoaded', initializePage);

batch1Btn.addEventListener('click', () => switchBatch("BATCH_1"));
batch2Btn.addEventListener('click', () => switchBatch("BATCH_2"));
batch3Btn.addEventListener('click', () => switchBatch("BATCH_3"));

switchBatch(currentBatch)

sectionFilter.addEventListener('change', initializePage);
searchBar.addEventListener('input', initializePage);
updateBtn.addEventListener('click',updateData);

document.getElementById('export-btn').addEventListener('click', exportCSV);

document.querySelectorAll('[id^="sort-"]').forEach(btn => {
    btn.addEventListener('click', () => sortLeaderboard(btn.id));
});



/* ===================== BATCH SWITCH ===================== */
function switchBatch(batch) {
    batch1Btn.classList.remove('bg-blue-500', 'hover:bg-blue-600')
    batch2Btn.classList.remove('bg-blue-500', 'hover:bg-blue-600')
    batch3Btn.classList.remove('bg-blue-500', 'hover:bg-blue-600')

    if(batch=="BATCH_1")batch1Btn.classList.add('bg-blue-500', 'hover:bg-blue-600')
    if(batch=="BATCH_2")batch2Btn.classList.add('bg-blue-500', 'hover:bg-blue-600')
    if(batch=="BATCH_3")batch3Btn.classList.add('bg-blue-500', 'hover:bg-blue-600')
    currentBatch = batch;
    initializePage();
}

// Whatsapp show
function showWhatsappColumn() {
    // document.getElementById('whatsapp-header').classList.remove('hidden');
    document.getElementById('update-btn').classList.remove('hidden');
    const rows = document.querySelectorAll('#leaderboard-body tr');
    rows.forEach(row => {
        console.log(row.querySelector('td:last-child'))
        row.querySelector('td:last-child').classList.remove('hidden');
    });
}

function hideWhatsappColumn() {
    document.getElementById('whatsapp-header').classList.add('hidden');
    document.getElementById('update-btn').classList.add('hidden');
    const rows = document.querySelectorAll('#leaderboard-body tr');
    rows.forEach(row => {
        row.querySelector('td:last-child').classList.add('hidden');
    });
}

/* ===================== SHEET API ===================== */
async function fetchSheetData() {
    try {
        const res = await fetch(`${SHEET_API}?batch=${currentBatch}`);
        const data = await res.json();
        return data.error ? [] : data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function updateSheet(data) {
  data = data.map(s => ({
    ...s,
    batch: currentBatch   // attach batch to each student
  }));
  console.log(data)
    try {
        await fetch(SHEET_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(data)
        });
        console.log("sheet updated")
    } catch (err) {
        console.error("Error updating sheet:", err);
    }
}

/* ===================== LEETCODE ===================== */
const corsProxy = "https://cors-proxy-t6l0.onrender.com";
const graphqlUrl = "https://leetcode.com/graphql";

const userStatsQuery = `
query userStats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
    globalRanking
  }
}`;

// GraphQL query to fetch recent submissions
const recentSubQuery = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      timestamp
      statusDisplay
      runtime
      memory
      lang
    }
  }
`;

async function fetchLeet(username) {
    try {
        const res = await axios.post(corsProxy, {
            query: userStatsQuery,
            variables: { username }
        }, {
            headers: { "Target-URL": graphqlUrl },
            timeout: 15000
        });

        // Fetch recent submissions
        const recentSubResponse = await axios.post(corsProxy, {
            query: recentSubQuery,
            variables: { username, limit: 2 },
          },{
            headers: { "Target-URL": graphqlUrl },
            timeout: 15000
        });
  

        const statsArr = res.data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
        let stats = { totalSolved: 0, easy: 0, medium: 0, hard: 0 };

        statsArr.forEach(s => {
            if (s.difficulty === "All") stats.totalSolved = s.count;
            if (s.difficulty === "Easy") stats.easy = s.count;
            if (s.difficulty === "Medium") stats.medium = s.count;
            if (s.difficulty === "Hard") stats.hard = s.count;
        });

        /* ---------- Contest Rating ---------- */
        const contest = res.data.data.userContestRanking;
        stats.rating = contest?.rating ? Math.round(contest.rating) : null;
        stats.globalRank = contest?.globalRanking ?? null;
        stats.contests = contest?.attendedContestsCount ?? 0;

        // Most recent submission timestamp
        const recentSub = recentSubResponse.data.data.recentAcSubmissionList || [];
        
        if (recentSub) {
            stats.lastUpdated = new Date(recentSub[0].timestamp * 1000); // timestamp is in seconds
        } else {
            stats.lastUpdated = null;
        }

        return stats;
    } catch {
        return { totalSolved: 0, easy: 0, medium: 0, hard: 0 , lastUpdated:null,rating: null,
            globalRank: null,
            contests: 0,};
    }
}

/* ===================== RENDER ===================== */
let currentData = [];
let currentSort = { column: "totalSolved", ascending: false };

function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
  return `${Math.floor(diff/86400)} days ago`;
}

function renderLeaderboard(data) {
    leaderboardBody.innerHTML = "";
    data.forEach((s, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">${i + 1}</td>
            <td class="p-2 border">${s.roll}</td>
            <td class="p-2 border">
                <a href="${s.url}" target="_blank" class="text-blue-400">${s.name}</a>
            </td>
            <td class="p-2 border">${s.section}</td>
            <td class="p-2 border text-purple-400 font-semibold">${s.rating ?? "-"}</td>
            <td class="p-2 border font-bold ${   s.up > 0 ? 'text-green-400' :    s.up < 0 ? 'text-red-400' : 'text-gray-400'}">
    ${s.up ? (s.up > 0 ? `+${s.up}` : s.up) : ''}</td>
            <td class="p-2 border">${s.totalSolved || 0}</td>
            <td class="p-2 border text-green-400">${s.easy || 0}</td>
            <td class="p-2 border text-yellow-400">${s.medium || 0}</td>
            <td class="p-2 border text-red-400">${s.hard || 0}</td>
            <td class="p-2 border">${s.lastUpdated ? timeAgo(s.lastUpdated) : ''}</td>
            <td class="px-2 py-2 text-green-400 hidden">
                <a    href="https://wa.me/${s.mobno}?text=${encodeURIComponent('Hello, I am from TBPPP. We noticed that you haven\'t been solving questions this week. Please ensure to put in more effort. Let us know if you need assistance.')}" 
    target="_blank" 
    class="inline-flex items-center px-4 py-2 bg-green-500 text-white text-sm text-center rounded hover:bg-green-600 transition"
    style="white-space: nowrap;">
    <i class="fab fa-whatsapp mr-2"></i>Send Reminder</a></td>

        `;
        leaderboardBody.appendChild(row);
    });

    document.getElementById('search-bar').addEventListener('input', function (e) {
        const s = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#leaderboard-body tr');
        if (s.includes("show")) {
            showWhatsappColumn(); // Show the WhatsApp column
            e.target.value=''
            rows.forEach(row => {
                    row.style.display = '';
            });
        } else if (s.includes("hide")){
            hideWhatsappColumn(); // Hide the WhatsApp column
            e.target.value=''
            rows.forEach(row => {
                    row.style.display = '';
            });
        }else{
            rows.forEach(row => {
                const name = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                if (name.includes(s)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    });
    
}

/* ===================== FILTER + SORT ===================== */
function applyFilters(data) {
    const sectionVal = sectionFilter.value;
    const searchVal = searchBar.value.toLowerCase();

    return data.filter(s =>
        (sectionVal === "all" || s.section === sectionVal) &&
        (!searchVal || s.name.toLowerCase().includes(searchVal))
    );
}

function sortLeaderboard(sortId) {
    const columnMap = {
        "sort-total": "totalSolved",
        "sort-easy": "easy",
        "sort-medium": "medium",
        "sort-hard": "hard",
        "sort-section": "section",
        "sort-up": "up",                 // ✅ ADD
        "sort-last": "lastUpdated",      // ✅ ADD (used later)
        "sort-rating": "rating"
    };

    const column = columnMap[sortId];
    if (currentSort.column === column) currentSort.ascending = !currentSort.ascending;
    else {
        currentSort.column = column;
        currentSort.ascending = false;
    }

    currentData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
    
        // 🔹 Handle nulls
        if (valA == null) return 1;
        if (valB == null) return -1;
    
        // 🔹 Date sorting (Last Active)
        if (column === "lastUpdated") {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }
    
        // 🔹 Numeric sorting
        if (typeof valA === "number") {
            return currentSort.ascending ? valA - valB : valB - valA;
        }
    
        // 🔹 String sorting
        return currentSort.ascending
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
    });

    renderLeaderboard(currentData);
}

/* ===================== SECTION DROPDOWN ===================== */
function populateSections(data) {
    const sections = [...new Set(data.map(s => s.section))];
    sectionFilter.innerHTML = `<option value="all">All Sections</option>` +
        sections.map(s => `<option value="${s}">${s}</option>`).join("");
}

/* ===================== CSV EXPORT ===================== */
function exportCSV() {
    const rows = [...document.querySelectorAll("table tr")].map(tr =>
        [...tr.children].map(td => td.innerText.trim()).join(",")
    );
    // console.log(rows)
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leaderboard_${currentBatch}.csv`;
    a.click();
}

/* ===================== LEETCODE PARALLEL SYNC ===================== */
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function syncLeetCodeStatsParallel(data) {
    console.log("syncing leetcode data in batches...");

    const studentsWithLeet = data.filter(
        s => s.url && typeof s.url === "string" && s.url.includes("leetcode.com/u/")
    );

    const BATCH_SIZE = 100;
    const batches = chunkArray(studentsWithLeet, BATCH_SIZE);

    console.log(`Total students: ${studentsWithLeet.length}`);
    console.log(`Total batches: ${batches.length}`);

    for (let i = 0; i < batches.length; i++) {
        console.log(`🚀 Processing batch ${i + 1}/${batches.length}`);

        const batch = batches[i];

        const promises = batch.map(async (student) => {
            const username = student.url.split("/u/")[1]?.replace("/", "");
            if (!username) return student;

            const prevTotal = student.totalSolved || 0;

            const stats = await fetchLeet(username);

            const newTotal = stats.totalSolved || 0;
            stats.up = newTotal - prevTotal;

            Object.assign(student, stats);
            return student;
        });

        // 🔹 Run THIS batch in parallel
        await Promise.all(promises);

        // Optional: small delay to be extra safe (recommended)
        await new Promise(res => setTimeout(res, 500));
    }

    // 🔹 Update sheet once after all batches
    await updateSheet(studentsWithLeet);

    // 🔹 Reload & re-render
    const freshData = await fetchSheetData();
    currentData = applyFilters(freshData);
    populateSections(freshData);
    renderLeaderboard(currentData);

    console.log("✅ All batches completed");
}


/* ===================== INITIALIZE PAGE ===================== */
async function initializePage() {
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    leaderboardBody.innerHTML = `<tr><td colspan="11" class="text-center p-4">Loading...</td></tr>`;

    try {
        let data = await fetchSheetData();
        currentData = applyFilters(data);
        populateSections(data); // populate section dropdown
        renderLeaderboard(currentData);
    } catch (err) {
        console.error(err);
        errorState.classList.remove("hidden");
    } finally {
        loadingState.classList.add("hidden");
    }
}

async function updateData(){
    syncLeetCodeStatsParallel(currentData);
}



