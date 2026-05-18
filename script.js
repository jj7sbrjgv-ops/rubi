const cubeElement = document.getElementById('cube');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');

// 全キューブレット(27個)の状態を保持する配列
let cubilets = [];
// 3x3x3 のキューブサイズ
const size = 3;
// 中心基準で配置するためのオフセット(0,1,2 -> -1,0,1)
const offset = (size - 1) / 2;
// 1キューブレットの見た目サイズ + すき間
const cubiletSize = 60 + 2; // size + gap

// キューブ全体の見た目回転(視点操作用)
let cubeRotation = { x: -30, y: 45 };

// 3x3x3 のキューブを初期状態で作り直す
function initCube() {
    // 既存描画をクリア
    cubeElement.innerHTML = '';
    // 論理データを初期化
    cubilets = [];

    // x,y,z の3重ループで 27個のキューブレットを生成
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                createCubilet(x, y, z);
            }
        }
    }
}

// 1つのキューブレットを作成し、位置と面を設定する
function createCubilet(x, y, z) {
    const el = document.createElement('div');
    el.className = 'cubilet';
    
    // 中心基準(-1,0,1)に変換して3D位置を計算
    const posX = (x - offset) * cubiletSize;
    const posY = (y - offset) * cubiletSize;
    const posZ = (z - offset) * cubiletSize;
    
    // 初期の平行移動を適用
    el.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px)`;
    // 座標情報をデータ属性にも保存(デバッグ/参照用)
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.z = z;

    // 6面を生成
    const faces = ['up', 'down', 'left', 'right', 'front', 'back'];
    faces.forEach(face => {
        const faceEl = document.createElement('div');
        faceEl.className = `face ${face}`;
        
        // 内側に隠れる面は internal クラスを付けて非表示にする
        let isInternal = false;
        if (face === 'up' && y > 0) isInternal = true;
        if (face === 'down' && y < size - 1) isInternal = true;
        if (face === 'left' && x > 0) isInternal = true;
        if (face === 'right' && x < size - 1) isInternal = true;
        if (face === 'front' && z < size - 1) isInternal = true;
        if (face === 'back' && z > 0) isInternal = true;
        
        if (isInternal) faceEl.classList.add('internal');
        
        // 面をキューブレットに追加
        el.appendChild(faceEl);
    });

    // DOMに配置し、論理データとして配列に保持
    cubeElement.appendChild(el);
    cubilets.push({
        element: el,
        x: x,
        y: y,
        z: z,
        matrix: new DOMMatrix()
    });
}

// 入力状態(マウス/タッチ共通)
let isDragging = false;
let lastInputPos = { x: 0, y: 0 };

// ドラッグ開始: 開始座標を記録
function handleStart(e) {
    // コントロール上の操作はキューブ回転に使わない
    if (e.target.closest('.controls') || e.target.closest('button')) return;
    isDragging = true;
    // タッチイベントとマウスイベントを同じ変数で扱う
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastInputPos = { x: clientX, y: clientY };
}

// ドラッグ中: 移動量に応じてキューブ全体の見た目を回転
function handleMove(e) {
    // ドラッグ中でなければ何もしない
    if (!isDragging) return;
    
    // タッチ時のスクロールを防いで回転操作を優先
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 前回位置との差分を算出
    const deltaX = clientX - lastInputPos.x;
    const deltaY = clientY - lastInputPos.y;
    
    // タッチは少し感度高め
    const sensitivity = e.touches ? 0.8 : 0.5;
    
    // 横移動でY軸回転、縦移動でX軸回転
    cubeRotation.y += deltaX * sensitivity;
    cubeRotation.x -= deltaY * sensitivity;
    
    // コンテナに回転を反映
    cubeElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
    // 現在位置を次フレームの基準に更新
    lastInputPos = { x: clientX, y: clientY };
}

// ドラッグ終了
function handleEnd() {
    isDragging = false;
}

// マウスイベント登録
document.addEventListener('mousedown', handleStart);
document.addEventListener('mousemove', handleMove);
document.addEventListener('mouseup', handleEnd);

// タッチイベント登録(passive: false で preventDefault を許可)
document.addEventListener('touchstart', handleStart, { passive: false });
document.addEventListener('touchmove', handleMove, { passive: false });
document.addEventListener('touchend', handleEnd);

// 面記号(U/D/L/R/F/B)を回転パラメータに変換する
function rotateLayer(face) {
    let axis, layerIndex, angle;
    
    switch(face) {
        // U,D はY軸、L,R はX軸、F,B はZ軸
        // layerIndex は対象層(0/2)、angle は90度回転方向
        case 'U': axis = 'y'; layerIndex = 0; angle = -90; break;
        case 'D': axis = 'y'; layerIndex = 2; angle = 90; break;
        case 'L': axis = 'x'; layerIndex = 0; angle = 90; break;
        case 'R': axis = 'x'; layerIndex = 2; angle = -90; break;
        case 'F': axis = 'z'; layerIndex = 2; angle = -90; break;
        case 'B': axis = 'z'; layerIndex = 0; angle = 90; break;
    }
    
    performRotation(axis, layerIndex, angle);
}

// 指定した軸・層・角度でキューブレット群を回転させる
function performRotation(axis, layerIndex, angle) {
    // 対象層のみ抽出(浮動小数誤差対策で Math.round)
    const layer = cubilets.filter(c => Math.round(c[axis]) === layerIndex);
    
    layer.forEach(cubilet => {
        // この手で適用する回転行列を作成
        const m = new DOMMatrix();
        if (axis === 'x') m.rotateSelf(angle, 0, 0);
        if (axis === 'y') m.rotateSelf(0, angle, 0);
        if (axis === 'z') m.rotateSelf(0, 0, angle);
        
        // 現在座標を中心基準に変換
        const oldX = cubilet.x - offset;
        const oldY = cubilet.y - offset;
        const oldZ = cubilet.z - offset;
        
        let newX, newY, newZ;
        
        // 回転行列と同じ内容を座標値にも反映して論理位置を更新
        if (axis === 'x') {
            const rad = angle * Math.PI / 180;
            newX = oldX;
            newY = oldY * Math.cos(rad) - oldZ * Math.sin(rad);
            newZ = oldY * Math.sin(rad) + oldZ * Math.cos(rad);
        } else if (axis === 'y') {
            const rad = angle * Math.PI / 180;
            newX = oldX * Math.cos(rad) + oldZ * Math.sin(rad);
            newY = oldY;
            newZ = -oldX * Math.sin(rad) + oldZ * Math.cos(rad);
        } else if (axis === 'z') {
            const rad = angle * Math.PI / 180;
            newX = oldX * Math.cos(rad) - oldY * Math.sin(rad);
            newY = oldX * Math.sin(rad) + oldY * Math.cos(rad);
            newZ = oldZ;
        }
        
        // 座標を配列管理用のインデックス系へ戻す
        cubilet.x = newX + offset;
        cubilet.y = newY + offset;
        cubilet.z = newZ + offset;
        
        // これまでの向きに今回の回転を掛け合わせて向きを累積
        cubilet.matrix = m.multiply(cubilet.matrix);
        
        // 描画用の移動量を計算
        const posX = (newX) * cubiletSize;
        const posY = (newY) * cubiletSize;
        const posZ = (newZ) * cubiletSize;
        
        // 平行移動 + 回転行列をまとめて適用
        cubilet.element.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px) ${cubilet.matrix.toString()}`;
    });
}

// シャッフル: ランダムな手を20回適用
shuffleBtn.addEventListener('click', () => {
    const moves = ['U', 'D', 'L', 'R', 'F', 'B'];
    let count = 0;
    const interval = setInterval(() => {
        // ランダムな面を選んで1手回す
        const move = moves[Math.floor(Math.random() * moves.length)];
        rotateLayer(move);
        count++;
        // 20手で停止
        if (count >= 20) clearInterval(interval);
    }, 100);
});

// リセット: 配置と視点角度を初期値に戻す
resetBtn.addEventListener('click', () => {
    initCube();
    cubeRotation = { x: -30, y: 45 };
    cubeElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
});

// 初回描画
initCube();
