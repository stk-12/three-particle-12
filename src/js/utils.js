
// ラジアンに変換
function radian(val) {
  return (val * Math.PI) / 180;
}

// ランダムな数
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// 線形補間
function lerp(x, y, a) {
  return (1 - a) * x + a * y;
}

// 2点間の距離
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

// 範囲変換
function map(val, start1, stop1, start2, stop2) {
  return (val - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

export {radian, random, lerp, distance, map};