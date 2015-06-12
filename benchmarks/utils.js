function add(a, b) {
  return a + b;
}

function sum(arr) {
  return arr.reduce(add, 0);
}

function avg(arr) {
  return sum(arr) / arr.length;
}

module.exports = {
  add: add,
  sum: sum,
  avg: avg
};
