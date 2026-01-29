
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

const INFO_DIR = 'ERCOT INFO';
const OUTPUT_FILE = 'public/data/ercot_structure.json';

// Helper to read CSV
const readCSV = (filename) => {
    const filePath = path.join(process.cwd(), INFO_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return new Promise((resolve) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data)
        });
    });
};

async function main() {
    console.log("Reading CSVs...");

    // Find exact filenames (timestamps vary)
    const files = fs.readdirSync(path.join(process.cwd(), INFO_DIR));
    const findFile = (pattern) => files.find(f => f.startsWith(pattern));

    const resourceFile = findFile('Resource_Node_to_Unit');
    const pointsFile = findFile('Settlement_Points');

    if (!resourceFile || !pointsFile) {
        console.error("Could not find required CSV files.");
        return;
    }

    const resources = await readCSV(resourceFile);
    const points = await readCSV(pointsFile);

    console.log(`Loaded ${resources.length} resources and ${points.length} settlement points.`);

    // Map Resources
    // RESOURCE_NODE -> [{ unit: UNIT_NAME, substation: UNIT_SUBSTATION }]
    const resourceMap = {};
    resources.forEach(r => {
        const rn = r.RESOURCE_NODE;
        if (!resourceMap[rn]) resourceMap[rn] = [];
        resourceMap[rn].push({
            name: r.UNIT_NAME,
            substation: r.UNIT_SUBSTATION
        });
    });

    const hierarchy = {
        hubs: {},
        load_zones: {},
        other: {}
    };

    const addNode = (root, key1, key2, nodeData) => {
        if (!key1) return;

        if (!root[key1]) {
            root[key1] = { substations: {} };
        } else if (!root[key1].substations) {
            // Should not happen if data is consistent, but safety fix
            console.warn(`Warning: root[${key1}] missing substations. Fixing.`);
            root[key1].substations = {};
        }

        const subs = root[key1].substations;
        if (!subs[key2]) subs[key2] = [];

        subs[key2].push(nodeData);
    };

    points.forEach(row => {
        const hub = row.HUB;
        const zone = row.SETTLEMENT_LOAD_ZONE;
        const sub = row.SUBSTATION || 'UNKNOWN';

        const nodeData = {
            id: row.ELECTRICAL_BUS,
            name: row.NODE_NAME,
            psse_name: row.PSSE_BUS_NAME,
            voltage: row.VOLTAGE_LEVEL,
            resource_node: row.RESOURCE_NODE || null,
            units: (row.RESOURCE_NODE && resourceMap[row.RESOURCE_NODE]) ? resourceMap[row.RESOURCE_NODE] : []
        };

        if (hub) {
            addNode(hierarchy.hubs, hub, sub, nodeData);
        }
        if (zone) {
            addNode(hierarchy.load_zones, zone, sub, nodeData);
        }
        if (!hub && !zone) {
            addNode(hierarchy.other, 'Unclassified', sub, nodeData);
        }
    });

    // Extract lists for dropdowns
    const hubs = Object.keys(hierarchy.hubs).sort();
    const zones = Object.keys(hierarchy.load_zones).sort();
    const resourceSet = new Set();

    // Traverse to find all resource nodes
    const traverse = (obj) => {
        if (obj.substations) {
            Object.values(obj.substations).forEach(nodes => {
                nodes.forEach(n => {
                    if (n.resource_node) resourceSet.add(n.resource_node);
                });
            });
        }
    };

    Object.values(hierarchy.hubs).forEach(traverse);
    Object.values(hierarchy.load_zones).forEach(traverse);
    Object.values(hierarchy.other).forEach(traverse); // Also check unclassified

    const locations = {
        hubs,
        zones,
        resources: Array.from(resourceSet).sort()
    };

    // Write Output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(hierarchy, null, 2));
    fs.writeFileSync('public/data/ercot_locations.json', JSON.stringify(locations, null, 2));
    console.log(`Wrote structure to ${OUTPUT_FILE}`);
    console.log(`Wrote locations to public/data/ercot_locations.json (${locations.resources.length} resources)`);
}

main();
