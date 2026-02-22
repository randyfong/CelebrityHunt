// Supabase Configuration
const SUPABASE_URL = 'https://csnaotjithdtfbzzepji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YSJ2loag2Kcrhb4uX91n5g_p7TmPUOp';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const form = document.getElementById('manifesto-form');
const topScoresContainer = document.getElementById('top-scores');
const leaderboardList = document.getElementById('leaderboard-list');
const idleView = document.getElementById('idle-view');
const loadingView = document.getElementById('loading-view');
const resultView = document.getElementById('result-view');
const progressBar = document.getElementById('progress-bar');

const alignmentDisp = document.getElementById('alignment-score');
const feasibilityDisp = document.getElementById('feasibility-score');
const totalDisp = document.getElementById('total-score');
const statusDisp = document.getElementById('vanguard-status');

// 1. Relationship Score Logic
const relationshipMap = {
    'inner': 10,
    'official': 8,
    'admirer': 5,
    'observer': 3,
    'unknown': 1,
    'other': 2 // Default score for other
};

// Toggle Custom Relationship Field
const relSelect = document.getElementById('relationship');
const customRelContainer = document.getElementById('custom-relationship-container');
const customRelInput = document.getElementById('custom-relationship');

relSelect.addEventListener('change', () => {
    if (relSelect.value === 'other') {
        customRelContainer.classList.remove('hidden');
        customRelInput.required = true;
    } else {
        customRelContainer.classList.add('hidden');
        customRelInput.required = false;
    }
});

// 2. AI Scoring Engine (Pseudocode logic implemented in JS)
function calculateIdeaScore(text) {
    const marxistKeywords = ['proletariat', 'bourgeoisie', 'class struggle', 'means of production', 'abolition', 'manifesto', 'marx', 'engels', 'comrades', 'revolution', 'capitalism', 'labor', 'equality', 'dialectic'];
    const aiKeywords = ['automation', 'algorithm', 'neural', 'efficiency', 'computation', 'data', 'robotics', 'optimization', 'distributed', 'smart', 'technological', 'innovation'];

    const alignment = calculateKeywordDensity(text, marxistKeywords);
    const feasibility = calculateKeywordDensity(text, aiKeywords);

    return {
        alignment: Math.min(100, (alignment * 20) + 10), // Base floor 10
        feasibility: Math.min(100, (feasibility * 15) + 20) // Base floor 20
    };
}

function calculateKeywordDensity(text, keywords) {
    const words = text.toLowerCase().split(/\W+/);
    let count = 0;
    keywords.forEach(kw => {
        if (words.includes(kw)) count++;
        // Additional count for occurrences
        const regex = new RegExp(kw, 'g');
        const matches = text.toLowerCase().match(regex);
        if (matches) count += matches.length * 0.5;
    });
    return count;
}

const getVanguardStatus = (score) => {
    if (score > 80) return "TRUE REVOLUTIONARY ARCHITECT";
    if (score > 60) return "SOLID PARTY FELLOW";
    if (score > 40) return "ASPIRING COMRADE";
    return "IDEOLOGICAL RECLAMATION NEEDED";
};

// 3. Database Operations
async function fetchTopEntries() {
    const { data, error } = await _supabase
        .from('manifesto_leads')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching scores:', error);
        return;
    }

    renderScoreboard(data);
}

function renderScoreboard(entries) {
    // Top 3 for header
    topScoresContainer.innerHTML = '';
    entries.slice(0, 3).forEach((entry, i) => {
        const div = document.createElement('div');
        div.className = 'text-xs md:text-sm font-bold';
        div.innerHTML = `<span class="text-gold-500">#${i + 1}</span> <span class="text-white">${entry.name}</span>: <span class="text-red-500">${entry.total_score}</span>`;
        topScoresContainer.appendChild(div);
    });

    // Full list
    leaderboardList.innerHTML = '';
    entries.forEach((entry, i) => {
        const div = document.createElement('div');
        div.className = 'scoreboard-item p-4 flex justify-between items-center';
        div.innerHTML = `
            <div>
                <div class="text-red-600 font-bold heading-font text-xl">${entry.name}</div>
                <div class="text-xs text-gray-400 uppercase">${entry.relationship_desc}</div>
            </div>
            <div class="text-right">
                <div class="text-2xl text-gold-500 font-bold">${entry.total_score}</div>
                <div class="text-[10px] text-gray-500">ALIGNED: ${entry.alignment} | FEAS: ${entry.feasibility}</div>
            </div>
        `;
        leaderboardList.appendChild(div);
    });
}

async function submitEntry(payload) {
    const { data, error } = await _supabase
        .from('manifesto_leads')
        .insert([payload]);

    if (error) {
        console.error('Submission error:', error);
        alert('Vanguard Network Disturbance. Try again, Comrade.');
        return false;
    }
    return true;
}

// 4. UI Handling
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const contact = document.getElementById('contact').value;
    const relKey = relSelect.value;
    const ideaText = document.getElementById('idea').value;

    let relationshipDesc = relSelect.options[relSelect.selectedIndex].text;
    if (relKey === 'other') {
        relationshipDesc = customRelInput.value;
    }

    const relationshipScore = relationshipMap[relKey];

    // Calculate Score
    const { alignment, feasibility } = calculateIdeaScore(ideaText);
    const totalScore = parseFloat(((alignment * 0.6) + (feasibility * 0.4)).toFixed(2));

    // UI Animation
    idleView.classList.add('hidden');
    resultView.classList.add('hidden');
    loadingView.classList.remove('hidden');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            showResults(alignment, feasibility, totalScore);
        }
    }, 50);

    // Prepare Payload
    const payload = {
        name: name,
        contact: contact,
        relationship_desc: relationshipDesc,
        relationship_score: relationshipScore,
        idea_text: ideaText,
        alignment: Math.round(alignment),
        feasibility: Math.round(feasibility),
        total_score: totalScore
    };

    // Background Submit
    const success = await submitEntry(payload);
    if (success) {
        fetchTopEntries();
    }
});

function showResults(alignment, feasibility, total) {
    loadingView.classList.add('hidden');
    resultView.classList.remove('hidden');

    alignmentDisp.innerText = Math.round(alignment);
    feasibilityDisp.innerText = Math.round(feasibility);
    totalDisp.innerText = total;
    statusDisp.innerText = getVanguardStatus(total);
}

// Init
fetchTopEntries();
