import {Heap}from './Heap.js';

d3.select('#fade-out-button').on('click', buildTable);

var heap; 
var duration = 100;
var i;
var g; 
var root;
var allNodes;
var allLinks;

async function buildTable() {

    /* fade out button */
    await fadeOutBuildHeapButton();

    /* init heap */
    heap = new Heap();

    /* init array of numbers */
    var numbers = generateRandomNumbers();

    /* build table */
    await buildTableVisual(numbers);

    /* call build heap */
    buildHeap(numbers); 
    
}

/**
 * Builds the visual of the number array
 * @param {*} numbers numbers to build visual of
 */
async function buildTableVisual(numbers) {

    var data = [numbers];

    var table = d3.select('#table-container')
                  .append('table')
                  .style('border-collapse', 'separate')
                  .style('border', '0');

    var rows = table.selectAll('tr')
                    .data(data)
                    .enter()
                    .append('tr');

    rows.selectAll('td')
        .data(function(d) { return d; })
        .enter()
        .append('td')
        .style('opacity', '0')
        .style('border-radius', '10px')
        .style('padding', '10px')
        .text(function(d) { return d; })
        .attr('class', 'cells')
        .attr('id', function(d) {
            return 'cell' + d
        });

    var tds = d3.selectAll('.cells').nodes();
    
     for (var td of tds) {
        td.style.color = '#c6e2e9'
        td.style.border = 'solid #c6e2e9 1px'
        d3.select(td).transition()
                     .duration(500)
                     .style('opacity', 1);
        await delay(100);
    }

    await delay(100);
}


async function fadeOutBuildHeapButton() {
    d3.select('#fade-out-button').
    attr('disabled', true).
    transition().
    duration(500).
    style('opacity', 0)

    await delay(800)
    d3.select('#fade-out-button').remove();
}

/**
 * Generates an array of random numbers
 * @returns returns array of random numbers
 */
function generateRandomNumbers() {
    var numbers = [];
    while(numbers.length < 23){
        var r = Math.floor(Math.random() * 100) + 1;
        if(!numbers.includes(r)) numbers.push(r);
    }
    return numbers;
}

/**
 * 
 * @param {*} heap 
 * @param {*} numbers 
 */
async function buildHeap(numbers) {
    /* set margins for svg */
    var margin = { top: 40, right: 30, bottom: 50, left: 30 }, 
        width = 1000 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    /* append svg */
    var svg = d3.select('.svg-container').
            append('svg').
            attr('width', width + margin.right + margin.left).
            attr('height', height + margin.top + margin.bottom)

    g = svg.append('g').
            attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    /* insert first node in heap */ 
    var num = numbers.shift();
    var heapIn = heap.heapInsert(num); /* generator */
    updateNodesText();
    for (const pair of heapIn) {} /* run generator / insert node in heap */

    var data = { /* data for first node */
        number: num, 
        children: []
    }

    var treemap = d3.tree().size([width, height]); /* declare layour of tree */

    root = d3.hierarchy(data); /* declare hierarchy of tree */

    var mappedData = treemap(root); /* map data to tree */

    /* enters new node as group. and appends circle for visual */
    createNodeVisuals(mappedData);
    styleElement('#cell' + num);

    /* insert new nodes from numbers array in heap */
    await insertNewNodesFromNumberArray(numbers, treemap);

    /* fade out numbers */
    fadeOutNumbers();
    
    /* fade in buttons */
    insertGenerateNewNumbersButton();
    insertRemoveSingleNodeButton();
    insertRemoveAllNodesButton();
}

async function fadeOutNumbers() {
    d3.selectAll('.cells').transition()
        .duration(500)
        .style('opacity', 0);
}

async function insertNewNodesFromNumberArray(numbers, treemap) {
    i = 0;
    /* loop through array of numbers */
    for (var element of numbers) {

        /* create data for new node */
        var data = {
            number: element,
            children: []
        }

        var newNode = d3.hierarchy(data);

        /* get parent's number of new node */
        var parentNumber = heap.heap[parseInt((heap.heap.length - 1) / 2)].freq; /* p = (c - 1) / 2 */

        /* get parent node */
        var parentNode = root.descendants().find(function (d) {
            return d.data.number == parentNumber;
        });

        /* link node with parent */
        newNode.depth = parentNode.depth + 1;
        newNode.parent = parentNode;
        newNode.id = Date.now(); 
        //// newNode.height = parentNode.height - 1; not sure on importance of height
        if(!parentNode.children){
            parentNode.children = [];
        }
        parentNode.children.push(newNode);

        /* mapp data to coords with newest addition */
        var mappedData = treemap(root),
            nodes = mappedData.descendants(),
            links = mappedData.descendants().slice(1);

        
        let {link, node} = updateLinkAndNodeData(links, nodes);
        transitionLinkAndNode(link, node);
        await updateNodesText();
        enterNewLinks(link, parentNode);
        enterNewNodes(node, parentNode, element);
        updateNodeAttributes();

        /* insert in heap */
        var heapIn = heap.heapInsert(element); /* generator */

        /* assign id to each group for searching purposes */
        d3.selectAll('.node')
          .attr('id', function(d) {
                return 'n' + d.data.number;
           })

        /* run generator / insert node in heap */
        await runHeapInsertionGen(heapIn, duration);

        g.selectAll('.link').lower();
        
    }

}

async function runHeapInsertionGen(heapIn, duration) {

    /*  pair key : [c, p, true/false]
        where c is the index of the child, and p being the index of the parent in the heap array
        true/false correcsponding to whether a swap between the numbers is made */
    for (const pair of heapIn) {

        var tempNode, childNode, parentNode,
            c = heap.heap[pair[0]].freq,
            p = heap.heap[pair[1]].freq;

        /* get child and parent number */
        root.descendants().forEach((d) => {
            if (d.data.number == c) {
                childNode = d;
            } else if (d.data.number == p) {
                parentNode = d;
            }
        });

        /* visually 'highlight' numbers currently being compared */ 
        await delay(duration); 
        g.select('#n' + c).select('circle').style('fill', '#7aacac')
        g.select('#n' + p).select('circle').style('fill', '#7aacac')
        await delay(duration * 1.2); 

        if (pair[2]) {

            tempNode = Object.assign({}, childNode);

            /* translate c to p and change id */
            g.select('#n' + c).transition().duration(duration)
                .attr('transform', function(d) {
                    return 'translate(' + parentNode.x + ',' + parentNode.y + ')';
                })
                .select('circle').style('fill', '#c6e2e9')
                .on("end", function() { d3.select(this.parentNode).attr('id', 'n' + p); });

            /* translate p to c and change id */
            g.select('#n' + p).transition().duration(duration)
                .attr('transform', function(d) {
                    return 'translate(' + tempNode.x + ',' + tempNode.y + ')';
                })
                .select('circle').style('fill', '#c6e2e9')
                .on("end", function() { d3.select(this.parentNode).attr('id', 'n' + c); });

            await delay(duration);
            
            /* replace data.number of appropriate nodes #TODO do better */
            root.descendants().forEach((d) => {
                if (d.data.number == c) {
                    d.data.number = p;
                } else if (d.data.number == p) {
                    d.data.number = c;
                }

                // Remove and append text #TODO do better 
                g.selectAll("text").remove()
                g.selectAll('.node')
                .append("text")
                .attr("dy", ".35em")
                .text(function (d) { return d.data.number; })
                .style('fill', 'black');
            });

            console.log(root.data.number);
                
            allNodes.transition().duration(0)
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });

        } else {

            g.select('#n' + c).select('circle').style('fill', '#c6e2e9')
            g.select('#n' + p).select('circle').style('fill', '#c6e2e9')

        }

    }
    

}

function updateLinkAndNodeData(links, nodes) {
    var link = g.selectAll('line.link')
                .data(links, d => d.id);

    var node = g.selectAll('.node')
                .data(nodes, d => d.id ||= (++i));
                
    return { link, node };
}

function transitionLinkAndNode(link, node) {
    link.transition()
        .duration(duration)
        .attr('x1', d => d.parent.x)
        .attr('y1', d => d.parent.y)
        .attr('x2', d => d.x)
        .attr('y2', d => d.y);

    node.transition()
        .duration(duration)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    g.selectAll('.link').lower();
}

async function updateNodesText() {
    g.selectAll('.node').select('text')
        .text(d => d.data.number);

    await delay(duration);
}


function enterNewLinks(link, parent) {
    var newLinks = link.enter()
                      .append('line')
                      .attr('class', 'link')
                      .attr('stroke-width', 2)
                      .attr('stroke', '#a7bed3')
                      .attr('x1', () => parent.x)
                      .attr('y1', () => parent.y)
                      .attr('x2', () => parent.x)
                      .attr('y2', () => parent.y);

    g.selectAll('.link').lower();

    /* Merge old and new links and transition */
    allLinks = newLinks.merge(link);
    allLinks.transition()
            .duration(duration)
            .attr('x1', d => d.parent.x)
            .attr('y1', d => d.parent.y)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y);

    g.selectAll('.link').lower();
}

function enterNewNodes(node, parent, element) {
    var newNodes = node.enter()
                      .append('g')
                      .attr('class', 'node')
                      .attr('transform', () => `translate(${parent.x}, ${parent.y})`);

    /* merge old and new nodes */
    allNodes = newNodes.merge(node);


    /* add Circle for the nodes for visual */
    newNodes.append('circle')
            .attr('r', 25)
            .style('fill', '#c6e2e9');

    /* highlight cell in table */
    styleElement(`#cell${element}`);

    /* transition new nodes to their final position */
    newNodes.transition()
            .duration(duration)
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

    /* append new text related to each node's number */
    newNodes.append('text')
            .attr('dy', '.35em')
            .text(d => d.data.number);
}

/* updates node attributes */
function updateNodeAttributes() {
    allNodes.select('circle.node')
            .attr('r', 25)
            .style('fill', '#c6e2e9');
} 

function createNodeVisuals(mappedData) {

    var node = g.selectAll('.node')  // Select all existing nodes
        .data(mappedData.descendants())  // Bind the descendants of the mapped data
        .enter()  // For all the nodes that don't yet exist
        .append('g')  // Append a group for each one
        .attr('class', 'node')  // Add a class to each group
        .attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });  // Position the node

    node.append("circle")  // Append a circle to each group
        .attr("r", 25)  // Set the radius
        .attr("fill", "rgb(198, 226, 233)")  // Set the fill color
        .attr("id", function(d) {
            return "cell" + d.data.number;  // Set the id based on the data
        });
      
    node.append("text")  // Append text to each group
        .attr("dy", ".35em")  // Adjust vertical alignment
        .attr("x", 0)  // Center align horizontally
        .attr("y", 0)  // Center align vertically
        .style("text-anchor", "middle")  // Center the text
        .text(function(d) {
            return d.data.number;  // Set the text based on the data
        });

    return node;
}


function styleElement(id, backgroundColor = '#c6e2e9', color = 'black', border = 'solid black 1px') {
    d3.select(id)
        .style('background-color', backgroundColor)
        .style('color', color)
        .style('border', border);
}

async function removeSingleNode() {

    /* get frequency of new root node */ 
    var newRoot = heap.heap[heap.getHeap().length - 1].freq;

    /* move newRoot to old root's position */
    var newRootNode = d3.select('#n' + newRoot);
    newRootNode.transition().duration(duration)
        .attr('transform', function() {
            return 'translate(' + root.x + ',' + root.y + ')'; 
        });

    root.descendants().forEach((d) => {
        if (d.data.number == newRoot) {
            d.data.number = null;
        }
    });

    /* fade out old link */ 
    var group = allLinks._groups[0];
    var lastLink = group.pop();
    d3.select(lastLink)
        .transition()
        .duration(duration)
        .style('opacity', 0);

    await delay(duration * 1.2);

    /* remove link */
    d3.select(lastLink).remove();

    /* update data of root node */ 
    root.data.number = newRoot;

    /* remove newRootNode from the DOM */
    newRootNode.remove();

    /* change id of root node */
    d3.select('#n' + heap.getHeap()[0].getFrequency())
        .attr('id', 'n' + newRoot)

    updateNodesText();

    console.log(root)


    /* remove node from heap */
    var heapOut = heap.heapRemove();

    for (const pair of heapOut) {

        var tempNode, childNode, parentNode,
            c = heap.heap[pair[0]].freq,
            p = heap.heap[pair[1]].freq;

        /* get child and parent number */
        root.descendants().forEach((d) => {
            if (d.data.number == c) {
                childNode = d;
            } else if (d.data.number == p) {
                parentNode = d;
            }
        });

        /* visually 'highlight' numbers currently being compared */ 
        await delay(duration); 
        g.select('#n' + c).select('circle').style('fill', '#7aacac')
        g.select('#n' + p).select('circle').style('fill', '#7aacac')
        await delay(duration * 1.2); 

        console.log(pair)
        console.log(c);
        console.log(p);
        console.log(root.descendants());

        if (pair[2]) {

            tempNode = Object.assign({}, childNode);

            /* translate c to p and change id */
            g.select('#n' + c).transition().duration(duration)
            .attr('transform', function(d) {
                return 'translate(' + parentNode.x + ',' + parentNode.y + ')';
            })
            .select('circle').style('fill', '#c6e2e9');

            /* translate p to c and change id */
            g.select('#n' + p).transition().duration(duration)
            .attr('transform', function(d) {
                return 'translate(' + tempNode.x + ',' + tempNode.y + ')';
            })
            .select('circle').style('fill', '#c6e2e9');

            /* delay id change */
            setTimeout(() => {
            d3.select('#n' + c).attr('id', 'n' + p);
            d3.select('#n' + p).attr('id', 'n' + c);
            }, duration);


            await delay(duration);
            
            /* replace data.number of appropriate nodes #TODO do better */
            root.descendants().forEach((d) => {

                if (d.data.number == c) {
                    d.data.number = p;
                } else if (d.data.number == p) {
                    d.data.number = c;
                }

                // Remove and append text #TODO do better 
                g.selectAll("text").remove()
                g.selectAll('.node')
                .append("text")
                .attr("dy", ".35em")
                .text(function (d) { return d.data.number; })
                .style('fill', 'black');
            });

            console.log(root.data.number);
                
            allNodes.transition().duration(0)
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
            });


        } else {

            g.select('#n' + c).select('circle').style('fill', '#c6e2e9');
            g.select('#n' + p).select('circle').style('fill', '#c6e2e9');

        }
    }

}

async function removeAllNodes() {
    while(heap.getHeap().length > 1) {
        await removeSingleNode();
    }

}


function insertGenerateNewNumbersButton() {
    d3.select('body')
        .append('div')
        .attr('class', 'buttons-div')
        .append('button')
        .attr('class', 'new-list-button fade')
        .text('Generate new numbers')

    d3.select('.new-list-button').on('click', newList);
}

function insertRemoveSingleNodeButton() {
    d3.select('body')
        .select('.buttons-div')
        .append('button')
        .attr('class', 'remove-single-node-button fade')
        .text('Remove Single Node');

    d3.select('.remove-single-node-button').on('click', removeSingleNode);
}

function insertRemoveAllNodesButton() {
    d3.select('body')
        .select('.buttons-div')
        .append('button')
        .attr('class', 'remove-all-nodes-button fade')
        .text('Remove All Nodes');

    d3.select('.remove-all-nodes-button').on('click', removeAllNodes);
}

async function newList() {
    d3.select('table').transition()
        .duration(500)
        .style('opacity', 0);

    d3.select('svg').transition()
        .duration(500)
        .style('opacity', 0);

    d3.select('.new-list-button').transition()
        .duration(500)
        .style('opacity', 0);

    d3.select('.remove-single-node-button').transition()
        .duration(500)
        .style('opacity', 0);

    await delay(600);

    d3.select('table').remove();
    d3.select('svg').remove();
    d3.select('.new-list-button').remove();
    d3.select('.remove-single-node-button').remove();
    d3.select('.remove-all-nodes-button').remove();
    d3.select('.buttons-div').remove();

    buildTable();
}

/**
 * delays the execution of the next line of code
 * @param {*} milliseconds milliseconds to delay
 * @returns returns new promise
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
