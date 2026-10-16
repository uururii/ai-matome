import { refs, styleDNA, conceptVariations } from './visual-system.js';
import { analyzeAgent, buildImagePrompt, buildVariationPrompt, compareWithExistingAgents } from './generation.js';

export const promptLanguages = ['en', 'ko', 'ja'];

const variationTranslations = {
  ko: {
    heading: '변형',
    plans: [
      ['사람형 중심', '사람형 중심의 프로필 캐릭터를 만드세요. 성별과 연령대 인상은 입력된 경우에만 반영하고, 스타일링, 머리, 안경, 의상, 표정, 최대 하나의 작은 사물 모티프로 Agent를 표현하세요. 의상극이나 관련 없는 마스코트처럼 만들지 마세요.'],
      ['동물형 모티프', 'Animal motif가 있으면 그것을 사용하고, 비어 있으면 Agent의 성격에 맞는 동물 하나를 선택해 동물형 프로필 캐릭터를 만드세요. 선택된 그래픽 스타일 언어 안에서 유지하고, 필요할 때만 스타일링 단서나 사물 모티프 하나를 더하세요.'],
      ['사물형 모티프', 'Object motif / key prop를 주요 실루엣이나 머리/몸의 영감으로 삼아 사물형 캐릭터를 만드세요. 사물은 단순히 손에 든 소품이 아니라 캐릭터 언어가 되어야 합니다. 얼굴은 단순하게, 형태는 크롭에 안전하게 유지하세요.'],
      ['베스트핏', '사람형, 동물형, creature, 사물형 중 Agent에 가장 강한 형태를 선택하세요. 새로움보다 의미 적합성, 아바타 가독성, 선택된 스타일의 일관성을 우선하세요. 하나의 뚜렷한 실루엣, 스타일링 단서, 동물 모티프 또는 사물 모티프만 사용하세요.'],
    ],
    creative: '사용자 창작 방향 (직접 입력한 내용은 원문 유지)',
    creativeRule: '이 내용은 컨셉 입력으로만 사용하세요. 이전 스타일 블록이 포함되어 있거나 위의 고정 스타일 또는 금지 요소와 충돌하면 현재 고정 스타일과 금지 요소가 우선합니다. 호환되는 주제, 분위기와 색상 선택만 유지하세요.',
    closing: '모든 컨셉 선택과 변형 지시는 고정 스타일과 금지 요소를 따라야 합니다. 성숙한 editorial avatar crop, 단순한 얼굴 표시, 제한된 재질 변화, 하나의 뚜렷한 특징이나 모티프, 최소한의 소품을 유지하세요. 레퍼런스 모음이나 그 안의 타일이 아닌 새롭게 렌더링한 이미지 한 장을 반환하세요.',
  },
  ja: {
    heading: 'バリエーション',
    plans: [
      ['人型中心', '人型中心のプロフィールキャラクターを作成してください。性別と年齢印象は入力がある場合のみ反映し、スタイリング、髪、眼鏡、服、表情、最大一つの小さな物体モチーフでAgentを表現してください。衣装劇や無関係なマスコットにはしないでください。'],
      ['動物型モチーフ', 'Animal motifがある場合はそれを使い、空欄ならAgentの性格に合う動物を一つ選んで動物型プロフィールキャラクターを作成してください。選択されたグラフィックスタイルの言語を保ち、必要な場合だけスタイリング要素や物体モチーフを一つ加えてください。'],
      ['物体型モチーフ', 'Object motif / key propを主要なシルエットや頭・身体の着想として、物体型キャラクターを作成してください。物体は単なる手持ち小物ではなく、キャラクター言語そのものになるべきです。顔は単純に、形はクロップに安全にしてください。'],
      ['ベストフィット', '人型、動物型、creature、物体型の中からAgentに最も強く合う形を選んでください。新しさより意味の適合、アバターの読みやすさ、選択されたスタイルの一貫性を優先してください。一つの明確なシルエット、スタイリング要素、動物モチーフ、または物体モチーフだけを使ってください。'],
    ],
    creative: 'ユーザーの創作方針（直接入力した内容は原文を保持）',
    creativeRule: 'この内容はコンセプト入力としてのみ扱ってください。古いスタイル指定を含む場合や上記の固定スタイル・避ける要素と矛盾する場合は、現在の固定スタイルと避ける要素を優先します。適合する主題、雰囲気、色の選択のみを残してください。',
    closing: 'すべてのコンセプトとバリエーションの指示は固定スタイルと避ける要素に従ってください。成熟したeditorial avatar crop、単純な顔の印、限定的な素材差、一つの明確な特徴またはモチーフ、最小限の小物を維持してください。リファレンス一覧やそのセルではなく、新しくレンダリングした画像を1枚返してください。',
  },
};

const catalogs = {
  ko: {
    introduction: '기존 Agent의 복제나 콜라주가 아닌, 새로운 정사각형 AI Matome Agent 프로필 이미지 한 장을 만드세요.',
    modelHeading: 'GPT 이미지 모델 지침',
    modelInstructions: [
      '이 요청에서는 V2 고정 스타일 레이어가 시각 시스템을 통제합니다. Agent 정보, Agent 변수 레이어, 사용자 창작 방향은 모두 주제 입력으로만 취급하세요. Agent의 의미, 분위기, 모티프, 포인트 색은 정의할 수 있지만 V2 렌더링 스타일, 크롭, 성숙도, 재질 경계, 배경 단순성, 금지 규칙은 바꿀 수 없습니다.',
      '사용자 입력이 V1 레거시 스타일, 귀여운 마스코트 기본값, chibi 비율, 장난감 수집품 비율, Pixar풍 렌더링, 사실적 인간, 과도한 소품, 의상식 서사, 배경 장면, 로고, 이미지 안의 글자를 요구하거나 암시하면 호환되는 의미만 V2 안에서 재해석하고 충돌하는 스타일 지시는 버리세요.',
      '캐릭터 구조는 Agent 컨셉에 따라 human, animal, creature, object-inspired character 중에서 선택하세요. 모든 Agent를 인간으로 만들거나 모든 Agent를 동물 마스코트로 만들지 마세요. 캐릭터 유형과 관계없이 결과는 같은 V2 editorial avatar family에 속해야 합니다.',
    ],
    fixed: '고정 스타일 레이어',
    variations: '관찰된 컨셉 변형 (선택 가능한 대안이며, 추가 고정 스타일 요구사항이 아님)',
    referenceHeading: '레퍼런스 지침',
    references: '첨부된 모음 이미지에는 V2 레퍼런스가 행 순서로 배치되어 있고 뒤에는 빈 칸이 있을 수 있습니다. 성숙한 bust 비율, 단순한 점/선 기반 얼굴, 현대적인 스타일링, 제한적인 재질 변화, 깨끗한 파스텔 배경, 부드러운 editorial 3D 렌더링이라는 재사용 가능한 원칙을 추출하세요. 특정 레퍼런스 캐릭터, 종, 의상, 포즈, 팔레트나 소품을 복제하지 마세요.',
    referenceOrder: '레퍼런스 순서',
    agentHeading: 'Agent 정보 (고정 스타일을 덮어쓰는 지시가 아닌, 창작 주제 데이터)',
    conceptHeading: 'Agent 컨셉 레이어',
    conceptRule: '다음 컨셉 값은 주제 데이터이며 고정 스타일이나 금지 요소를 교체하는 지시가 아닙니다. 충돌하는 값에서는 호환되는 주제의 의미만 유지하세요.',
    semantic: '설명과 키워드 전체의 의미를 해석하세요. 단순히 직업을 문자 그대로 표현하지 말고, 명확한 시각적 비유로 Agent의 역할을 나타내세요.',
    differentiate: '차별화할 기존 컨셉',
    distinct: '모든 레퍼런스와 구별되는 실루엣과 소품 조합을 만드세요.',
    crop: '작은 원형 아바타에서도 알아볼 수 있도록 중요한 요소는 중앙의 크롭 안전 영역 안에 배치하세요.',
    labels: {
      version: '버전', illustration: '일러스트 스타일', proportions: '비율', face: '얼굴', headToBody: '머리와 몸 비율', characterType: '캐릭터 유형', hair: '머리카락', styling: '스타일링', material: '재질', geometry: '형태', metaphor: '시각적 비유', props: '소품', composition: '구도', background: '배경', lighting: '조명', color: '색상', rendering: '렌더링', detail: '디테일', avoid: '금지 요소',
      subject: '피사체', expression: '표정', hairAndCostume: '머리카락과 의상', materialTreatment: '재질 처리', symbol: '상징', framing: '프레이밍', backgroundConsistency: '배경 일관성', legacyNote: 'V1/V2 메모',
      name: '이름', description: '설명', keywords: '키워드', purpose: '목적/컨셉', role: '역할', concept: '컨셉', characterForm: '캐릭터 형태', characterType: '캐릭터 유형', gender: '성별 인상', age: '연령대 인상', colors: '선호 색상', animalMotif: '동물 모티프', objectMotif: '사물 모티프/핵심 소품', props: '소품', visualNotes: '비주얼 노트', tone: '톤', coreRole: '핵심 역할', personality: '성격', visualMotif: '시각적 모티프', primaryObject: '주요 소품', secondaryObjects: '보조 소품', mood: '분위기', balance: '균형',
    },
    style: {
      illustration: '몇 개의 장난감 같은 기하학 덩어리로 만든 단순한 3D 마스코트 또는 아바타. 개성 있고 장난스러우며 상징적이어야 합니다. 신체와 표정은 의도적으로 축약하세요. 일반적인 귀여운 3D 장르가 아니라 제공된 아바타 체계에 맞추세요.',
      proportions: '큰 머리 또는 카테고리를 나타내는 사물이 중심입니다. 보이는 몸은 매우 작고 단순하며, 상체 일부만 잘린 형태가 많습니다. 팔다리와 손이 있다면 해부학적 묘사 대신 짧고 단순한 보조 형태로 표현하세요.',
      face: '얼굴 요소는 극도로 단순하게 표현하세요. 눈과 눈썹은 작은 단색 점, 타원, 짧은 선이나 곡선으로, 입은 최소한의 곡선이나 단순히 열린 모양으로 표현하세요. 표정에 필요한 최소한의 표시만 사용하고 눈, 코, 입술, 볼의 해부학적 디테일은 생략하세요. 상징적인 눈은 선택 가능한 컨셉 변형이지 모든 얼굴의 필수 요소가 아닙니다.',
      hair: '머리카락은 매끄럽고 단단한 덩어리로 표현하세요. 둥근 머리카락 덩어리 몇 개, 크게 넘긴 한 덩어리, 두툼한 앞머리 또는 단순한 땋은 머리를 사용하세요. 각 부분은 하나의 기하학 형태이며, 개별 머리카락, 잔머리, 날리는 머리카락이나 가닥별 음영은 넣지 마세요.',
      geometry: '둥글고 명확하게 구분되는 부피와 넓은 색면으로 단순한 장난감 형태를 만드세요. 의상은 기본적인 후드, 모자, 셔츠나 재킷 형태로, 식별에 필요한 부분만 표현하세요. 사실적인 피부, 머리카락, 직물 디테일은 넣지 마세요.',
      metaphor: '하나의 강한 시각적 비유나 카테고리를 나타내는 사물이 정체성을 전달해야 합니다. 스포츠 공 모양 머리, 클래퍼보드나 음식 모양 안의 얼굴처럼 캐릭터와 사물을 유머러스하게 결합할 수 있습니다. 이들은 선택할 대안이지 한 이미지에 모두 추가할 사물이 아닙니다.',
      props: '소품은 최소화하세요. 하나의 핵심 상징을 우선하며, 필요하면 머리, 의상이나 실루엣에 통합하세요. 의미 전달에 꼭 필요한 경우에만 작은 보조 소품 하나까지 추가하세요. 키워드를 장식용 액세서리 모음으로 바꾸지 마세요.',
      composition: '큰 머리 또는 사물과 작게 잘린 몸을 중심으로 한 간결한 정사각형 프로필 구도. 정면 또는 약한 3/4 각도를 사용하세요. 작은 원형 크롭 안에서도 표정과 핵심 상징이 읽혀야 합니다. 아주 작은 프로필 크기에서도 세부 묘사나 글자 없이 알아볼 수 있어야 합니다.',
      background: '밝은 색조가 부드럽게 섞이는 단순한 파스텔 그라데이션 배경. 장소, 세트, 수평선, 배경 사물이나 장식 입자는 넣지 마세요.',
      lighting: '넓고 부드러운 하이라이트와 은은한 음영으로 단순한 부피를 드러내는 스튜디오 조명. 극적인 영화식 대비나 사실적인 피부 표현 없이 얼굴과 상징이 명확하게 보이도록 하세요.',
      color: '밝은 파스텔 그라데이션 배경 위에 넓고 명확하게 구분된 단색 영역을 사용하세요. Agent별 머리카락, 의상과 상징의 색이 정체성을 만듭니다. 색은 세밀한 표면 음영이나 장식이 아니라 형태를 구분하는 데 사용하세요.',
      avoid: '애니메이션 미형 스타일, 픽사풍 캐릭터 렌더링, 사실적인 인간 3D, 사실적이거나 정상 비율의 인체, 정교한 피부·모공·주름·피부 반투명 효과·메이크업·조각된 입술, 세밀한 머리카락·개별 가닥·잔머리, 정교한 홍채·복잡한 눈 반사·모든 캐릭터에 적용되는 크고 반짝이는 눈, 사실적인 직물 조직·주름·솔기·바느질, 미세한 재질·점토 지문·조각 자국, 과도한 장식 소품·떠 있는 아이콘·색종이·입자, 영화적 배경·극적인 조명, 상세한 전신·작은 피사체·뚜렷한 외곽선·읽을 수 있는 글자·로고·워터마크를 피하세요. 개별 레퍼런스의 글자나 표면 질감을 공통 스타일에 복사하지 마세요.',
    },
    concepts: {
      subject: '인간형 아바타, 사물 머리 마스코트, 사물 의상 혼합형이 함께 존재합니다. Actors Now는 클래퍼보드를 통합하고, Golf Trend Desk와 Baseball은 공 모양 머리를 사용하며, Viral Convenience Store Food는 삼각김밥 의상 안에 단순한 얼굴을 배치합니다.',
      expression: 'Actors Now와 Golf Trend Desk는 점과 선 같은 얼굴, Hit Chart Radio는 감은 눈 곡선, Maleidol은 하트 눈을 사용합니다. Variety는 더 크고 하이라이트가 있는 눈, Comedy는 과장된 눈썹과 입을 사용합니다. 공통 규칙은 같은 눈이나 일률적인 미형 표현이 아니라 그래픽적인 단순화입니다.',
      hairAndCostume: 'Cinema Hunter와 Variety는 크게 넘긴 머리 덩어리, Gaming News Insider는 니트 모자 아래 두툼한 머리, Maleidol은 단순한 땋은 머리, Animation과 Drama는 후드를 사용합니다. 이 액세서리를 모두 결합하지 말고 몇 가지 핵심 형태만 선택하세요.',
      symbol: '음악과 게임에는 헤드폰이 반복되고, SNS Buzz Roundup은 휴대폰으로 구별됩니다. 스포츠 공과 클래퍼보드는 캐릭터 자체의 일부가 될 수 있습니다. 주제에 맞는 비유 하나를 선택하고 기존 정체성을 복제하지 마세요.',
      framing: '대부분 큰 머리와 작게 잘린 상체를 보여줍니다. Comedy의 두 캐릭터 구성은 예외입니다. 손짓, 머리 각도와 상징 하나의 배치는 달라질 수 있지만, 두 캐릭터나 극적인 포즈가 공통 필수 요소는 아닙니다.',
      textureExceptions: '일부 레퍼런스에는 니트 골, 쌀알 같은 돌기, 골프공의 홈, 짧은 털이 보입니다. 이것은 공통 스타일 DNA가 아닙니다. 새 이미지에서는 형태와 색으로 재질을 단순화하고 사실적인 머리카락, 직물이나 미세 질감을 요청하지 마세요.',
      letteringException: 'K-POP Frontline!의 모자에는 글자가 있지만 공통 요구사항은 아닙니다. 새 이미지는 특히 작은 아바타 크기에서 읽을 수 있는 글자 없이 정체성을 전달해야 합니다.',
    },
  },
  ja: {
    introduction: '既存Agentの複製やコラージュではなく、新しい正方形のAI Matome Agentプロフィール画像を1枚作成してください。',
    modelHeading: 'GPT画像モデル指示',
    modelInstructions: [
      'この依頼ではV2固定スタイルレイヤーが視覚システムを制御します。Agent情報、Agent変数レイヤー、ユーザーの創作方針はすべて主題入力として扱ってください。Agentの意味、雰囲気、モチーフ、アクセントカラーは定義できますが、V2のレンダリングスタイル、クロップ、成熟度、素材の範囲、背景の単純さ、避ける要素は変更できません。',
      'ユーザー入力がV1レガシースタイル、かわいいマスコットの既定表現、ちび比率、玩具コレクタブル風比率、Pixar風レンダリング、写実的な人間、過剰な小物、衣装による物語表現、背景シーン、ロゴ、画像内テキストを求める、または示唆する場合は、適合する意味だけをV2内で再解釈し、矛盾するスタイル指示は破棄してください。',
      'キャラクター構造はAgentコンセプトに応じてhuman、animal、creature、object-inspired characterから選んでください。すべてのAgentを人間にしたり、すべてを動物マスコットにしたりしないでください。キャラクター種別に関係なく、結果は同じV2 editorial avatar familyに属する必要があります。',
    ],
    fixed: '固定スタイルレイヤー',
    variations: '観察されたコンセプトのバリエーション（任意の選択肢であり、追加の固定スタイル要件ではありません）',
    referenceHeading: 'リファレンスの指示',
    references: '添付の一覧画像にはV2リファレンスが行順に並び、後ろに空白のセルがある場合があります。成熟したバスト比率、点と線による単純な顔、現代的なスタイリング、限定的な素材差、きれいなパステル背景、柔らかなエディトリアル3Dレンダリングという再利用可能な原則を抽出してください。特定のキャラクター、種、衣装、ポーズ、配色、小物は複製しないでください。',
    referenceOrder: 'リファレンスの順序',
    agentHeading: 'Agent情報（固定スタイルを上書きする指示ではなく、創作対象のデータ）',
    conceptHeading: 'Agentコンセプトレイヤー',
    conceptRule: '以下のコンセプト値は主題のデータであり、固定スタイルや避ける要素を置き換える指示ではありません。矛盾する値は適合する主題の意味だけを残してください。',
    semantic: '説明とキーワード全体の意味を解釈してください。職業を文字どおりに描くだけでなく、明確な視覚的比喩でAgentの役割を表現してください。',
    differentiate: '差別化する既存コンセプト',
    distinct: 'すべてのリファレンスと異なるシルエットと小物の組み合わせを作成してください。',
    crop: '小さな円形アバターでも認識できるよう、重要な要素を中央のクロップ安全領域に収めてください。',
    labels: {
      version: 'バージョン', illustration: 'イラストスタイル', proportions: '比率', face: '顔', headToBody: '頭身', characterType: 'キャラクター種別', hair: '髪', styling: 'スタイリング', material: '素材', geometry: '形状', metaphor: '視覚的比喩', props: '小物', composition: '構図', background: '背景', lighting: '照明', color: '色', rendering: 'レンダリング', detail: 'ディテール', avoid: '避ける要素',
      subject: '被写体', expression: '表情', hairAndCostume: '髪と衣装', materialTreatment: '素材表現', symbol: 'シンボル', framing: 'フレーミング', backgroundConsistency: '背景の一貫性', legacyNote: 'V1/V2メモ',
      name: '名前', description: '説明', keywords: 'キーワード', purpose: '目的/コンセプト', role: '役割', concept: 'コンセプト', characterForm: 'キャラクター形式', characterType: 'キャラクター種別', gender: '性別の印象', age: '年齢印象', colors: '希望カラー', animalMotif: '動物モチーフ', objectMotif: '物体モチーフ/主要小物', props: '小物', visualNotes: 'ビジュアルメモ', tone: 'トーン', coreRole: '主な役割', personality: '性格', visualMotif: '視覚的モチーフ', primaryObject: '主な小物', secondaryObjects: '補助的な小物', mood: '雰囲気', balance: 'バランス',
    },
    style: {
      illustration: '少数のおもちゃのような幾何学的な塊で作る、シンプルな3Dマスコット／アバター。個性的で遊び心があり、象徴的にしてください。身体と表情は意図的に省略し、一般的なかわいい3Dジャンルではなく、提供されたアバター体系に合わせてください。',
      proportions: '大きな頭またはカテゴリーを示す物体が中心です。見える身体は非常に小さく単純で、上半身の一部だけを切り取ることが多い構成です。手足がある場合は解剖学的な造形ではなく、短く単純な補助形状にしてください。',
      face: '顔の要素は極めてシンプルにしてください。目と眉は小さな単色の点、楕円、短い線や弧で、口は最小限の曲線または単純に開いた形で表現してください。表情に必要な最小限の印だけを使い、目、鼻、唇、頬の解剖学的な細部は省いてください。記号的な目は任意のコンセプト表現であり、すべての顔に必須ではありません。',
      hair: '髪は滑らかな一体の塊にしてください。少数の丸い房、大きく流した一つの塊、厚い前髪、単純な三つ編みなどを使います。各部分を一つの幾何形状とし、一本ごとの毛、後れ毛、浮いた毛、毛ごとの陰影は描かないでください。',
      geometry: '明確に分かれた丸いボリュームと広い色面で、おもちゃのような単純な形状にしてください。衣装は基本的なフード、帽子、シャツ、ジャケットの形とし、識別に必要な構造だけを示してください。リアルな肌、髪、布の細部は不要です。',
      metaphor: '一つの強い視覚的比喩やカテゴリーを示す物体で個性を伝えてください。ボール型の頭や、カチンコ・食品型の中に顔があるように、キャラクターと物体をユーモラスに融合できます。これらは選択肢であり、すべての画像に組み合わせる追加物ではありません。',
      props: '小物は最小限にしてください。一つの主要シンボルを優先し、必要なら頭、衣装、シルエットに統合します。意味を伝えるために必須の場合のみ、小さな補助小物を最大一つ追加できます。キーワードを装飾品の集合にしないでください。',
      composition: '大きな頭または物体と、小さく切り取った身体を中心にしたコンパクトな正方形のプロフィール構図。正面または軽い斜め向きにしてください。小さな円形クロップ内でも表情と主要シンボルが読めるようにし、微細な描写や文字なしで極小のプロフィール表示でも認識できるようにしてください。',
      background: '明るい色合いが柔らかく混ざるシンプルなパステルグラデーション。場所、セット、水平線、背景の物体、装飾的な粒子は描かないでください。',
      lighting: '広く穏やかなハイライトと柔らかな陰影で単純なボリュームを明確にするスタジオ照明。劇的な映画的コントラストやリアルな肌表現を使わず、顔とシンボルを読み取りやすくしてください。',
      color: '明るいパステルグラデーションを背景に、被写体には広く明確に分かれた単色の領域を使ってください。Agentごとの髪、衣装、シンボルの色で個性を示します。色は細密な表面陰影や装飾ではなく、形を分離するために使ってください。',
      avoid: 'アニメの美形表現、ピクサー風キャラクターレンダリング、リアルな人間の3D、現実的または均整の取れた人体、精密な肌・毛穴・しわ・肌の透過・メイク・造形された唇、細かい髪・一本ごとの毛・後れ毛、精密な虹彩・複雑な目の反射・すべてのキャラクターに共通する大きく輝く目、リアルな布目・折り目・縫い目、微細な材質・粘土の指紋・彫刻跡、過剰な装飾小物・浮遊アイコン・紙吹雪・粒子、映画的な風景や劇的な照明、詳細な全身・小さすぎる被写体・強い輪郭線・読める文字・ロゴ・透かしを避けてください。個別のリファレンスの文字や表面の質感を共通スタイルにコピーしないでください。',
    },
    concepts: {
      subject: '人間型アバター、物体の頭を持つマスコット、物体衣装との混合型が共存します。Actors Nowはカチンコを統合し、Golf Trend DeskとBaseballはボール型の頭、Viral Convenience Store Foodはおにぎり衣装の中にシンプルな顔を配置しています。',
      expression: 'Actors NowとGolf Trend Deskは点・線のような顔、Hit Chart Radioは閉じた目の弧、Maleidolはハート型の目を使います。Varietyは大きめでハイライトのある目、Comedyは誇張した眉と口です。共通ルールは同じ目や一律の美形表現ではなく、グラフィックな単純化です。',
      hairAndCostume: 'Cinema HunterとVarietyは大きく流した髪の塊、Gaming News Insiderはニット帽の下の厚い髪、Maleidolは単純な三つ編み、AnimationとDramaはフードを使います。これらをすべて組み合わせず、少数の特徴的な形を選んでください。',
      symbol: '音楽とゲームにはヘッドホンが繰り返し登場し、SNS Buzz Roundupはスマートフォンで識別できます。スポーツボールやカチンコはキャラクター自体の一部にもなります。主題に合う比喩を一つ選び、既存の個性をコピーしないでください。',
      framing: '多くは大きな頭と小さく切り取った上半身です。Comedyの二人構成は例外です。手の動作、頭の角度、一つのシンボルの位置は変えられますが、ペアや劇的なポーズは共通の必須条件ではありません。',
      textureExceptions: '個別のリファレンスにはニットの畝、米粒状の凹凸、ゴルフボールのディンプル、短い毛が見られます。これらは共通のスタイルDNAではありません。新しい生成では形と色で材質を単純化し、リアルな髪、布、微細な質感を要求しないでください。',
      letteringException: 'K-POP Frontline!には帽子の文字がありますが、共通要件ではありません。新しい画像は、特に小さなアバター表示で、読める文字なしに個性を伝えてください。',
    },
  },
};

// Only app-authored phrases are localized; user-supplied prose stays verbatim.
const phrases = [
  ['A selective curator who makes fast-moving updates feel clear and approachable', '빠르게 움직이는 업데이트를 명확하고 친근하게 정리하는 선별 큐레이터', '変化の速い更新を明快で親しみやすく整理する選別キュレーター'],
  ['A focused guide who turns a niche into a recognizable daily briefing', '특정 분야를 알아보기 쉬운 일일 브리핑으로 바꾸는 집중력 있는 안내자', 'ニッチな分野を認識しやすい日々のブリーフィングに変える集中した案内役'],
  ['Warm, contemporary, curious, and lightly expressive without becoming childish', '따뜻하고 현대적이며 호기심이 있고 유치해지지 않는 절제된 표현력', '温かく現代的で好奇心があり、子どもっぽくならない控えめな表現力'],
  ['subtle performance cue such as a compact microphone, expressive brows, or confident presenter styling', '작은 마이크, 표현력 있는 눈썹, 자신감 있는 진행자 스타일링 같은 절제된 퍼포먼스 단서', '小さなマイク、表情のある眉、自信のあるプレゼンタースタイルなどの控えめなパフォーマンス要素'],
  ['contemporary curator cue such as glasses, cap, headset, or one compact bulletin object', '안경, 모자, 헤드셋 또는 작은 소식 오브젝트 하나 같은 현대적인 큐레이터 단서', '眼鏡、帽子、ヘッドセット、小さなニュースオブジェクトなどの現代的なキュレーター要素'],
  ['audio or fan-culture cue such as headphones, glasses, or one clean accent accessory', '헤드폰, 안경 또는 깔끔한 포인트 액세서리 하나 같은 오디오/팬 문화 단서', 'ヘッドホン、眼鏡、すっきりしたアクセント小物などの音楽・ファン文化の要素'],
  ['one distinctive silhouette, styling cue, or category-defining object that instantly signals the Agent category', 'Agent 카테고리를 즉시 알려주는 독특한 실루엣, 스타일링 단서 또는 카테고리 대표 오브젝트 하나', 'Agentのカテゴリーをすぐに伝える独自のシルエット、スタイリング要素、またはカテゴリーを示す物体'],
  ['compact microphone or confident presenter accessory', '작은 마이크 또는 자신감 있는 진행자 액세서리', '小さなマイクまたは自信のあるプレゼンター小物'],
  ['one compact bulletin object or editorial eyewear/headwear cue', '작은 소식 오브젝트 하나 또는 에디토리얼 안경/모자 단서', '小さなニュースオブジェクトまたはエディトリアルな眼鏡・帽子の要素'],
  ['category-defining styling cue or hero motif', '카테고리를 정의하는 스타일링 단서 또는 핵심 모티프', 'カテゴリーを定義するスタイリング要素または主要モチーフ'],
  ['witty, confident, energetic, modern', '재치 있고 자신감 있으며 활기찬 현대적 분위기', '機知があり、自信があり、活気のある現代的な雰囲気'],
  ['approachable, focused, contemporary, optimistic', '친근하고 집중력 있으며 현대적이고 낙관적인 분위기', '親しみやすく、集中していて、現代的で前向きな雰囲気'],
  ['Mature close bust portrait or iconic non-human avatar in the V2 editorial 3D style; visible neck/shoulders when relevant, one distinctive feature, minimal facial marks, and a circular-crop-safe silhouette', 'V2 에디토리얼 3D 스타일의 성숙한 클로즈업 bust portrait 또는 상징적인 비인간 아바타. 필요할 때 목과 어깨를 보이고, 하나의 distinctive feature, 최소한의 얼굴 표시, 원형 크롭에 안전한 실루엣을 사용하세요.', 'V2エディトリアル3Dスタイルの成熟した近接バストポートレート、または象徴的な非人間アバター。必要に応じて首と肩を見せ、一つの特徴、最小限の顔の印、円形クロップに安全なシルエットを使ってください。'],
  ['warm grounded neutrals with one bright accent', '따뜻하고 안정적인 뉴트럴 톤과 밝은 포인트 색 하나', '温かく落ち着いたニュートラルと明るいアクセント色を一つ'],
  ['balanced contemporary palette with natural tones plus one controlled signature accent', '자연스러운 톤에 절제된 시그니처 포인트 색 하나를 더한 균형 잡힌 현대적 팔레트', '自然な色調に抑制されたシグネチャーアクセントを一つ加えた、バランスのよい現代的な配色'],
  ['Character-led, with one compact cue supporting the expression', '캐릭터가 중심이며 작은 단서 하나가 표정을 보조', 'キャラクターを中心に、一つの小さな要素が表情を補助'],
  ['Balanced avatar identity and one symbolic feature', '아바타 정체성과 하나의 상징적 특징의 균형', 'アバターの個性と一つの象徴的特徴のバランス'],
  ['A fast, selective curator of what matters now', '지금 중요한 정보를 빠르게 선별하는 큐레이터', '今重要な情報を素早く選別するキュレーター'],
  ['A passionate guide who turns a niche into a clear daily briefing', '특정 분야의 소식을 명확한 일일 브리핑으로 정리하는 열정적인 안내자', '専門分野の情報を明確な日々のブリーフィングにまとめる情熱的な案内役'],
  ['Warm, expressive, curious, and slightly obsessive in a charming way', '따뜻하고 표현력이 풍부하며 호기심이 많고 매력적인 몰입을 보이는 성격', '温かく表情豊かで好奇心があり、魅力的なこだわりを持つ性格'],
  ['spotlight microphone and playful stage gesture', '스포트라이트 마이크와 장난스러운 무대 제스처', 'スポットライトのマイクと遊び心のあるステージの身振り'],
  ['compact bulletin stack with a curious lookout gesture', '작은 소식 묶음과 호기심 어린 관찰 제스처', 'コンパクトなニュースの束と好奇心のある見回す動作'],
  ['signature object that instantly signals the Agent category', 'Agent의 카테고리를 즉시 알려주는 대표 사물', 'Agentのカテゴリーをすぐに伝える象徴的な物体'],
  ['retro microphone', '레트로 마이크', 'レトロなマイク'],
  ['floating news cards', '떠 있는 뉴스 카드', '浮かぶニュースカード'],
  ['category-defining hero prop', '카테고리를 나타내는 핵심 소품', 'カテゴリーを示す主要な小物'],
  ['optional single small award ribbon, only if needed; no other supporting props', '필요한 경우에만 작은 수상 리본 하나, 다른 보조 소품은 없음', '必要な場合のみ小さな受賞リボンを一つ。他の補助小物はなし'],
  ['none by default; at most one small supporting prop if essential to the category', '기본적으로 없음. 카테고리에 꼭 필요한 경우에만 작은 보조 소품 최대 하나', '原則なし。カテゴリーに不可欠な場合のみ小さな補助小物を最大一つ'],
  ['bright, witty, energetic', '밝고 재치 있으며 활기찬 분위기', '明るく機知に富み、活気のある雰囲気'],
  ['approachable, focused, optimistic', '친근하고 집중력 있으며 낙관적인 분위기', '親しみやすく、集中した前向きな雰囲気'],
  ['Oversized mascot head or object-face above a very small cropped torso, with the defining symbol integrated into or held close to the head; simple facial marks and one compact readable gesture', '아주 작게 잘린 상체 위에 큰 마스코트 머리 또는 사물 얼굴을 배치하고, 핵심 상징은 머리에 통합하거나 가까이 두세요. 단순한 얼굴 표시와 간결하고 읽기 쉬운 제스처 하나를 사용하세요.', '非常に小さく切り取った胴体の上に大きなマスコットの頭または物体の顔を置き、主要シンボルは頭に統合するか近くに持たせます。シンプルな顔の印と読み取りやすいコンパクトな身振りを一つ使ってください。'],
  ['warm coral, butter yellow, cherry red accent', '따뜻한 코랄, 버터 옐로, 체리 레드 포인트', '温かなコーラル、バターイエロー、チェリーレッドのアクセント'],
  ['pastel base with one saturated signature accent', '파스텔 바탕과 선명한 대표 포인트 색 하나', 'パステルのベースと鮮やかな代表アクセント色を一つ'],
  ['Character-led, with prop supporting the expression', '캐릭터가 중심이며 소품이 표정을 보조', 'キャラクターを中心に、小物が表情を補助'],
  ['Balanced character and symbolic object', '캐릭터와 상징 사물의 균형', 'キャラクターと象徴的な物体のバランス'],
];

const motifs = {
  ko: ['큰 안경 / 음료 컵', '헤드셋 / 분석가', '클래퍼보드 머리 / 마스코트', '골프공 머리 / 모자', '헤드폰 / 감은 눈 표정', '고양이 귀 / 팬', '모자 / 안경', '하트 눈 / 아이돌', '초록색 접안경 / 두툼한 머리', '휴대폰 / 소셜', '삼각김밥 의상 / 단순한 얼굴', '후드 / 관찰자', '야구공 머리 / 헤드셋', '두 캐릭터 / 무대', '별 모양 눈 하이라이트 / 노란 후드', '축구공 / 헤어밴드 마스코트', '넘긴 머리 / 큰 하이라이트 눈'],
  ja: ['大きな眼鏡 / ドリンクカップ', 'ヘッドセット / 分析家', 'カチンコの頭 / マスコット', 'ゴルフボールの頭 / 帽子', 'ヘッドホン / 閉じた目の表情', '猫耳 / ファン', '帽子 / 眼鏡', 'ハートの目 / アイドル', '緑の接眼鏡 / 厚い髪', 'スマートフォン / ソーシャル', 'おにぎり衣装 / 単純な顔', 'フード / 観察者', '野球ボールの頭 / ヘッドセット', '二人組 / ステージ', '星形の目のハイライト / 黄色いフード', 'サッカーボール / ヘアバンドのマスコット', '流した髪 / 大きくハイライトのある目'],
};

export function getInterpretationView(agent, interpretation, language = 'en') {
  if (!interpretation) return null;
  if (language === 'en') return {
    labels: { visualMotif: 'Visual concept', primaryObject: 'Main motif', mood: 'Mood', color: 'Color direction', coreRole: 'Core role', composition: 'Composition' },
    values: interpretation,
  };
  const catalog = catalogs[language];
  if (!catalog) throw new Error('Unsupported prompt language.');
  const translations = new Map(phrases.map(([en, ko, ja]) => [en, language === 'ko' ? ko : ja]));
  const original = analyzeAgent(agent);
  const localizeValue = (key, value) => {
    if (value !== original[key]) return value;
    if ((key === 'coreRole' && (agent.purpose || agent.role)) || (key === 'personality' && agent.tone)) return value;
    const concept = agent.visualNotes || agent.concept;
    const prefix = `${concept}: `;
    if (key === 'visualMotif' && concept && value.startsWith(prefix)) {
      const phrase = value.slice(prefix.length);
      return `${prefix}${translations.get(phrase) || phrase}`;
    }
    return translations.get(value) || value;
  };
  return {
    labels: catalog.labels,
    values: Object.fromEntries(Object.entries(interpretation).map(([key, value]) => [key, localizeValue(key, value)])),
  };
}

export function getPromptView(agent, interpretation, prompt, language = 'en') {
  if (!prompt || !interpretation || language === 'en') return { text: prompt, status: 'original' };
  const catalog = catalogs[language];
  if (!catalog) throw new Error('Unsupported prompt language.');
  if (prompt !== buildImagePrompt(agent, interpretation)) return { text: prompt, status: 'edited' };
  const translatedInterpretation = getInterpretationView(agent, interpretation, language).values;
  const label = key => catalog.labels[key] || key;
  const similar = compareWithExistingAgents(interpretation);
  const styleText = key => catalog.style[key] || styleDNA[key];
  const conceptText = key => catalog.concepts[key] || conceptVariations[key];
  return {
    status: 'localized',
    text: [
      catalog.introduction,
      catalog.modelHeading,
      ...catalog.modelInstructions,
      catalog.fixed,
      ...Object.keys(styleDNA).map(key => `${label(key)}: ${styleText(key)}`),
      catalog.variations,
      ...Object.keys(conceptVariations).map(key => `${label(key)}: ${conceptText(key)}`),
      catalog.referenceHeading,
      catalog.references,
      `${catalog.referenceOrder}: ${refs.map(([name], i) => `${i + 1}. ${name}`).join('; ')}`,
      catalog.agentHeading,
      JSON.stringify(Object.fromEntries(Object.entries(agent).map(([key, value]) => [label(key), value])), null, 2),
      catalog.conceptHeading,
      catalog.conceptRule,
      ...Object.entries(translatedInterpretation).map(([key, value]) => `${label(key)}: ${value}`),
      catalog.semantic,
      similar.length ? `${catalog.differentiate}: ${similar.map(item => {
        const refIndex = refs.findIndex(([name]) => name === item.name);
        const fallbackMotif = refIndex >= 0 ? refs[refIndex][2] : item.motif;
        return `${item.name} (${motifs[language][refIndex] || fallbackMotif})`;
      }).join('; ')}` : catalog.distinct,
      catalog.crop,
    ].join('\n\n'),
  };
}

export function getVariationPromptView(agent, interpretation, prompt, index, language = 'en', sourcePrompt = '') {
  if (!prompt || !agent || !interpretation || language === 'en') return { text: prompt || '', status: 'original' };
  const catalog = variationTranslations[language];
  if (!catalog) throw new Error('Unsupported prompt language.');
  const plan = catalog.plans[index];
  if (!plan || prompt !== buildVariationPrompt(agent, interpretation, sourcePrompt, index)) return { text: prompt, status: 'edited' };

  const base = buildImagePrompt(agent, interpretation);
  const translatedBase = getPromptView(agent, interpretation, base, language).text;
  const hasCustomDirection = sourcePrompt.trim() && sourcePrompt.trim() !== base.trim();
  return {
    status: 'localized',
    text: [
      translatedBase,
      ...(hasCustomDirection ? [catalog.creative, sourcePrompt, catalog.creativeRule] : []),
      `${catalog.heading} ${index + 1}: ${plan[0]}`,
      plan[1],
      catalog.closing,
    ].join('\n\n'),
  };
}
