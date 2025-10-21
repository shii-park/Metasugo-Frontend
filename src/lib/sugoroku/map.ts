// lib/sugoroku/maps.ts
// ==========================================================
// 目的：全マップの定義を“一元管理”する。
// ここには「意味のデータ（TileKindや座標、エッジ、start/goal）」だけを書く。
// 見た目（色・角丸・影）は各ページ側で TileKind → クラスへ割り当てる。
// - MapDef: id, background（/publicのパス）, tiles[], edges[], start, goal
// - TileDef: id, kind, pos{x,y}, effects?, label?
// - EdgeDef: from, to（分岐はfrom→toが複数でもOK）
// UIはこのデータを読み込んで描画するだけ。仕様変更に強くなる。
// ==========================================================
