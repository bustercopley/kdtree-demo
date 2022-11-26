// -*- coding: utf-8; -*-

(function() {
"use strict";

const points = generatePoints(1000000);
const tree = new Kdtree(points, 2);
const pointsSelected = new Array();
let updatePending = false;
let oldWidth = -1.0;
let oldHeight = -1.0;
let oldRatio = -1.0;
const eventPoint = new DOMPoint;

function generatePoints(count) {
  const points = new Array(count);
  for (let i = 0; i != count; ++i) {
    points[i] = [Math.random() - 0.5, Math.random() - 0.5];
  }
  return points;
}

function pointerMove(e) {
  eventPoint.x = e.clientX;
  eventPoint.y = e.clientY;
  invalidate();
}

function touchMove(event) {
  if (event.touches.length == 1) {
    pointerMove(event.touches[0]);
  }
}

function invalidate() {
  if (!updatePending) {
    updatePending = true;
    requestAnimationFrame(render);
  }
}

function render() {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.right) - Math.round(rect.left);
  const height = Math.round(rect.bottom) - Math.round(rect.top);
  const ratio = window.devicePixelRatio;
  const size = Math.min(width, height) * ratio;
  const view = new DOMMatrix([size, 0.0, 0.0, size, 0.5 * width, 0.5 * height]);

  function addPoint(point, radius) {
    context.beginPath();
    context.arc(point[0], point[1], radius, 0.0, 2.0 * Math.PI);
    context.closePath();
  }

  if (width != oldWidth || height != oldHeight || ratio != oldRatio) {
    oldWidth = width;
    oldHeight = height;
    oldRatio = ratio;
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    context.resetTransform();
    context.clearRect(0, 0, width, height);
    context.fillStyle = "grey";
    context.setTransform(view);
    for (let point of points) {
      addPoint(point, 0.003);
      context.fill();
    }
  } else {
    context.fillStyle = "grey";
    context.setTransform(view);
    for (let index of pointsSelected) {
      addPoint(points[index], 0.003);
      context.fill();
    }
  }
  pointsSelected.length = 0;
  const x = (eventPoint.x - rect.left) / rect.width - 0.5;
  const y = (eventPoint.y - rect.top) / rect.height - 0.5;
  const radius = 0.01;
  context.fillStyle = "red";
  context.setTransform(view);
  tree.searchRadius([x, y], radius, function(index) {
    if (Math.hypot(points[index][0] - x, points[index][1] - y) < radius) {
      pointsSelected.push(index);
      addPoint(points[index], 0.002);
      context.fill();
    }
  });

  updatePending = false;
}

document.addEventListener("DOMContentLoaded", function() {
  const canvas = document.getElementById("canvas");
  canvas.addEventListener("mousemove", pointerMove, false);
  canvas.addEventListener("touchmove", touchMove, true);
  invalidate();
});
}());
