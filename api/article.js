const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数からAPIキーを取得
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    // リクエストボディからニュース情報を取得
    const { title, summary, category } = req.body;

  console.log('記事生成開始:', title);

    // プロンプト作成
    const prompt = `
あなたは経済ニュースの専門解説者です。以下のニュースについて、ビジネスパーソン向けに分かりやすく深掘り記事を作成してください。

【ニュース情報】
カテゴリー: ${category}
タイトル: ${title}
概要: ${summary}

【記事構成】
以下のJSON形式で出力してください：

{
  "title": "記事のタイトル",
  "lead": "リード文（100-150字）",
  "sections": [
    {
      "heading": "セクション見出し",
      "content": "本文（300-500字）"
    }
  ],
  "terms": [
    {
      "term": "専門用語",
      "explanation": "分かりやすい解説"
    }
  ]
}

【要件】
- 全体で1,500〜2,000字程度
- 客観的で中立的なトーン
- 専門用語は平易に解説
- 数字やデータは具体的に
- セクションは3〜5個
- 用語解説は2〜4個

JSON形式のみを出力し、他のテキストは含めないでください。
`;

    // REST APIで直接呼び出し（SDKを使わない）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    console.log('Gemini APIレスポンス:', text.substring(0, 200));

    // JSONをパース
    let articleData;
    try {
      // ```json と ``` を削除
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      articleData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON パースエラー:', parseError);
      console.error('レスポンステキスト:', text);
      throw new Error('記事データのパースに失敗しました');
    }

    // HTMLに変換
    const html = generateHTML(articleData, { title, summary, category });

    console.log('記事生成完了');

    return res.status(200).json({
      success: true,
      html: html,
      articleData: articleData
    });

  } catch (error) {
    console.error('記事生成エラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// HTMLを生成する関数
function generateHTML(articleData, newsItem) {
  const categoryColors = {
    '国内経済': { bg: '#fff5f5', text: '#c53030', border: '#feb2b2' },
    '国内企業動向': { bg: '#f0fff4', text: '#2f855a', border: '#9ae6b4' },
    '世界情勢': { bg: '#ebf8ff', text: '#2c5282', border: '#90cdf4' },
    'オフィス業界': { bg: '#fffaf0', text: '#c05621', border: '#fbd38d' },
    'AI最新トピックス': { bg: '#faf5ff', text: '#6b46c1', border: '#d6bcfa' }
  };

  const colors = categoryColors[newsItem.category] || { bg: '#f7fafc', text: '#2d3748', border: '#cbd5e0' };

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${articleData.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
      line-height: 1.8;
      color: #333;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: ${colors.bg};
      border-left: 4px solid ${colors.text};
      padding: 24px;
    }
    .category {
      display: inline-block;
      background: ${colors.text};
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .lead {
      font-size: 18px;
      color: #4a5568;
      line-height: 1.8;
      padding: 24px;
      background: #f7fafc;
      border-left: 3px solid ${colors.text};
      margin: 0 24px 24px 24px;
    }
    .content {
      padding: 0 24px 24px 24px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.text};
    }
    .section p {
      font-size: 16px;
      line-height: 1.9;
      color: #4a5568;
      margin-bottom: 12px;
    }
    .terms {
      background: #f7fafc;
      border-radius: 8px;
      padding: 24px;
      margin: 32px 24px 24px 24px;
    }
    .terms h2 {
      font-size: 20px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }
    .terms h2::before {
      content: "📖";
      margin-right: 8px;
    }
    .term-item {
      background: white;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 12px;
      border-left: 3px solid ${colors.text};
    }
    .term-item:last-child {
      margin-bottom: 0;
    }
    .term-name {
      font-weight: 600;
      color: ${colors.text};
      font-size: 16px;
      margin-bottom: 8px;
    }
    .term-explanation {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.7;
    }
    .footer {
      background: #f7fafc;
      padding: 16px 24px;
      text-align: center;
      color: #718096;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="category">${newsItem.category}</div>
      <h1>${articleData.title}</h1>
    </div>
    
    <div class="lead">
      ${articleData.lead}
    </div>
    
    <div class="content">
      ${articleData.sections.map(section => `
        <div class="section">
          <h2>${section.heading}</h2>
          <p>${section.content.replace(/\n/g, '</p><p>')}</p>
        </div>
      `).join('')}
    </div>
    
    ${articleData.terms && articleData.terms.length > 0 ? `
      <div class="terms">
        <h2>用語解説</h2>
        ${articleData.terms.map(term => `
          <div class="term-item">
            <div class="term-name">${term.term}</div>
            <div class="term-explanation">${term.explanation}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="footer">
      Powered by Gemini API
    </div>
  </div>
</body>
</html>
`;
}
