/*
 * Board logic for the tic-tac-toe reveal.
 *
 * Cells are indexed 0-8, row by row; 4 is the golden centre slot.
 * The 8 outer cells hold 4 boy + 4 girl tiles, arranged so that:
 *   - no outer row/column is a single colour (nothing is decided early),
 *   - exactly one boy pair and exactly one girl pair sit opposite each other
 *     across the centre.
 * Either way the centre turns, it completes exactly one line — so the
 * board itself gives nothing away; only the golden slot decides.
 */
(function (root) {
  'use strict';

  var CENTER = 4;
  var OUTER = [0, 1, 2, 3, 5, 6, 7, 8];
  // Opposite cells: each pair forms a line together with the centre.
  var PAIRS = [[0, 8], [2, 6], [1, 7], [3, 5]];
  // Lines that do not pass through the centre.
  var OUTER_LINES = [[0, 1, 2], [6, 7, 8], [0, 3, 6], [2, 5, 8]];
  var GENDERS = ['boy', 'girl'];

  function combinations(items, k) {
    if (k === 0) return [[]];
    var out = [];
    for (var i = 0; i <= items.length - k; i++) {
      var rest = combinations(items.slice(i + 1), k - 1);
      for (var j = 0; j < rest.length; j++) out.push([items[i]].concat(rest[j]));
    }
    return out;
  }

  function isValidLayout(layout) {
    if (!Array.isArray(layout) || layout.length !== 9 || layout[CENTER] !== null) return false;
    var boys = 0;
    for (var i = 0; i < OUTER.length; i++) {
      var c = layout[OUTER[i]];
      if (GENDERS.indexOf(c) === -1) return false;
      if (c === 'boy') boys++;
    }
    if (boys !== 4) return false;

    var boyPairs = 0;
    var girlPairs = 0;
    PAIRS.forEach(function (p) {
      if (layout[p[0]] === layout[p[1]]) {
        if (layout[p[0]] === 'boy') boyPairs++;
        else girlPairs++;
      }
    });
    if (boyPairs !== 1 || girlPairs !== 1) return false;

    return OUTER_LINES.every(function (line) {
      return !(layout[line[0]] === layout[line[1]] && layout[line[1]] === layout[line[2]]);
    });
  }

  var cachedLayouts = null;
  function allLayouts() {
    if (cachedLayouts) return cachedLayouts;
    cachedLayouts = combinations(OUTER, 4)
      .map(function (boyCells) {
        var layout = [];
        for (var i = 0; i < 9; i++) layout.push(i === CENTER ? null : boyCells.indexOf(i) !== -1 ? 'boy' : 'girl');
        return layout;
      })
      .filter(isValidLayout);
    return cachedLayouts;
  }

  function generateLayout(rng) {
    var list = allLayouts();
    var pick = Math.floor((rng || Math.random)() * list.length);
    return list[Math.min(pick, list.length - 1)].slice();
  }

  // The three cells (in drawing order) that form the winning line once the
  // centre is revealed as `gender`.
  function winningLine(layout, gender) {
    for (var i = 0; i < PAIRS.length; i++) {
      var p = PAIRS[i];
      if (layout[p[0]] === gender && layout[p[1]] === gender) return [p[0], CENTER, p[1]];
    }
    return null;
  }

  var api = {
    CENTER: CENTER,
    OUTER: OUTER,
    GENDERS: GENDERS,
    isValidLayout: isValidLayout,
    allLayouts: allLayouts,
    generateLayout: generateLayout,
    winningLine: winningLine
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Board = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
