const fs = require('fs');
const path = require('path');

// 日付フォーマット関数（日本時間で正確に取得）
function getJapaneseDate() {
  // 日本時間 (UTC+9) で現在時刻を取得
  const now = new Date();
  const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  
  const year = japanTime.getFullYear();
  const month = japanTime.getMonth() + 1;
  const day = japanTime.getDate();
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][japanTime.getDay()];
  
  return `${year}年${month}月${day}日（${weekday}）`;
}

// ニュースデータ（将来的にはAPI取得に置き換え）
const newsData = {
  '国内経済': [
    { title: '上場企業の2026年3月期純利益が過去最高を更新見込み、3.0%増', summary: '東証プライム上場企業の2026年3月期の連結純利益が前期比3.0%増の36兆円となり、4期連続で過去最高を更新する見通し。' },
    { title: '日銀、政策金利を0.5%に引き上げ、物価上昇に対応', summary: '日本銀行は金融政策決定会合で、政策金利を0.25%から0.5%へ引き上げることを決定した。' },
    { title: '円相場、1ドル=142円台で推移、利上げで円高進む', summary: '日銀の利上げを受けて外国為替市場で円高ドル安が進み、1ドル=142円台で推移している。' },
    { title: '日本の消費者物価指数、前年同月比2.8%上昇', summary: '総務省が発表した1月の全国消費者物価指数は、前年同月比2.8%上昇した。' },
    { title: '日本のGDP成長率、2025年度は1.2%の見通し', summary: '内閣府は2025年度の実質GDP成長率を1.2%と予測している。' }
  ],
  '国内企業動向': [
    { title: 'ソニーグループ、2026年3月期の営業利益を1兆5000億円に上方修正', summary: 'ソニーグループは業績予想を上方修正し、営業利益を従来予想から1000億円増の1兆5000億円とした。' },
    { title: 'トヨタ自動車、2026年の世界生産台数1050万台を計画', summary: 'トヨタ自動車は2026年の世界生産台数を前年比5%増の1050万台とする計画を発表した。' },
    { title: 'ファーストリテイリング、海外売上高が国内を上回る', summary: 'ユニクロを展開するファーストリテイリングは、2025年8月期の海外売上高が初めて国内を上回った。' },
    { title: 'ソフトバンクグループ、AI投資を加速、年間5000億円規模', summary: 'ソフトバンクグループは人工知能(AI)関連への投資を加速し、年間5000億円規模の投資を計画している。' },
    { title: 'パナソニック、EV用バッテリー工場を国内に新設', summary: 'パナソニックは電気自動車(EV)用バッテリーの国内生産を強化するため、新工場を建設する。' }
  ],
  '世界情勢': [
    { title: 'EU、2030年までにCO2排出量55%削減を法制化', summary: '欧州連合(EU)は気候変動対策として、2030年までに温室効果ガス排出量を1990年比で55%削減する法律を制定した。' },
    { title: 'インド経済、2025年の成長率6.8%でアジア最高水準', summary: 'インドの2025年の実質GDP成長率は6.8%となり、アジアで最も高い経済成長を記録した。' },
    { title: '米中貿易協議、半導体分野で部分合意', summary: 'アメリカと中国は貿易協議で半導体分野における輸出規制の一部緩和で合意した。' },
    { title: '国連、気候変動対策に年間3兆ドルの投資が必要と試算', summary: '国連は気候変動対策のため、2030年までに年間3兆ドルの投資が必要との報告書を発表した。' },
    { title: '世界の再生可能エネルギー投資、2025年は過去最高の5000億ドル', summary: '国際エネルギー機関(IEA)によると、2025年の世界の再生可能エネルギーへの投資額は過去最高の5000億ドルに達した。' }
  ],
  'オフィス業界': [
    { title: '東京都心のオフィス空室率、5.2%に改善', summary: '三鬼商事が発表した1月の東京都心5区のオフィス空室率は5.2%となり、前月から0.3ポイント改善した。' },
    { title: 'リモートワーク継続企業、全体の65%に達する', summary: '民間調査によると、コロナ禍後もリモートワークを継続している企業は全体の65%に達している。' },
    { title: 'オフィス家具大手、ハイブリッドワーク対応製品を拡充', summary: 'オフィス家具大手各社は、オフィスと自宅の両方で使えるハイブリッドワーク対応製品の展開を強化している。' },
    { title: '企業のオフィス縮小、2025年は前年比20%増', summary: '不動産調査会社によると、2025年にオフィススペースを縮小した企業は前年比20%増加した。' },
    { title: 'コワーキングスペース利用、大企業でも拡大', summary: '大企業によるコワーキングスペースの利用が拡大しており、サテライトオフィスとして活用する事例が増えている。' }
  ],
  'AI最新トピックス': [
    { title: 'OpenAI、GPT-5を2026年夏にリリース予定と発表', summary: 'OpenAIは次世代大規模言語モデル「GPT-5」を2026年夏にリリースする予定であることを明らかにした。' },
    { title: 'Google、医療診断AIが専門医レベルの精度を達成', summary: 'Googleが開発した医療診断AIシステムが、複数の疾患において専門医と同等の診断精度を達成したと発表した。' },
    { title: 'AI生成コンテンツ、世界のクリエイティブ市場の30%を占める', summary: '調査会社によると、2025年のクリエイティブコンテンツ市場において、AI生成コンテンツが全体の30%を占めた。' },
    { title: '日本政府、AI規制法案を国会に提出', summary: '日本政府は人工知能の開発と利用に関する規制を盛り込んだ法案を通常国会に提出した。' },
    { title: 'AI半導体市場、2026年は1500億ドル規模に成長予測', summary: '市場調査会社は、AI向け半導体市場が2026年に前年比35%増の1500億ドル規模に成長すると予測している。' }
  ]
};

// HTML生成
function generateHTML() {
  const dateString = getJapaneseDate();
  
  let newsHTML = '';
  
  for (const [category, articles] of Object.entries(newsData)) {
    newsHTML += `
        <section class="category">
          <h2>${category}</h2>
          <div class="news-list">`;
    
    articles.forEach(article => {
      newsHTML += `
            <article class="news-item">
              <h3>${article.title}</h3>
              <p>${article.summary}</p>
              <button class="detail-btn" data-title="${article.title}" data-summary="${article.summary}" data-category="${category}">
                📖 もっと詳しく教えて
              </button>
            </article>`;
    });
    
    newsHTML += `
          </div>
        </section>`;
  }
  
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 朝のニュースダイジェスト</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>📰 朝のニュースダイジェスト</h1>
        <p class="date">${dateString} 午前7時配信</p>
    </header>

    <main>
${newsHTML}
    </main>

    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <div id="article-content">
                <p class="loading">記事を生成中...</p>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>`;
  
  return html;
}

// メイン処理
try {
  const html = generateHTML();
  const outputPath = path.join(__dirname, '../public/index.html');
  
  fs.writeFileSync(outputPath, html, 'utf8');
  
  console.log('✅ ニュース更新完了');
  console.log(`📅 日付: ${getJapaneseDate()}`);
  console.log(`📝 ファイル: ${outputPath}`);
  console.log(`📰 ニュース件数: ${Object.values(newsData).flat().length}件`);
} catch (error) {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
}
