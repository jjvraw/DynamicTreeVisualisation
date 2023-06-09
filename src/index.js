import {Heap}from './Heap.js';

d3.select('#fade-out-button').on('click', buildTable);

var duration = 250;
var i = 0;

async function buildTable() {

    /* fade out button */
    await fadeOutBuildHeapButton();

    /* init heap */
    var heap = new Heap();

    /* init array of numbers */
    var numbers = generateRandomNumbers();

    /* build table */
    await buildTableVisual(numbers);

    /* call build heap */
    buildHeap(heap, numbers); 
    
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
async function buildHeap(heap, numbers) {
    /* set margins for svg */
    var margin = { top: 40, right: 30, bottom: 50, left: 30 }, 
        width = 1000 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    /* append svg */
    var svg = d3.select('.svg-container').
            append('svg').
            attr('width', width + margin.right + margin.left).
            attr('height', height + margin.top + margin.bottom)

    var g = svg.append('g').
            attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    /* insert first node in heap */ 
    var num = numbers.shift();
    var heapIn = heap.heapInsert(num); /* generator */
    for (const pair of heapIn) {} /* run generator / insert node in heap */

    var data = { /* data for first node */
        number: num, 
        children: []
    }

    var treemap = d3.tree().size([width, height]); /* declare layour of tree */

    var root = d3.hierarchy(data); /* declare hierarchy of tree */

    var mappedData = treemap(root); /* map data to tree */

    /* enters new node as group. and appends circle for visual */
    createNodeVisuals(g, mappedData);
    styleElement('#cell' + num);

    /* insert new nodes from numbers array in heap */
    insertNewNodesFromNumberArray(heap, numbers, treemap, g, root);

    insertGenerateNewNumbersButton();
}

async function insertNewNodesFromNumberArray(heap, numbers, treemap, g, root) {

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
            parentNode.data.children = [];
        }
        parentNode.children.push(newNode);
        parentNode.data.children.push(newNode.data);

        /* mapp data to coords with newest addition */
        var mappedData = treemap(root),
            nodes = mappedData.descendants(),
            links = mappedData.descendants().slice(1);

        
        let {link, node} = updateLinkAndNodeData(g, links, nodes);
        transitionLinkAndNode(g, link, node, duration);
        await updateNodeText(g, duration);
        let allLinks = enterNewLinks(g, link, parentNode, duration);
        let allNodes = enterNewNodes(g, node, parentNode, element, duration);
        updateNodeAttributes(allNodes);

        /* insert in heap */
        var heapIn = heap.heapInsert(element); /* generator */

        /* assign id to each group for searching purposes */
        g.selectAll('.node')
          .attr('id', function(d) {
                return 'n' + d.data.number;
           })

        /* run generator / insert node in heap */
        await runHeapInsertionGen(heapIn, heap, root, g, duration, allNodes);

        g.selectAll('.link').lower();
        

    }

}

async function runHeapInsertionGen(heapIn, heap, root, g, duration, allNodes) {

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

            /* translate c to p and change id */
            g.select('#n' + c).transition().duration(duration).
                attr('transform', function(d) {
                    return 'translate(' + parentNode.x + ',' + parentNode.y + ')';
                }).attr('id', 'n' + p).select('circle').style('fill', '#c6e2e9');

            tempNode = Object.assign({}, childNode);

            /* translate p to c and change id */
            var n2 = g.select('#n' + p).transition().duration(duration).
                attr('transform', function(d) {
                    return 'translate(' + tempNode.x + ',' + tempNode.y + ')';
                }).attr('id', 'n' + c).select('circle').style('fill', '#c6e2e9');

            await delay(duration);
            
            /* replace data.number of appropriate nodes #TODO do better */
            root.descendants().forEach((d) => {
            if (d.data.number == c) {
                d.data.number = p;
            } else if (d.data.number == p) {
                d.data.number = c;
            }

            /* Remove and append text #TODO do better */
            g.selectAll('text').remove()
            g.selectAll('.node')
            .append('text')
            .attr('dy', '.35em')
            .text(function (d) { return d.data.number; })
            .style('fill', 'black');
            });
                
            allNodes.transition().duration(0).
                attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });

        } else {

            g.select('#n' + c).select('circle').style('fill', '#c6e2e9')
            g.select('#n' + p).select('circle').style('fill', '#c6e2e9')

        }

    }
    

}

function updateLinkAndNodeData(g, links, nodes) {
    var link = g.selectAll('line.link')
                .data(links, d => d.id);

    var node = g.selectAll('.node')
                .data(nodes, d => d.id ||= (++i));
                
    return { link, node };
}

function transitionLinkAndNode(g, link, node, duration) {
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

async function updateNodeText(g, duration) {
    g.selectAll('.node').select('text').remove();
    g.selectAll('.node').append('text')
      .attr('dy', '.35em')
      .text(d => d.data.number);

    await delay(duration);
}

function enterNewLinks(g, link, parent, duration) {
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
    var allLinks = newLinks.merge(link);
    allLinks.transition()
            .duration(duration)
            .attr('x1', d => d.parent.x)
            .attr('y1', d => d.parent.y)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y);

    g.selectAll('.link').lower();

    return allLinks;
}

function enterNewNodes(g, node, parent, element, duration) {
    var newNodes = node.enter()
                      .append('g')
                      .attr('class', 'node')
                      .attr('transform', () => `translate(${parent.x}, ${parent.y})`);

    /* merge old and new nodes */
    var allNodes = newNodes.merge(node);

    /* add Circle for the nodes for visual */
    newNodes.append('circle')
            .attr('class', 'node')
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

    return allNodes;
}

/* updates node attributes */
function updateNodeAttributes(allNodes) {
    allNodes.select('circle.node')
            .attr('r', 25)
            .style('fill', '#c6e2e9');
} 

function createNodeVisuals(g, mappedData, color = '#c6e2e9', radius = 25) {
    g.selectAll('.node').data(mappedData.descendants()).
                enter().append('g').
                attr('class', 'node').
                attr('transform', function (d) {
                    d.x0 = d.x; 
                    d.y0 = d.y;
                    return 'translate(' + d.x + ',' + d.y + ')';
                }).
                append('circle').
                attr('class', 'node').
                attr('r', 25).
                style('fill', function(d) {
                    return '#c6e2e9';
                });
}

function styleElement(id, backgroundColor = '#c6e2e9', color = 'black', border = 'solid black 1px') {
    d3.select(id)
        .style('background-color', backgroundColor)
        .style('color', color)
        .style('border', border);
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

    await delay(600);

    d3.select('table').remove();
    d3.select('svg').remove();
    d3.select('.new-list-button').remove();

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
