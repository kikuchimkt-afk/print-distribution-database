const fs = require('fs');
const owlB64 = fs.readFileSync('public/owl-b64.txt', 'utf-8').trim();
const studentB64 = fs.readFileSync('public/student-b64.txt', 'utf-8').trim();
const howtoB64 = fs.readFileSync('public/howto-b64.txt', 'utf-8').trim();
const owlUri = 'data:image/png;base64,' + owlB64;
const studentUri = 'data:image/jpeg;base64,' + studentB64;
const howtoUri = 'data:image/png;base64,' + howtoB64;

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>宿題連絡帳 フライヤー</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700;900&family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:'Noto Sans JP',sans-serif;background:#2a2a2a;display:flex;justify-content:center;padding:16px}

.flyer{width:210mm;height:297mm;position:relative;overflow:hidden;display:flex;flex-direction:column;background:#0d1f12}

/* HERO 22% */
.hero{flex:0 0 22%;background:linear-gradient(160deg,#0d2818 0%,#1a3a2a 40%,#2d5a3a 70%,#3d7a4a 100%);position:relative;display:flex;align-items:center;padding:0 32px;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent)}
.hero-text{position:relative;z-index:2;flex:1}
.hero-badge{display:inline-block;font-size:8px;font-weight:700;letter-spacing:4px;color:#d4af37;border:1.5px solid #d4af37;padding:2px 12px;margin-bottom:6px}
.hero-catch{font-family:'Noto Serif JP',serif;font-size:26px;font-weight:900;line-height:1.4;color:white;margin-bottom:6px}
.hero-catch em{font-style:normal;color:#d4af37}
.hero-sub{font-size:10.5px;line-height:1.7;color:rgba(255,255,255,0.75);font-weight:300}
.hero-sub strong{color:rgba(255,255,255,0.95);font-weight:500}
.hero-visual{position:relative;z-index:2;flex:0 0 150px;display:flex;align-items:center;justify-content:center}
.hero-owl-img{width:140px;height:140px;object-fit:contain;border-radius:12px;filter:drop-shadow(0 6px 20px rgba(0,0,0,0.4))}

/* CONCEPT BAR */
.concept-bar{flex:0 0 auto;background:#d4af37;color:#1a2e1a;padding:7px 32px;display:flex;align-items:center;gap:10px}
.concept-bar-icon{font-size:15px}
.concept-bar-text{font-family:'Noto Serif JP',serif;font-size:12px;font-weight:700}

/* CONCEPT */
.concept{flex:0 0 auto;background:#f8f6f0;padding:10px 32px 8px;display:flex;gap:14px;align-items:stretch}
.concept-left{flex:1}
.concept-body{font-size:10.5px;line-height:1.85;color:#3a4a3a}
.concept-quotes{background:white;border-left:4px solid #d4af37;border-radius:0 6px 6px 0;padding:7px 14px;margin:5px 0}
.concept-quotes p{font-size:10.5px;color:#5a6a4e;line-height:1.65;font-style:italic}
.highlight{background:linear-gradient(transparent 55%,rgba(212,175,55,0.25) 55%);font-weight:600}
.concept-right{flex:0 0 130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.concept-phone{width:75px;height:130px;background:#1a3a2a;border-radius:10px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,0.15)}
.concept-phone-screen{width:100%;height:100%;background:linear-gradient(180deg,#2a4f3a 0%,#5a9a6a 40%,#a8c898 65%,#d4e8c4 85%,#e8f0d8 100%);border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.ph-title{font-size:5px;color:white;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.3)}
.ph-card{width:75%;background:rgba(255,255,255,0.85);border-radius:3px;padding:2px 4px;font-size:4px;color:#1a3a2a}
.ph-tag{display:inline-block;font-size:3.5px;padding:0 2px;border-radius:1px;font-weight:700}
.ph-tag.m{background:#c8e6c9;color:#2e7d32}.ph-tag.e{background:#ffcdd2;color:#c62828}.ph-tag.s{background:#bbdefb;color:#1565c0}
.concept-qr-text{font-size:8px;color:#7a8a6c;text-align:center;line-height:1.4}

/* FEATURES */
.features{flex:0 0 auto;background:linear-gradient(135deg,#1a3a2a 0%,#2a5a3a 100%);padding:12px 32px;display:flex;gap:12px}
.feat{flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:14px 10px 10px;text-align:center;position:relative}
.feat-num{position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#d4af37;color:#1a2e1a;width:18px;height:18px;border-radius:50%;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
.feat-icon{font-size:22px;margin-bottom:4px}
.feat-title{font-family:'Noto Serif JP',serif;font-size:13px;font-weight:700;color:#d4af37;margin-bottom:4px}
.feat-desc{font-size:9.5px;line-height:1.6;color:rgba(255,255,255,0.8)}
.feat-kw{display:inline-block;margin-top:4px;font-size:7.5px;font-weight:600;color:rgba(212,175,55,0.7);border-bottom:1px solid rgba(212,175,55,0.3);padding-bottom:1px}

/* BOTTOM 50/50 */
.bottom{flex:1;display:flex;min-height:0}
.bottom-left{flex:1;background:#f4f0e4;padding:12px 20px;display:flex;flex-direction:column;justify-content:center;position:relative}
.bottom-left-img{width:100%;height:auto;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;box-shadow:0 3px 10px rgba(0,0,0,0.08)}
.msg-title{font-family:'Noto Serif JP',serif;font-size:13px;font-weight:700;color:#1a3a2a;margin-bottom:4px}
.msg-body{font-size:9.5px;line-height:1.8;color:#3a4a3a}
.free-badge{display:inline-block;background:linear-gradient(135deg,#1a3a2a,#2d5a3a);color:#d4af37;font-size:11px;font-weight:800;padding:3px 12px;border-radius:4px;letter-spacing:0.5px;margin:3px 0;box-shadow:0 2px 6px rgba(0,0,0,0.12)}

.bottom-right{flex:1;background:linear-gradient(180deg,#1a3a2a,#0d2818);color:white;padding:12px 20px;display:flex;flex-direction:column;justify-content:center}
.howto-label{font-size:8px;font-weight:600;letter-spacing:3px;color:#d4af37;margin-bottom:12px}
.howto-title{font-family:'Noto Serif JP',serif;font-size:14px;font-weight:700;color:white;margin-bottom:14px}
.howto-steps{list-style:none}
.howto-steps li{display:flex;align-items:flex-start;gap:10px;padding:6px 0;font-size:11px;color:rgba(255,255,255,0.9);line-height:1.5}
.howto-num{width:22px;height:22px;background:#d4af37;color:#1a2e1a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.howto-desc{font-size:9px;color:rgba(255,255,255,0.5);margin-top:8px;line-height:1.5}
.howto-img{width:100%;max-width:160px;height:auto;margin:8px auto 0;display:block;border-radius:8px;opacity:0.9}

/* FOOTER */
.flyer-footer{flex:0 0 auto;background:#d4af37;padding:6px 32px;display:flex;justify-content:space-between;align-items:center}
.footer-brand{font-family:'Noto Serif JP',serif;font-size:11px;font-weight:700;color:#1a2e1a}
.footer-sub{font-size:8px;color:rgba(26,46,26,0.6)}
.footer-owls{font-size:14px;display:flex;gap:3px}

@media print{body{background:none;padding:0}.flyer{box-shadow:none}}
</style>
</head>
<body>
<div class="flyer">
  <div class="hero">
    <div class="hero-text">
      <div class="hero-badge">PREMIUM SUPPORT</div>
      <h1 class="hero-catch">お子さまだけの<em>「学びの地図」</em>を、<br>教室長が<em>お届け</em>します。</h1>
      <p class="hero-sub">受講教科だけでなく、<strong>理科・社会・英検対策</strong>まで。<br>お子さまの「今必要なこと」を、教室長が<strong>直接選んでお届け</strong>します。</p>
    </div>
    <div class="hero-visual">
      <img src="${owlUri}" alt="フクロウ家族" class="hero-owl-img">
    </div>
  </div>

  <div class="concept-bar"><div class="concept-bar-icon">💡</div><div class="concept-bar-text">開発コンセプト ── 「教室長の目」をご家庭へ</div></div>

  <div class="concept">
    <div class="concept-left">
      <div class="concept-body">
        <p>個別指導では、担当講師が授業内容に合わせた宿題を出しています。しかし、教室長として日々お子さまを見ていると──</p>
        <div class="concept-quotes">
          <p>「この子は理科の計算が弱いから、今のうちに補強したい」</p>
          <p>「英検の面接対策、そろそろ始めたほうがいい」</p>
          <p>「学校のテスト範囲に合わせた追加教材を渡したい」</p>
        </div>
        <p>そうした<span class="highlight">「授業の枠を超えた気づき」</span>を形にしたのが、この<span class="highlight">宿題連絡帳</span>です。当校が<span class="highlight">独自に開発</span>した、生徒一人ひとりのための特別なサポートツールです。</p>
      </div>
    </div>
    <div class="concept-right">
      <div class="concept-phone"><div class="concept-phone-screen"><div class="ph-title">🦉 宿題連絡帳</div><div class="ph-card"><div class="ph-tag m">数学</div> 教科書 P.42〜45</div><div class="ph-card"><div class="ph-tag e">英検</div> 面接対策プリント</div><div class="ph-card"><div class="ph-tag s">理科</div> 電流の計算ドリル</div></div></div>
      <div class="concept-qr-text">QRコードを読み取るだけで<br>お子さま専用ページへ →</div>
    </div>
  </div>

  <div class="features">
    <div class="feat"><div class="feat-num">1</div><div class="feat-icon">🎯</div><div class="feat-title">完全個別対応</div><div class="feat-desc">教室長がお子さまの状況を見て<br>最適な教材・課題を直接選定。<br>受講教科に限らず対応します。</div><div class="feat-kw">教科を超えた個別サポート</div></div>
    <div class="feat"><div class="feat-num">2</div><div class="feat-icon">📱</div><div class="feat-title">スマホで即確認</div><div class="feat-desc">QRコードを読み取るだけで<br>お子さま専用ページにアクセス。<br>PDF教材の閲覧・印刷も可能。</div><div class="feat-kw">いつでも・どこでも</div></div>
    <div class="feat"><div class="feat-num">3</div><div class="feat-icon">📊</div><div class="feat-title">学習の見える化</div><div class="feat-desc">お子さまの学習状況を<br>教室長がリアルタイムで確認。<br>次回の指導に活かします。</div><div class="feat-kw">家庭学習もサポート</div></div>
  </div>

  <div class="bottom">
    <div class="bottom-left">
      <img src="${studentUri}" alt="中学生の家庭学習" class="bottom-left-img">
      <h3 class="msg-title">✉️ 保護者の方へ</h3>
      <div class="msg-body">
        <p>このサービスは、通常の個別指導の宿題とは別に、教室長が責任を持ってお届けする<strong>追加サポート</strong>です。</p>
        <p><span class="free-badge">追加料金は一切かかりません</span></p>
        <p>「うちの子に今、何が必要なのか」を教室長の視点でお伝えし、ご家庭での学習を全力でサポートいたします。</p>
        <p style="margin-top:6px;font-size:9px;line-height:1.7;color:#5a6a4e;">◉ 定期テスト前の重点対策プリント<br>◉ 英検・漢検など検定対策教材<br>◉ 弱点補強のための追加ドリル<br>◉ 学校の宿題では足りない部分のフォロー<br>など、お子さまに合わせた教材をお届けします。</p>
      </div>
    </div>
    <div class="bottom-right">
      <div class="howto-label">HOW TO USE</div>
      <div class="howto-title">📱 ご利用方法</div>
      <ul class="howto-steps">
        <li><span class="howto-num">1</span>教室でお子さま専用の<br>QRコードをお渡しします</li>
        <li><span class="howto-num">2</span>スマホのカメラで<br>読み取るだけ</li>
        <li><span class="howto-num">3</span>ブックマーク登録で<br>次回からワンタップ！</li>
      </ul>
      <p class="howto-desc">※ アプリのインストールは不要です。<br>※ QRコードは一度だけ。宿題が追加されても<br>　 同じページで最新情報が確認できます。<br>※ PDF教材はスマホで閲覧・ご自宅で印刷可能。<br>※ お子さまの閲覧状況を教室長が確認し、<br>　 次回の指導に活かしています。</p>
      <img src="${howtoUri}" alt="QRコードでアクセス" class="howto-img">
    </div>
  </div>

  <div class="flyer-footer"><div><div class="footer-brand">ECC藍住・北島中央・大学前</div><div class="footer-sub">個別指導塾</div></div><div class="footer-owls">🦉🦉🦉</div></div>
</div>
</body>
</html>`;

fs.writeFileSync('public/flyer.html', html);
console.log('Done! File size:', html.length, 'bytes');
