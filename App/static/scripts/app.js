// Cache reset --> cmd+shift+R
let currentNodeIndex = 0;

// !-- fetch JSON data (nodes & links --!
async function fetchJsonData() {
    try {
        const response = await fetch("/data/dummy.json");
        return await response.json();
    }
    catch(error) {
        console.error("Could not fetch JSON data");
        return null;
    }  
};

async function getAllData() {
    const data = await fetchJsonData();
    if (!data) return null;

    return data;
};


// !-- track selected nodes --!
const trackSelectedNodes = (() => {
    let prevNodesList = [];
    let prevElementsList = [];
    let indexHistory = 1;
    let minListSize = 1;

    return {
        addNode: (nodeData, addToListIsTrue) => {
            if (addToListIsTrue) {
                prevNodesList.push(nodeData);
                indexHistory = 1;
            };
        },
        addNodeElement: (nodeElement, addToListIsTrue) => {
            if (addToListIsTrue) {
                prevElementsList.push(nodeElement);
            };
        },
        getPrevNode: () => {
            if (prevNodesList.length >= minListSize && indexHistory <= prevNodesList.length) {
                if (indexHistory < prevNodesList.length) {
                    indexHistory++;
                };
                let node = prevNodesList[prevNodesList.length - indexHistory];
                return node;
            }
            return null;
        },
        getPrevNodeElement: () => {
            if (prevElementsList.length >= minListSize && indexHistory <= prevNodesList.length) {
                let nodeElement = prevElementsList[prevElementsList.length - indexHistory];
                return nodeElement;
            }
            return null;
        },
        getAllNodes: () => prevNodesList,
        getAllElements: () => prevElementsList,
    };
})();



// !-- create the graph --!
async function loadGraph() {
    const data = await getAllData();

    // container dimensions
    const container = document.getElementById("graph-nav-domain");
    let width = Math.floor(container.clientWidth);
    let height = Math.floor(container.clientHeight);

    const svg = d3.select("#graph-nav-domain svg")
                .attr("width", width)
                .attr("height", height)
                .style("display", "block");

    // zooming & panning
    const zoomContainer = svg.append("g");
    svg.call(d3.zoom()
        .scaleExtent([0.1, 5]) // zoom limits (min% - max%)
        .on("zoom", (event) => zoomContainer.attr("transform", event.transform)) 
    );

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.lines)
            .id(data => data.id) // convert numeric ids to references
            .distance(450)
        )
        .force("charge", d3.forceManyBody().strength(-100)) // force nodes to repel each other
        .force("center", d3.forceCenter(width / 2, height / 2)) // forces nodes toward the center
        .force("collide", d3.forceCollide(150)); // prevents the overlap of nodes 

    const links = zoomContainer.selectAll("line")
        .data(data.lines)
        .enter()
        .append("line")
        .attr("stroke", "black")
        .attr("stroke-width", data => data.weight * 10);
        
    // create node groups (node + text)
    const nodes = zoomContainer.selectAll("g")
        .data(data.nodes)
        .enter()
        .append("g")
        .call(d3.drag()
            .on("start", (event, data) => dragStart(event, data, simulation))
            .on("drag", (event, data) => dragged(event, data))
            .on("end", (event, data) => dragEnd(event, data, simulation))
        );

    nodes.append("circle")
        .attr("r", 70)
        .attr("fill", "#292D3E")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    nodes.append("text")
        .text(data => data.title.length > 20 ? data.title.slice(0, 20) + "..." : data.title)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    // updates node and link positions on each simulation tick
    simulation.on("tick", () => {
        links
            .attr("x1", data => data.source.x)
            .attr("y1", data => data.source.y)
            .attr("x2", data => data.target.x)
            .attr("y2", data => data.target.y);

        nodes.attr("transform", data => `translate(${data.x},${data.y})`);
    });

    // event listeners for nodes
    nodes.on("click", (event, data) => {
        selectNode(event, data, true);
    });
    
};


// !-- drag functions --!
function dragStart(event, data, simulation) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    data.fx = data.x;
    data.fy = data.y;
};

function dragged(event, data) {
    data.fx = event.x;
    data.fy = event.y;
};

function dragEnd(event, data, simulation) {
    if (!event.active) simulation.alphaTarget(0);
    data.fx = null;
    data.fy = null;
};


// !-- select functions --!
function selectNode(event, data, addToListIsTrue) {
    const secondaryControllerElement = document.getElementById("secondary-traversal-controller");
    if (secondaryControllerElement.dataset.displayController !== "true") {
        secondaryControllerElement.dataset.displayController = "true";
    };
    
    trackSelectedNodes.addNode(data, addToListIsTrue);
    trackSelectedNodes.addNodeElement(event.currentTarget, addToListIsTrue)

    // reset all nodes
    d3.selectAll("g").attr("data-selected", null)
        .select("circle")
        .transition().duration(300)
        .attr("r", 70)
        .attr("fill", "#292D3E");

    d3.selectAll("g").select("text")
        .text(data => data.title.length > 20 ? data.title.slice(0, 20) + "..." : data.title)
        .transition().duration(300)
        .attr("font-size", "12px");


    // effects for the clicked node
    d3.select(event.currentTarget).attr("data-selected", "true")
        .select("circle")
        .transition().duration(300)
        .attr("r", 150)
        .attr("fill", "#291ce5");

    d3.select(event.currentTarget).select("text")
        .text(data.title)
        .transition().duration(300)
        .attr("font-size", "14px");

    // display title and speaker in the sidebar
    updateNodeSidebar(data);

    return event.currentTarget;
};

function selectRandomNode() {
    const nodes = d3.selectAll("g").nodes(); 
    if (nodes.length === 0) return; 

    let randomNode;
    let data;

    do {
        let randomIndex = Math.floor(Math.random() * nodes.length);
        randomNode = d3.select(nodes[randomIndex]); // select random node
        data = randomNode.datum(); // node data
    } while (!data);

    // call selectedNode
    selectNode({ currentTarget: randomNode.node() }, data, true);
};

// returns an array containing currently selected node and its data: [selectedNode, data]
function getSelectedNode() {
    let selectedNode = d3.select("g[data-selected='true']");
    if (selectedNode.empty()) return;

    let data = selectedNode.datum();

    return [selectedNode, data];
};

// removes data-selected attribute on the "node" html-element
function unselectNode(node) {
    node.attr("data-selected", null);
};
// adds data-selected attribute, using the html-element
function setSelectedNode(node) {
    d3.select(node.element).attr("data-selected", "true");
};
// function for graph traversal
function selectNearestNode(direction) {
    let [selectedNode, nodeData] = getSelectedNode() || []; // || [] --> fallback mechanism
    if (!selectedNode) return;

    let { x: currentX, y: currentY } = nodeData; // extract x and y values from nodeData object & assign them to currentX and currentY

    // get all nodes
    let nodes = d3.selectAll("g").nodes()
        .map(node => ({
            element: node,
            data: d3.select(node).datum()
        }))
        .filter(node => node.data);
    if (nodes.length === 0) return;

    // direction filtering
    let filteredNodes = nodes.filter(node => {
        if (direction === "up") return node.data.y < currentY;
        if (direction === "down") return node.data.y > currentY;
        if (direction === "left") return node.data.x < currentX;
        if (direction === "right") return node.data.x > currentX;
    });
    if (filteredNodes.length === 0) return;
    

    let nearestNode = filteredNodes.sort((a, b) => {
        if (direction === "right" || direction === "left") {
            let aAxisDist = Math.abs(a.data.y - currentY);
            let bAxisDist = Math.abs(b.data.y - currentY);
            if (aAxisDist !== bAxisDist) return aAxisDist - bAxisDist; // prioritize closest to y-axis

            return Math.abs(a.data.x - currentX) - Math.abs(b.data.x - currentX);
        } 
        else {
            let aAxisDist = Math.abs(a.data.x - currentX);
            let bAxisDist = Math.abs(b.data.x - currentX);
            if (aAxisDist !== bAxisDist) return aAxisDist - bAxisDist; // prioritize closest to x-axis
            return Math.abs(a.data.y - currentY) - Math.abs(b.data.y - currentY);
        };
    })[0];

    unselectNode(selectedNode);
    setSelectedNode(nearestNode.element);
    selectNode({ currentTarget: nearestNode.element }, nearestNode.data, true);
};


// !-- update UI components --!
function updateNodeSidebar(data) {
    let titleElement = document.getElementById("node-title");
    let speakerElement = document.getElementById("node-speaker");

    titleElement.innerText = `${data.title}`;
    speakerElement.innerText = `By: ${data.speaker}`;
};


async function getConnectedNodesList(nodeData, listLimit) {
    let data = await getAllData();
    if (!data) return [];

    let nodesList = [];

    let connectedNodesList = data.lines.filter(line => 
        line.source == nodeData.id || line.target == nodeData.id
    );
    connectedNodesList.sort((a, b) => b.weight - a.weight); // sort, descending order

    // Strong connections: mostly interested in connections with weight/similarity >= 0.5, hence:
    let strongConnections = connectedNodesList.filter(line => line.weight >= 0.5);
    // list limit: return list w/ "top x" elements IF there are "strong connections" present (weight >= 0.5)
    if (strongConnections.length > 0) {
        nodesList = strongConnections.slice(0, listLimit); // list limit: we want "top x" connections
    } else {
        // Weak connections: IF there are no strong connections, return the "top x" weaker ones
        let weakConnections = connectedNodesList.filter(line => line.weight < 0.5);
        nodesList = weakConnections.slice(0, listLimit);
    };

    let relevantNodes = nodesList.map(edge => 
        data.nodes.find(node => node.id === (edge.source === nodeData.id ? edge.target : edge.source))
    );

    return { nodesList, relevantNodes };
};

function navigateSimilarNodes(nodesList, relevantNodes){
    // PROBLEM: undefined that lingers, when selecting a connectionless node, must be fixed.
    console.log("Navigating...");
    let nextNode = relevantNodes[currentNodeIndex];

    // reset the styling of edges
    d3.selectAll("line")
        .style("stroke", "black") 

    let nextEdgeData = nodesList[currentNodeIndex];

    // highlight the line/edge
    d3.selectAll("line")
        .filter(d => 
            (d.source.id === nextEdgeData.source && d.target.id === nextEdgeData.target) || 
            (d.source.id === nextEdgeData.target && d.target.id === nextEdgeData.source)
        )
        .style("stroke", "red")

    currentNodeIndex = (currentNodeIndex + 1) % nodesList.length;

    let similaritySpan = document.getElementById("similarity-score");
    similaritySpan.textContent = nextEdgeData.weight;

    document.getElementById("confirm-node-btn").addEventListener("click", () => {
        confirmSelectNode(nextNode);
        // reset the line/edge
         d3.selectAll("line")
            .filter(d => 
                (d.source.id === nextEdgeData.source && d.target.id === nextEdgeData.target) || 
                (d.source.id === nextEdgeData.target && d.target.id === nextEdgeData.source)
            )
            .style("stroke", "black")
    }, { once: true });    
};

function confirmSelectNode(nextNode) {
    // SHOULD ONLY RUNS ONCE CONFIRM BUTTON IS CLICKED!
    console.log("Confirming... next node:");
    let selectedNodeElement = d3.select("g[data-selected='true']"); // OWN


    // get all nodes
    let nodes = d3.selectAll("g").nodes() //OWN
        .map(node => ({
            element: node,
            data: d3.select(node).datum()
        }))
        .filter(node => node.data);
    if (nodes.length === 0) return;

    // find the node that matches nextNode data
    let matchingNode = nodes.find(node => node.data.id == nextNode.id);
    if (!matchingNode) return;

    unselectNode(selectedNodeElement);
    setSelectedNode(matchingNode.element);
    selectNode({ currentTarget: matchingNode.element }, matchingNode.data, true);
};


// !-- graph event listeners --!
document.addEventListener("DOMContentLoaded", loadGraph);

document.getElementById("selectRandNode-btn").addEventListener("click", () => {
    selectRandomNode();
});

document.getElementById("selectNearestNodeUp-btn").addEventListener("click", () => {
    selectNearestNode("up");
});

document.getElementById("selectNearestNodeDown-btn").addEventListener("click", () => {
    selectNearestNode("down");
});

document.getElementById("selectNearestNodeRight-btn").addEventListener("click", () => {
    selectNearestNode("right");
});

document.getElementById("selectNearestNodeLeft-btn").addEventListener("click", () => {
    selectNearestNode("left");
});

document.getElementById("next-node-btn").addEventListener("click", async () => {
    let [selectedNodeElement, nodeData] = getSelectedNode() || [];
    if (!selectedNodeElement) return;

    let { nodesList, relevantNodes } = await getConnectedNodesList(nodeData, 5); // .splice used for limit => .splice(start, stop)
    if (nodesList.length === 0 && relevantNodes.length === 0) return;

    navigateSimilarNodes(nodesList, relevantNodes);
});
document.getElementById("prev-node-btn").addEventListener("click", () => {
    console.log("PREVIOUS");

    let prevNode = trackSelectedNodes.getPrevNode();
    let prevNodeElement = trackSelectedNodes.getPrevNodeElement();
    if (!prevNode || ! prevNodeElement) return;

    let selectedNodeElement = d3.select("g[data-selected='true']"); // OWN

    unselectNode(selectedNodeElement);
    setSelectedNode(prevNodeElement);
    selectNode({ currentTarget: prevNodeElement }, prevNode, false);
});