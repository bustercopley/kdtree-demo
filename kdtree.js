(function() {
"use strict";

function Kdtree(points, dimensionCount) {
  const ndim = dimensionCount;
  const depth = requiredDepth(points.length);
  const leafNodeCount = 1 << depth;
  const nonleafCount = leafNodeCount - 1;
  const index = new Array(points.length);
  const splits = new Array(nonleafCount);

  function requiredDepth(pointCount) {
    const leafSize = 5;
    const leafCount = (pointCount / leafSize) | 0;
    let result = 0;
    while (pointCount > 0) {
      ++result;
      pointCount = pointCount >> 1;
    }
    return result - 1;
  }

  function swapIndex(i, j) {
    const temp = index[i];
    index[i] = index[j];
    index[j] = temp;
  }

  function insertionSort(begin, end, dim) {
    for (let i = begin + 1; i != end; ++i) {
      // The range [begin, i) is sorted
      let j = i;
      const item = index[j];
      while (j != begin && points[item][dim] < points[index[j - 1]][dim]) {
        index[j] = index[j - 1];
        --j;
      }
      index[j] = item;
      // The range [begin, i+1) is sorted
    }
    // The range [begin, end is sorted)
  }

  // Reorder range [begin, end) of index so that
  //   val(i) <= val(middle) for i in [begin, middle)
  //   val(j) >= val(middle) for j in (middle, end)
  // where val(i) = points[index[i]][dim]
  function select(begin, middle, end, dim) {
    while (true) {
      if (end - begin <= 7) {
        insertionSort(begin, end, dim);
        return;
      } else {
        // Move middle element to position 1
        swapIndex(begin + 1, begin + ((end - begin) >> 1));
        // Put elements begin, begin + 1, end - 1 in order
        if (points[index[begin]][dim] > points[index[begin + 1]][dim]) {
          swapIndex(begin, begin + 1);
        }
        if (points[index[begin]][dim] > points[index[end - 1]][dim]) {
          swapIndex(begin, end - 1);
        }
        if (points[index[begin + 1]][dim] > points[index[end - 1]][dim]) {
          swapIndex(begin + 1, end - 1);
        }
        // Element in position begin + 1 (the median-of-three) is pivot
        const pivot = points[index[begin + 1]][dim];
        let i = begin + 1;
        let j = end - 1;
        while (true) {
          // Scan forwards and backwards for a pair of out-of-place elements
          while (points[index[++i]][dim] < pivot);
          while (points[index[--j]][dim] > pivot);
          if (i > j) {
            break;
          }
          swapIndex(i, j);
        }
        swapIndex(begin + 1, j);
        // Now partitioned about [j, i); if middle is in [j, i) we are done,
        // otherwise partition [begin, j) or [i, end) about m.
        if (middle < j) {
          end = j;
        } else if (middle >= i) {
          begin = i;
        } else {
          return;
        }
      }
    }
  }

  // Initialize index to the identity permutation
  for (let i = 0; i != index.length; ++i) {
    index[i] = i;
  }

  // Build the tree
  let dim = 0;
  let node = 0;
  for (let level = 0; level != depth; ++level) {
    let begin = 0;
    let levelNodeCount = 1 << level;
    for (let i = 0; i != levelNodeCount; ++i) {
      const end = (((i + 1) * points.length) / levelNodeCount) | 0;
      const middle = (((2 * i + 1) * points.length) / (2 * levelNodeCount)) | 0;
      select(begin, middle, end, dim);
      splits[node++] = points[index[middle]][dim];
      begin = end;
    }
    dim = (dim + 1) % ndim;
  }

  function searchRadius(point, radius, visit) {
    const stack = Array(32);
    let stackTop = 0;
    // Push the root node onto the stack
    stack[stackTop++] = 0;
    let firstNodeOfCurrentLevel = 0;
    let dim = 0;
    while (stackTop != 0) {
      const node = stack[--stackTop];
      if (node < nonleafCount) {
        // Visit a nonleaf node
        // Ascend to the level that contains node
        while (firstNodeOfCurrentLevel > node) {
          firstNodeOfCurrentLevel = firstNodeOfCurrentLevel >> 1;
          dim = (dim + ndim - 1) % ndim;
        }
        // Visit child nodes
        const s = splits[node];
        // Push one or both child nodes onto the stack
        if (point[dim] + radius >= s) {
          stack[stackTop++] = 2 * node + 2;
        }
        if (point[dim] - radius <= s) {
          stack[stackTop++] = 2 * node + 1;
        }
        // Descend one level
        dim = (dim + 1) % ndim;
        firstNodeOfCurrentLevel = 2 * firstNodeOfCurrentLevel + 1;
      } else {
        // Visit each point in leaf node
        const position = node - nonleafCount;
        const begin = ((position * index.length) / leafNodeCount) | 0;
        const end = (((position + 1) * index.length) / leafNodeCount) | 0;
        for (let i = begin; i != end; ++i) {
          visit(index[i]);
        }
      }
    }
  }
  return Object.freeze({searchRadius: searchRadius});
}

// Export.
if (typeof window === "object") {
  window.Kdtree = Kdtree;
}
}());
