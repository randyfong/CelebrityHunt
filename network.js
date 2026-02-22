// Supabase Configuration
const SUPABASE_URL = 'https://csnaotjithdtfbzzepji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YSJ2loag2Kcrhb4uX91n5g_p7TmPUOp';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const container = document.getElementById('network-container');
const bridgeList = document.getElementById('bridge-list');
const nodeCountDisp = document.getElementById('node-count');
const strategyText = document.getElementById('strategy-text');

let network = null;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

async function initNetwork() {
    // 1. Fetch Data
    const { data, error } = await _supabase
        .from('manifesto_leads')
        .select('*');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    // 2. Prepare Nodes
    // Central Node: Xi Jinping
    nodes.add({
        id: 'xi_jinping',
        label: 'Xi Jinping',
        title: 'Supreme Leader',
        shape: 'star',
        size: 50,
        color: {
            background: '#ff0000',
            border: '#fbbf24',
            highlight: { background: '#ff0000', border: '#ffffff' }
        },
        font: { color: '#fbbf24', size: 20, face: 'monospace' }
    });

    data.forEach(lead => {
        const score = lead.total_score || 0;
        const relScore = lead.relationship_score || 0;

        // Color based on total score (alignment)
        let nodeColor = '#3f3f46'; // zinc-700
        if (score > 80) nodeColor = '#b91c1c'; // red-700
        else if (score > 60) nodeColor = '#991b1b'; // red-800
        else if (score > 40) nodeColor = '#7f1d1d'; // red-900

        nodes.add({
            id: lead.id,
            label: lead.name,
            title: `${lead.relationship_desc}\nScore: ${score}`,
            size: 20 + (score / 5),
            color: {
                background: nodeColor,
                border: relScore >= 8 ? '#fbbf24' : '#000',
                highlight: { background: '#ef4444', border: '#fbbf24' }
            },
            font: { color: '#ffffff', size: 12 }
        });

        // Add edge to Xi
        edges.add({
            from: lead.id,
            to: 'xi_jinping',
            value: relScore,
            color: { color: relScore >= 8 ? '#fbbf24' : '#444', opacity: 0.5 },
            label: relScore >= 8 ? 'DIRECT' : '',
            font: { size: 8, color: '#fbbf24' }
        });
    });

    nodeCountDisp.innerText = `Nodes: ${nodes.length} | Connections: ${edges.length}`;

    // 3. Render Network
    const networkData = { nodes, edges };
    const options = {
        nodes: {
            shape: 'dot',
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            shadow: true,
            selectionWidth: 4
        },
        physics: {
            forceAtlas2Based: {
                gravitationalConstant: -100,
                centralGravity: 0.01,
                springLength: 100,
                springConstant: 0.08
            },
            maxVelocity: 50,
            solver: 'forceAtlas2Based',
            timestep: 0.35,
            stabilization: { iterations: 150 }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200
        }
    };

    network = new vis.Network(container, networkData, options);

    // 4. Generate Recommendations
    generateRecommendations(data);

    // 5. Events
    network.on('selectNode', (params) => {
        const nodeId = params.nodes[0];
        if (nodeId === 'xi_jinping') {
            strategyText.innerText = "The Supreme Leader. All roads lead here. Focus on the high-proximity yellow-bordered nodes for the most efficient connection path.";
            return;
        }
        const lead = data.find(l => l.id == nodeId);
        if (lead) {
            updateStrategy(lead);
        }
    });
}

function generateRecommendations(data) {
    // Sort by proximity (rel score) then alignment (total score)
    const sorted = [...data].sort((a, b) => {
        if (b.relationship_score !== a.relationship_score) {
            return b.relationship_score - a.relationship_score;
        }
        return b.total_score - a.total_score;
    });

    bridgeList.innerHTML = '';
    const topBridges = sorted.slice(0, 5);

    topBridges.forEach(bridge => {
        const div = document.createElement('div');
        div.className = 'recommendation-card p-4 cursor-pointer';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="text-red-600 font-bold uppercase text-sm">${bridge.name}</span>
                <span class="text-xs bg-yellow-500 text-black px-1 font-bold">LVL ${bridge.relationship_score}</span>
            </div>
            <div class="text-xs text-gray-400 uppercase mb-2">${bridge.relationship_desc}</div>
            <div class="text-xs text-zinc-500 italic">"Potential bridge via ${bridge.alignment}% ideological alignment."</div>
        `;
        div.onclick = () => {
            network.selectNodes([bridge.id]);
            updateStrategy(bridge);
        };
        bridgeList.appendChild(div);
    });
}

function updateStrategy(lead) {
    let rec = "";
    if (lead.relationship_score >= 8) {
        rec = `LETHAL PROXIMITY: ${lead.name} has direct access. Use their ${lead.alignment}% alignment to pitch the "Idea Lab" proposal directly. Recommend immediate contact via ${lead.contact || 'secure channels'}.`;
    } else if (lead.relationship_score >= 5) {
        rec = `STRATEGIC ALLY: ${lead.name} is a known entity. Focus on increasing their ideological alignment (currently ${lead.alignment}%) to move them into the inner circle vector.`;
    } else {
        rec = `PERIPHERAL NODE: Proximity is low. Use ${lead.name} as a data gathering point rather than a direct bridge. Look for connections between this agent and higher-scoring bridges.`;
    }
    strategyText.innerText = rec;
}

initNetwork();
