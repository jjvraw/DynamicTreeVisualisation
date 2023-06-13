export class Heap {

    constructor() {
        this.heap = new Array();
    }

    *heapInsert(freq) {

        let c = this.heap.length;             // c -> index of the child node.
        let p = Math.floor((c - 1) / 2);        // p -> index of parent node.

        let node = new Node(freq); 
        this.heap.push(node); // insert new node in last position.

        if (p >= 0 && this.heap[p].getFrequency() > this.heap[c].getFrequency())
            do {
                yield [c, p, true]; 
                [this.heap[c], this.heap[p]] = [this.heap[p], this.heap[c]]; // swap
                
                c = p; 
                p = Math.floor((c - 1) / 2); 
            } while (p >= 0 && this.heap[p].getFrequency() > this.heap[c].getFrequency())
        else 
            yield [c, p, false];

    }

     *heapRemove() {

        if (this.heap.length <= 0) 
            return;

        if (this.heap.length == 1) 
            return this.heap.pop();
        
        let rmvdNode = this.heap[0];
        this.heap[0] = this.heap.pop(); 
    
        let p = 0;
        let c = 1; 

        while (c <= this.heap.length - 1) {
            
            if (this.heap[c+1] !== undefined)
                if (this.heap[c].getFrequency() >= this.heap[c+1].getFrequency()) {
                    c += 1;
                }

            if (this.heap[c].getFrequency() <= this.heap[p].getFrequency()) {

                yield [c, p, true]; 

                [this.heap[c], this.heap[p]] = [this.heap[p], this.heap[c]];

                p = c; 
                c = (2 * p) + 1;

            } else {
                yield [c, p, false];  
                break;
            }
    
        }

         return rmvdNode; 
    }

    getHeap() {
        return this.heap; 
    }

    // compair ;)
    // pair = [child, pair, true/false] where true/false refers to state of swap in heap.
    pairCompareHeapInConsole(pair) {
    
        if (pair[1] == -1) 
            console.log("\nFirst element inserted:", [this.heap[0].char, this.heap[0].freq]);
        else {
            console.log("\nCompare between", [this.heap[pair[1]].char, this.heap[pair[1]].freq], "&", [this.heap[pair[0]].char, this.heap[pair[0]].freq]);
            console.log("\t► Swap made:", pair[2]);
        }

    }

    pairCompareHeapOutConsole(pair) {

        console.log("\nCompare between", [pair[0].char, pair[0].freq], "&", [pair[1].char, pair[1].freq]);
        console.log("\t► Swap made:", pair[2])

    }

};

class Node {

    constructor(freq) {
        this.freq = freq;
    }  

    getFrequency() {
        return this.freq;
    }

};
