// Cache reset --> cmd+shift+R

// fetch JSON data (nodes & links)
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
            .id(d => d.id) // convert numeric ids to references
            .distance(250)
        )
        .force("charge", d3.forceManyBody().strength(-50)) // force nodes to repel each other
        .force("center", d3.forceCenter(width / 2, height / 2)) // forces nodes toward the center
        .force("collide", d3.forceCollide(100)); // prevents the overlap of nodes 

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
            .on("start", (event, d) => dragStart(event, d, simulation))
            .on("drag", (event, d) => dragged(event, d))
            .on("end", (event, d) => dragEnd(event, d, simulation))
        );

    nodes.append("circle")
        .attr("r", 70)
        .attr("fill", "#292D3E")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    nodes.append("text")
        .text(d => d.title.length > 20 ? d.title.slice(0, 20) + "..." : d.title)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    // updates node and link positions on each simulation tick
    simulation.on("tick", () => {
        links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodes.attr("transform", d => `translate(${d.x},${d.y})`);
    });
};

// drag functions
function dragStart(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
};

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
};

function dragEnd(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
};

document.addEventListener("DOMContentLoaded", loadGraph);

function focusNode() {
    console.log("Focus node");

    // TODO: animate/expand the clicked node

};