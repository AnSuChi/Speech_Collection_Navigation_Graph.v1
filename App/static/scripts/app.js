// Cache reset --> cmd+shift+R

// !-- fetch JSON data (nodes & links --!
async function fetchData() {
    try {
        const response = await fetch("/data/dummy.json");
        const data = await response.json();
        return data;
    }
    catch(error) {
        console.error("Could not fetch JSON data: ", error);
    }  
};


// !-- create the graph --!
async function loadGraph() {
    const data = await fetchData();
    if (!data) return;

    // container dimensions
    const container = document.getElementById("graph-nav-domain");
    let width = container.clientWidth;
    let height = container.clientHeight;

    const svg = d3.select("#graph-nav-domain svg")
                .attr("width", width)
                .attr("height", height);

    // zooming & panning
    const zoomContainer = svg.append("g");
    svg.call(d3.zoom()
        .scaleExtent([0.5, 5]) // zoom limits (min% - max%)
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
        .attr("stroke-width", 2);
        
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
    nodes.on("click", selectedNode);
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


//
function selectedNode(event, data) {
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
        .attr("fill", "#093CA0");

    d3.select(event.currentTarget).select("text")
        .text(data.title)
        .transition().duration(300)
        .attr("font-size", "14px");

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
    selectedNode({ currentTarget: randomNode.node() }, data);
};


// functions for graph traversal
function selectNearestNodeUp() {
    
};


// !-- graph event listeners --!
document.addEventListener("DOMContentLoaded", loadGraph);

document.getElementById("selectRandNode-btn").addEventListener("click", () => {
    selectRandomNode();
});