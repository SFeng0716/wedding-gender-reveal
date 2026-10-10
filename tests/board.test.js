const test = require('node:test');
const assert = require('node:assert/strict');
const Board = require('../js/board.js');

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function completedLines(layout) {
  return LINES.filter(([a, b, c]) => layout[a] && layout[a] === layout[b] && layout[b] === layout[c]);
}

test('there are valid layouts to choose from', () => {
  assert.ok(Board.allLayouts().length > 1);
});

test('every layout has 4 boy and 4 girl tiles around an empty centre', () => {
  for (const layout of Board.allLayouts()) {
    assert.equal(layout[Board.CENTER], null);
    assert.equal(layout.filter((c) => c === 'boy').length, 4);
    assert.equal(layout.filter((c) => c === 'girl').length, 4);
  }
});

test('no line is complete before the golden slot opens', () => {
  for (const layout of Board.allLayouts()) {
    assert.deepEqual(completedLines(layout), []);
  }
});

test('revealing the centre completes exactly one line, for either gender', () => {
  for (const layout of Board.allLayouts()) {
    for (const gender of Board.GENDERS) {
      const done = layout.slice();
      done[Board.CENTER] = gender;
      const lines = completedLines(done);
      assert.equal(lines.length, 1);
      assert.equal(done[lines[0][0]], gender);

      const win = Board.winningLine(layout, gender);
      assert.deepEqual([...win].sort(), [...lines[0]].sort());
      assert.equal(win[1], Board.CENTER);
    }
  }
});

test('generateLayout returns a valid copy', () => {
  const a = Board.generateLayout(() => 0);
  const b = Board.generateLayout(() => 0.999999);
  assert.ok(Board.isValidLayout(a));
  assert.ok(Board.isValidLayout(b));
  a[0] = 'x';
  assert.ok(Board.isValidLayout(Board.generateLayout(() => 0)));
});

test('isValidLayout rejects bad layouts', () => {
  assert.equal(Board.isValidLayout(null), false);
  assert.equal(Board.isValidLayout(['boy', 'boy', 'boy', 'girl', null, 'girl', 'boy', 'girl', 'girl']), false);
});
