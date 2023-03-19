import {Heap}from './Heap.js';

// Init Heap 
var heap = new Heap(); 
var numbers;

d3.select('#fade-out-button').on('click', buildTable);



async function buildTable() {

    // Fade out button, and remove from div
    d3.select('#fade-out-button').
        attr('disabled', true).
        transition().
        duration(500).
        style('opacity', 0)
        
        // .on('end', function() {
        //     d3.select(this).remove();})

    await delay(800)
    d3.select('#fade-out-button').remove();

    // Insert new button 

    numbers = [];
    while(numbers.length < 23){
        var r = Math.floor(Math.random() * 100) + 1;
        if(!numbers.includes(r)) numbers.push(r);
    }


    // Build Table
    var data = [ numbers ];
    
      var table = d3.select('#table-container')
        .append('table')
        .style('border-collapse', 'separate')
        .style('border', '0');
    
      var rows = table.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');
    
      var cells = rows.selectAll('td')
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
        buildHeap();
        
};

async function buildHeap() {

    // Margins 
    var margin = { top: 40, right: 30, bottom: 50, left: 30 }, 
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    // Append svg  
    var svg = d3.select('.svg-container').
            append('svg').
            attr('width', width + margin.right + margin.left).
            attr('height', height + margin.top + margin.bottom)

    var g = svg.append('g').
            attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var i = 0, duration = 250;

    // Insert restart button
    d3.select('body')
        .append('div')
        .attr('class', 'buttons-div')
        .append('button')
        .attr('class', 'new-list-button fade')
        .text('Generate new numbers')

    d3.select('.new-list-button').on('click', newList);

    // Insert FIRST node in heap
    var num = numbers.shift(); 
    var heapIn = heap.heapInsert(num); 
    for (const pair of heapIn) {}
    
    var data = { 
        number: num, 
        children: []
    };

    // Declares *layout* of tree
    var treemap = d3.tree().size([width, height]);

    // Declare Hierarchy 
    var root = d3.hierarchy(data);
    

    // Maps hierarchy to coordinates
    var mappedData = treemap(root);

    // Enters new nodes as groups, and appends circle for visual
    var node = g.selectAll('.node').data(mappedData.descendants()).
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

    d3.select('#cell' + num)
        .style('background-color', '#c6e2e9')
        .style('color', 'black')
        .style('border', 'solid black 1px');

    // Loop through array of numbers 
    for (var element of numbers) { 

        
        // Create new node OBJECT
        var newNodeObj = {
            number: element, 
            children: []
        }

        // Create new node
        var newNode = d3.hierarchy(newNodeObj); 

        var parentNumber = heap.heap[parseInt((heap.heap.length - 1) / 2)].freq; // p = (c - 1) / 2

        // Return parent node
        var parent = root.descendants().find(function(element) {
            return element.data.number == parentNumber; 
        })   
        
        // Create child node and link with parent
        newNode.depth = parent.depth + 1;
        newNode.parent = parent;
        newNode.id = Date.now();

            // not entirely sure on importance on Node.height field

        if(!parent.children){
            parent.children = [];
            parent.data.children = [];
        }

        parent.data.children.push(newNode.data);
        parent.children.push(newNode); 

        // Mapp data to coordinates with newest node addition
        var mappedData = treemap(root);
        var nodes = mappedData.descendants(), // returns array of all descending nodes from root
            links = mappedData.descendants().slice(1); 
        
        // Update all nodes
        var link = g.selectAll('line.link').
            data(links, function(d) {
                return d.id;
            });

        var node = g.selectAll('.node').
                    data(nodes, function(d) {
                        return d.id ||= (++i);
                    });


        link.transition().
                duration(duration).
                attr('x1', function(d) {
                    return d.parent.x;
                }).
                attr('y1', function(d) {
                    return d.parent.y;
                }).
                attr('x2', function(d) {
                    return d.x;
                }).
                attr('y2', function(d) {
                    return d.y;
                });

        // Transition all nodes to correct location
        node.transition().      
            duration(duration).
            attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        
        g.selectAll('.link').lower();


        // Remove and add text fields #TODO do better
        g.selectAll('.node').
                    select('text').
                    remove();
        g.selectAll('.node').
                    append('text').
                    attr('dy', '.35em').
                    text(function (d) { return d.data.number; });

        await delay(duration);
        
        // Enter new links into parents prev position. 
        var newLinks = link.enter().
                        append('line').
                        attr('class', 'link').
                        attr('stroke-width', 2).
                        attr('stroke', '#a7bed3').
                        attr('x1', function(d) {
                            return parent.x;
                        }).
                        attr('y1', function(d) {
                            return parent.y;
                        }).
                        attr('x2', function(d) {
                            return parent.x;
                        }).
                        attr('y2', function(d) {
                            return parent.y;
                        });
        g.selectAll('.link').lower();
        
        
        // Merge both lists
        var allLinks = newLinks.merge(link); 

        // Transition back to the parent element position
        allLinks.transition().
                    duration(duration).
                    attr('x1', function(d) {
                        return d.parent.x;
                    }).
                    attr('y1', function(d) {
                        return d.parent.y;
                    }).
                    attr('x2', function(d) {
                        return d.x;
                    }).
                    attr('y2', function(d) {
                        return d.y;
                    });
        g.selectAll('.link').lower();
        

        // Enter new nodes into tree at parent's position
        var newNodes = node.enter().
                        append('g').
                        attr('class', 'node').
                        attr('transform', function(d) {
                            return 'translate(' + parent.x + ',' + parent.y + ')';
                        });

        // Merge both lists
        var allNodes = newNodes.merge(node);

        // Add Circle for the nodes for visual
        newNodes.append('circle').
            attr('class', 'node').
            attr('r', 25).
            style('fill', function(d) {
                return '#c6e2e9';
            });

        // Highlight cell in table
        d3.select('#cell' + element)
            .style('background-color', '#c6e2e9')
            .style('color', 'black')
            .style('border', 'solid black 1px');
        
        // Transition new/entered nodes to actual position for animation effect
        newNodes.transition().
            duration(duration).
            attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
        
        // Append new text related to each node's number
        newNodes.append('text').
            attr('dy', '.35em').
            text(function (d) { return d.data.number;});


        // Update the node attributes and style
        allNodes.select('circle.node').
            attr('r', 25).
            style('fill', function(d) {
                return '#c6e2e9';
            });

        // Insert in heap
        heapIn = heap.heapInsert(element);

        // Assign id to each group for searching purposes
        g.selectAll('.node').
            attr('id', function(d) {
                return 'n' + d.data.number;
            })

        // pair key : [c, p, true/false]
        // where c is the index of the child, and p being the index of the parent in the heap array
        // true/false correcsponding to whether a swap between the numbers is made
        for (const pair of heapIn) {

        var tempNode, childNode, parentNode,
            c = heap.heap[pair[0]].freq, 
            p = heap.heap[pair[1]].freq;
            
            // Get child and parent number
            
            root.descendants().forEach((d) => {
                if (d.data.number == c) {
                    childNode = d;
                } else if (d.data.number == p) {
                    parentNode = d;
                }
            });

            // Highlight numbers being compared
            await delay(duration); 
            g.select('#n' + c).select('circle').style('fill', '#7aacac')
            g.select('#n' + p).select('circle').style('fill', '#7aacac')
            await delay(duration * 1.2); 

            if (pair[2]) {

                // Translate c to p and change id
                g.select('#n' + c).transition().duration(duration).
                    attr('transform', function(d) {
                        return 'translate(' + parentNode.x + ',' + parentNode.y + ')';
                    }).attr('id', 'n' + p).select('circle').style('fill', '#c6e2e9');

                tempNode = Object.assign({}, childNode);

                // Translate p to c and change id
                var n2 = g.select('#n' + p).transition().duration(duration).
                    attr('transform', function(d) {
                        return 'translate(' + tempNode.x + ',' + tempNode.y + ')';
                    }).attr('id', 'n' + c).select('circle').style('fill', '#c6e2e9');

                await delay(duration);
                
                // Replace data.number of appropriate nodes #TODO do better
                root.descendants().forEach((d) => {
                if (d.data.number == c) {
                    d.data.number = p;
                } else if (d.data.number == p) {
                    d.data.number = c;
                }

                // Remove and append text #TODO do better 
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

            g.selectAll('.link').lower();

        }

    }


    heapRemoval()

}; 

function heapRemoval() {

    d3.select('.buttons-div')
        .append('button')
        .attr('class', 'remove-single-node fade')
        .text('Remove single node')
        .on('click', heapRemove);

    d3.select('.buttons-div')
        .append('button')
        .attr('class', 'remove-all-nodes fade')
        .text('Remove all nodes')
        .on('click', function() {
            while(heap.heap.length >= 0) {
                heapRemove;
            }
        }); 

}

function heapRemove() {

    var heapOut = heap.heapRemove();


    for (var element of heapOut) {



    }
    
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

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

